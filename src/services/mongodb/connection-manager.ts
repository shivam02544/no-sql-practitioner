import { MongoClient, MongoClientOptions, ServerApiVersion, Sort, CollationOptions } from 'mongodb'
import { MongoDBConnection, ConnectionOptions, DatabaseInfo, CollectionInfo, Document, IndexInfo, ExplainPlan, AggregationPipeline, AggregationResult, QueryFilter, FindResult, IndexDefinition, Collation } from '@/types'
import { encrypt, decrypt } from '@/lib/encryption'

export class ConnectionManager {
  private clients: Map<string, MongoClient> = new Map()
  private connectionCache: Map<string, { connection: MongoDBConnection; expiresAt: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async createConnection(connection: Omit<MongoDBConnection, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastConnectedAt'>): Promise<MongoDBConnection> {
    const id = crypto.randomUUID()
    const now = new Date()

    const newConnection: MongoDBConnection = {
      ...connection,
      id,
      isActive: false,
      createdAt: now,
      updatedAt: now,
      uri: encrypt(connection.uri),
    }

    await this.testConnection(newConnection)

    return newConnection
  }

  private extractDatabaseFromUri(uri: string): string | null {
    try {
      const match = uri.match(/\/([^/?]+)(\?|$)/)
      if (match && match[1] && match[1] !== 'admin') {
        return match[1]
      }
    } catch {}
    return null
  }

  async testConnection(connection: MongoDBConnection): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
    const startTime = Date.now()
    let client: MongoClient | null = null

    try {
      const uri = decrypt(connection.uri)
      const options = this.buildClientOptions(connection.options)

      client = new MongoClient(uri, options)
      await client.connect()
      try {
        await client.db('admin').command({ ping: 1 })
      } catch {
        const targetDb = connection.database || this.extractDatabaseFromUri(uri) || 'test'
        await client.db(targetDb).command({ ping: 1 })
      }

      const latencyMs = Date.now() - startTime
      return { success: true, latencyMs }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }
    } finally {
      if (client) {
        await client.close().catch(() => {})
      }
    }
  }

  async getClient(connectionId: string, connection: MongoDBConnection): Promise<MongoClient> {
    const cached = this.clients.get(connectionId)
    if (cached) {
      try {
        await cached.db('admin').command({ ping: 1 })
        return cached
      } catch {
        this.clients.delete(connectionId)
      }
    }

    const uri = decrypt(connection.uri)
    const options = this.buildClientOptions(connection.options)

    const client = new MongoClient(uri, options)
    await client.connect()

    this.clients.set(connectionId, client)
    return client
  }

  async getDatabases(connectionId: string, connection: MongoDBConnection): Promise<DatabaseInfo[]> {
    const client = await this.getClient(connectionId, connection)
    let databases: Array<{ name: string; sizeOnDisk?: number }> = []

    try {
      const adminDb = client.db('admin')
      const result = await adminDb.command({ listDatabases: 1, nameOnly: false })
      databases = result.databases || []
    } catch {
      // If listDatabases is restricted by Atlas role, use the connection database
      const fallbackDb = connection.database || this.extractDatabaseFromUri(decrypt(connection.uri)) || 'test'
      databases = [{ name: fallbackDb }]
    }

    // Also if connection.database was explicitly set, make sure it's in the list
    if (connection.database && !databases.some(d => d.name === connection.database)) {
      databases.push({ name: connection.database })
    }

    const databaseInfos: DatabaseInfo[] = []

    for (const db of databases) {
      if (['admin', 'local', 'config'].includes(db.name) && databases.length > 1) continue

      try {
        const dbInstance = client.db(db.name)
        const stats = await dbInstance.command({ dbStats: 1 })

        databaseInfos.push({
          name: db.name,
          sizeOnDisk: stats.dataSize + stats.indexSize,
          dataSize: stats.dataSize,
          indexSize: stats.indexSize,
          collections: stats.collections,
          views: stats.views || 0,
          objects: stats.objects,
          avgObjSize: stats.avgObjSize || 0,
          storageSize: stats.storageSize,
          freeStorageSize: stats.freeStorageSize || 0,
        })
      } catch {
        // Count collections directly if dbStats is restricted
        let collCount = 0
        try {
          const colls = await client.db(db.name).listCollections().toArray()
          collCount = colls.length
        } catch {}

        databaseInfos.push({
          name: db.name,
          sizeOnDisk: db.sizeOnDisk || 0,
          dataSize: 0,
          indexSize: 0,
          collections: collCount,
          views: 0,
          objects: 0,
          avgObjSize: 0,
          storageSize: 0,
          freeStorageSize: 0,
        })
      }
    }

    return databaseInfos
  }

  async getCollections(connectionId: string, connection: MongoDBConnection, databaseName: string): Promise<CollectionInfo[]> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)

    const collections = await db.listCollections().toArray()
    const collectionInfos: CollectionInfo[] = []

    for (const coll of collections) {
      if (coll.name.startsWith('system.')) continue

      let count = 0
      let size = 0
      let avgObjSize = 0
      let storageSize = 0
      let totalIndexSize = 0
      let indexes: IndexInfo[] = []

      try {
        indexes = await this.getIndexes(connectionId, connection, databaseName, coll.name)
      } catch {}

      try {
        const stats = await db.command({ collStats: coll.name })
        count = stats.count ?? 0
        size = stats.size || 0
        avgObjSize = stats.avgObjSize || 0
        storageSize = stats.storageSize || 0
        totalIndexSize = stats.totalIndexSize || 0
      } catch {
        // Fallback for MongoDB 6.0+ / Atlas permissions
        try {
          count = await db.collection(coll.name).estimatedDocumentCount()
        } catch {
          try {
            count = await db.collection(coll.name).countDocuments({})
          } catch {}
        }
      }

      collectionInfos.push({
        name: coll.name,
        type: (coll.type === 'view' ? 'view' : 'collection'),
        count,
        size,
        avgObjSize,
        storageSize,
        freeStorageSize: 0,
        totalIndexSize,
        indexes,
        capped: false,
      })
    }

    return collectionInfos
  }

  async getIndexes(connectionId: string, connection: MongoDBConnection, databaseName: string, collectionName: string): Promise<IndexInfo[]> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const indexes = await collection.indexes()
    return indexes.map(idx => ({
      name: idx.name || 'default',
      key: idx.key,
      unique: idx.unique || false,
      sparse: idx.sparse || false,
      background: idx.background || false,
      version: idx.v || 1,
      collation: idx.collation as unknown as Collation | undefined,
      partialFilterExpression: idx.partialFilterExpression,
      expireAfterSeconds: idx.expireAfterSeconds,
      weights: idx.weights,
      default_language: idx.default_language,
      language_override: idx.language_override,
      textIndexVersion: idx.textIndexVersion,
      sphereVersion: idx.sphereVersion,
      bits: idx.bits,
      min: idx.min,
      max: idx.max,
      bucketSize: idx.bucketSize,
    }))
  }

  async findDocuments(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    filter: QueryFilter
  ): Promise<FindResult> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const startTime = Date.now()

    const cursor = collection.find(filter.filter, {
      projection: filter.projection,
      sort: filter.sort as Sort | undefined,
      limit: filter.limit,
      skip: filter.skip,
      collation: filter.collation as CollationOptions | undefined,
      hint: filter.hint,
      maxTimeMS: filter.maxTimeMS,
      batchSize: filter.batchSize,
    })

    const documents = await cursor.toArray()
    const totalCount = await collection.countDocuments(filter.filter)
    const executionTimeMs = Date.now() - startTime

    let explainPlan: ExplainPlan | undefined
    if (filter.filter && Object.keys(filter.filter).length > 0) {
      try {
        explainPlan = await this.explainQuery(connectionId, connection, databaseName, collectionName, filter)
      } catch {
        // Explain failed, continue without it
      }
    }

    return {
      documents,
      totalCount,
      hasMore: filter.limit ? documents.length === filter.limit && (filter.skip || 0) + documents.length < totalCount : false,
      executionTimeMs,
      explainPlan,
    }
  }

  async explainQuery(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    filter: QueryFilter
  ): Promise<ExplainPlan> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const explainResult = await collection.find(filter.filter, {
      projection: filter.projection,
      sort: filter.sort as Sort | undefined,
      limit: filter.limit,
      skip: filter.skip,
      collation: filter.collation as CollationOptions | undefined,
      hint: filter.hint,
    }).explain('executionStats')

    return explainResult as ExplainPlan
  }

  async aggregate(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    pipeline: AggregationPipeline
  ): Promise<AggregationResult> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const startTime = Date.now()

    const documents = await collection.aggregate(pipeline.stages.map(s => s.expression), pipeline.options).toArray()
    const executionTimeMs = Date.now() - startTime

    let explainPlan: ExplainPlan | undefined
    try {
      const explainResult = await collection.aggregate(pipeline.stages.map(s => s.expression), {
        ...pipeline.options,
        explain: true,
      }).next()
      explainPlan = explainResult as ExplainPlan
    } catch {
      // Explain failed
    }

    return {
      documents,
      executionTimeMs,
      explainPlan,
      pipeline: pipeline.stages,
    }
  }

  async insertDocument(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    document: Document
  ): Promise<{ insertedId: string }> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const result = await collection.insertOne(document)
    return { insertedId: result.insertedId.toString() }
  }

  async insertDocuments(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    documents: Document[]
  ): Promise<{ insertedIds: string[] }> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const result = await collection.insertMany(documents)
    return { insertedIds: Object.values(result.insertedIds).map(id => id.toString()) }
  }

  async updateDocument(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    filter: Document,
    update: Document,
    options?: { upsert?: boolean; multi?: boolean }
  ): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    if (options?.multi) {
      const result = await collection.updateMany(filter, update, { upsert: options?.upsert })
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId?.toString() }
    } else {
      const result = await collection.updateOne(filter, update, { upsert: options?.upsert })
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId?.toString() }
    }
  }

  async deleteDocument(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    filter: Document,
    options?: { multi?: boolean }
  ): Promise<{ deletedCount: number }> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    if (options?.multi) {
      const result = await collection.deleteMany(filter)
      return { deletedCount: result.deletedCount }
    } else {
      const result = await collection.deleteOne(filter)
      return { deletedCount: result.deletedCount }
    }
  }

  async createIndex(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    index: IndexDefinition
  ): Promise<{ name: string }> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    const name = await collection.createIndex(index.keys, index.options)
    return { name }
  }

  async dropIndex(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    indexName: string
  ): Promise<void> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    await collection.dropIndex(indexName)
  }

  async createCollection(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string,
    options?: Document
  ): Promise<void> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)

    await db.createCollection(collectionName, options)
  }

  async dropCollection(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string
  ): Promise<void> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)

    await db.collection(collectionName).drop()
  }

  async runCommand(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    command: Document
  ): Promise<Document> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)

    return await db.command(command)
  }

  async getServerStatus(connectionId: string, connection: MongoDBConnection): Promise<Document> {
    const client = await this.getClient(connectionId, connection)
    return await client.db('admin').command({ serverStatus: 1 })
  }

  async getCollectionStats(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string
  ): Promise<Document> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)

    return await db.command({ collStats: collectionName })
  }

  async getIndexStats(
    connectionId: string,
    connection: MongoDBConnection,
    databaseName: string,
    collectionName: string
  ): Promise<Document[]> {
    const client = await this.getClient(connectionId, connection)
    const db = client.db(databaseName)
    const collection = db.collection(collectionName)

    return await collection.aggregate([{ $indexStats: {} }]).toArray()
  }

  private buildClientOptions(options?: ConnectionOptions): MongoClientOptions {
    return {
      maxPoolSize: options?.maxPoolSize || 10,
      minPoolSize: options?.minPoolSize || 0,
      maxIdleTimeMS: options?.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS || 30000,
      socketTimeoutMS: options?.socketTimeoutMS || 45000,
      connectTimeoutMS: options?.connectTimeoutMS || 30000,
      retryWrites: true,
      retryReads: true,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      ...(options?.ssl && { tls: true }),
      ...(options?.replicaSet && { replicaSet: options.replicaSet }),
      ...(options?.authSource && { authSource: options.authSource }),
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const client = this.clients.get(connectionId)
    if (client) {
      await client.close()
      this.clients.delete(connectionId)
    }
  }

  async closeAllConnections(): Promise<void> {
    for (const [, client] of this.clients) {
      try {
        await client.close()
      } catch {
        // Ignore errors during cleanup
      }
    }
    this.clients.clear()
  }

  getCachedConnection(connectionId: string): MongoDBConnection | null {
    const cached = this.connectionCache.get(connectionId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.connection
    }
    this.connectionCache.delete(connectionId)
    return null
  }

  setCachedConnection(connectionId: string, connection: MongoDBConnection): void {
    this.connectionCache.set(connectionId, {
      connection,
      expiresAt: Date.now() + this.CACHE_TTL,
    })
  }

  invalidateCache(connectionId: string): void {
    this.connectionCache.delete(connectionId)
  }
}

export const connectionManager = new ConnectionManager()