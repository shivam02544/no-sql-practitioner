import { MongoClient, Db } from 'mongodb'
import { SandboxEnvironment, SandboxDatabase, Document } from '@/types'

const SAMPLE_DATASETS: Record<string, SandboxDatabase> = {
  'sample_mflix': {
    name: 'sample_mflix',
    collections: [
      {
        name: 'movies',
        documents: [
          {
            _id: '1',
            title: 'The Shawshank Redemption',
            year: 1994,
            runtime: 142,
            genres: ['Drama'],
            director: 'Frank Darabont',
            cast: ['Tim Robbins', 'Morgan Freeman'],
            imdb: { rating: 9.3, votes: 2000000 },
            tomato: { viewer: { rating: 4.5, numReviews: 100000 } },
            awards: { wins: 1, nominations: 7, text: 'Nominated for 7 Oscars.' },
          },
          {
            _id: '2',
            title: 'The Godfather',
            year: 1972,
            runtime: 175,
            genres: ['Crime', 'Drama'],
            director: 'Francis Ford Coppola',
            cast: ['Marlon Brando', 'Al Pacino'],
            imdb: { rating: 9.2, votes: 1500000 },
            tomato: { viewer: { rating: 4.7, numReviews: 80000 } },
            awards: { wins: 3, nominations: 11, text: 'Won 3 Oscars.' },
          },
          {
            _id: '3',
            title: 'The Dark Knight',
            year: 2008,
            runtime: 152,
            genres: ['Action', 'Crime', 'Drama'],
            director: 'Christopher Nolan',
            cast: ['Christian Bale', 'Heath Ledger'],
            imdb: { rating: 9.0, votes: 2200000 },
            tomato: { viewer: { rating: 4.6, numReviews: 120000 } },
            awards: { wins: 2, nominations: 8, text: 'Won 2 Oscars.' },
          },
        ],
        indexes: [
          { name: 'title_1', keys: { title: 1 }, options: {} },
          { name: 'year_-1', keys: { year: -1 }, options: {} },
          { name: 'genres_1', keys: { genres: 1 }, options: {} },
          { name: 'imdb.rating_-1', keys: { 'imdb.rating': -1 }, options: {} },
        ],
      },
      {
        name: 'users',
        documents: [
          { _id: '1', name: 'John Doe', email: 'john@example.com', password: 'hashed_pw', preferences: { genre: ['Action', 'Sci-Fi'], language: 'en' } },
          { _id: '2', name: 'Jane Smith', email: 'jane@example.com', password: 'hashed_pw', preferences: { genre: ['Drama', 'Romance'], language: 'en' } },
        ],
        indexes: [
          { name: 'email_1', keys: { email: 1 }, options: { unique: true } },
        ],
      },
    ],
  },
  'sample_analytics': {
    name: 'sample_analytics',
    collections: [
      {
        name: 'transactions',
        documents: [
          { _id: '1', customerId: 'C001', date: new Date('2024-01-15'), amount: 150.00, category: 'Electronics', items: [{ productId: 'P001', qty: 1, price: 150.00 }] },
          { _id: '2', customerId: 'C002', date: new Date('2024-01-16'), amount: 89.99, category: 'Books', items: [{ productId: 'P002', qty: 2, price: 44.99 }] },
          { _id: '3', customerId: 'C001', date: new Date('2024-01-20'), amount: 299.99, category: 'Electronics', items: [{ productId: 'P003', qty: 1, price: 299.99 }] },
        ],
        indexes: [
          { name: 'customerId_1', keys: { customerId: 1 }, options: {} },
          { name: 'date_-1', keys: { date: -1 }, options: {} },
        ],
      },
      {
        name: 'customers',
        documents: [
          { _id: 'C001', name: 'Alice Johnson', email: 'alice@example.com', tier: 'premium', joinDate: new Date('2023-06-01') },
          { _id: 'C002', name: 'Bob Wilson', email: 'bob@example.com', tier: 'standard', joinDate: new Date('2023-09-15') },
        ],
        indexes: [
          { name: 'email_1', keys: { email: 1 }, options: { unique: true } },
          { name: 'tier_1', keys: { tier: 1 }, options: {} },
        ],
      },
    ],
  },
  'sample_geospatial': {
    name: 'sample_geospatial',
    collections: [
      {
        name: 'restaurants',
        documents: [
          { _id: '1', name: 'Pizza Palace', cuisine: 'Italian', location: { type: 'Point', coordinates: [-73.9857, 40.7484] }, address: { street: '123 Main St', city: 'New York', zip: '10001' }, rating: 4.5, priceRange: '$$' },
          { _id: '2', name: 'Sushi Zen', cuisine: 'Japanese', location: { type: 'Point', coordinates: [-73.9819, 40.7678] }, address: { street: '456 Broadway', city: 'New York', zip: '10002' }, rating: 4.8, priceRange: '$$$' },
          { _id: '3', name: 'Burger Barn', cuisine: 'American', location: { type: 'Point', coordinates: [-73.9912, 40.7501] }, address: { street: '789 5th Ave', city: 'New York', zip: '10003' }, rating: 4.2, priceRange: '$' },
        ],
        indexes: [
          { name: 'location_2dsphere', keys: { location: '2dsphere' }, options: {} },
          { name: 'cuisine_1', keys: { cuisine: 1 }, options: {} },
        ],
      },
    ],
  },
  'sample_training': {
    name: 'sample_training',
    collections: [
      {
        name: 'grades',
        documents: [
          { _id: '1', student_id: 1000, class_id: 10, scores: [{ type: 'exam', score: 85.5 }, { type: 'quiz', score: 90.0 }, { type: 'homework', score: 95.5 }] },
          { _id: '2', student_id: 1001, class_id: 10, scores: [{ type: 'exam', score: 78.0 }, { type: 'quiz', score: 88.5 }, { type: 'homework', score: 92.0 }] },
        ],
        indexes: [
          { name: 'student_id_1', keys: { student_id: 1 }, options: {} },
          { name: 'class_id_1', keys: { class_id: 1 }, options: {} },
        ],
      },
    ],
  },
}

export class SandboxManager {
  private environments: Map<string, SandboxEnvironment> = new Map()
  private client: MongoClient | null = null
  private readonly SANDBOX_URI = process.env.SANDBOX_MONGODB_URI || 'mongodb://localhost:27017'
  private readonly SANDBOX_DB = process.env.SANDBOX_MONGODB_DATABASE || 'mongodb_sandbox'

  async initialize(): Promise<void> {
    try {
      this.client = new MongoClient(this.SANDBOX_URI)
      await this.client.connect()
      await this.loadSampleData()
    } catch (error) {
      console.warn('Sandbox MongoDB not available, using in-memory mode:', error)
    }
  }

  private async loadSampleData(): Promise<void> {
    if (!this.client) return

    const db = this.client.db(this.SANDBOX_DB)

    for (const [key, dataset] of Object.entries(SAMPLE_DATASETS)) {
      const envId = `sandbox-${key}`
      const env: SandboxEnvironment = {
        id: envId,
        name: key.replace('sample_', '').replace('_', ' '),
        description: `Sample ${key.replace('sample_', '')} dataset for learning`,
        databases: [dataset],
        isActive: true,
        createdAt: new Date(),
      }

      await this.setupDatabase(db, dataset)
      this.environments.set(envId, env)
    }
  }

  private async setupDatabase(db: Db, dataset: SandboxDatabase): Promise<void> {
    for (const collection of dataset.collections) {
      const coll = db.collection(collection.name)
      await coll.deleteMany({})
      if (collection.documents.length > 0) {
        await coll.insertMany(collection.documents)
      }
      for (const index of collection.indexes) {
        try {
          await coll.createIndex(index.keys, index.options)
        } catch {
          // Index might already exist
        }
      }
    }
  }

  async createEnvironment(name: string, description: string, databases: SandboxDatabase[]): Promise<SandboxEnvironment> {
    const id = `sandbox-${crypto.randomUUID()}`
    const env: SandboxEnvironment = {
      id,
      name,
      description,
      databases,
      isActive: true,
      createdAt: new Date(),
    }

    if (this.client) {
      const db = this.client.db(this.SANDBOX_DB)
      for (const dataset of databases) {
        await this.setupDatabase(db, dataset)
      }
    }

    this.environments.set(id, env)
    return env
  }

  getEnvironment(id: string): SandboxEnvironment | undefined {
    return this.environments.get(id)
  }

  getAllEnvironments(): SandboxEnvironment[] {
    return Array.from(this.environments.values())
  }

  async resetEnvironment(id: string): Promise<boolean> {
    const env = this.environments.get(id)
    if (!env) return false

    if (this.client) {
      const db = this.client.db(this.SANDBOX_DB)
      for (const dataset of env.databases) {
        await this.setupDatabase(db, dataset)
      }
    }

    env.resetAt = new Date()
    return true
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    const env = this.environments.get(id)
    if (!env) return false

    if (this.client) {
      const db = this.client.db(this.SANDBOX_DB)
      for (const dataset of env.databases) {
        for (const collection of dataset.collections) {
          await db.collection(collection.name).drop().catch(() => {})
        }
      }
    }

    this.environments.delete(id)
    return true
  }

  async executeQuery(
    environmentId: string,
    databaseName: string,
    collectionName: string,
    operation: string,
    params: Document
  ): Promise<Document> {
    if (!this.client) {
      throw new Error('Sandbox not initialized')
    }

    const db = this.client.db(databaseName)
    const collection = db.collection(collectionName)

    switch (operation) {
      case 'find':
        return { documents: await collection.find(params.filter || {}).limit(params.limit || 20).toArray() }
      case 'findOne':
        return { document: await collection.findOne(params.filter || {}) }
      case 'insertOne':
        return { result: await collection.insertOne(params.document) }
      case 'insertMany':
        return { result: await collection.insertMany(params.documents) }
      case 'updateOne':
        return { result: await collection.updateOne(params.filter, params.update, { upsert: params.upsert }) }
      case 'updateMany':
        return { result: await collection.updateMany(params.filter, params.update, { upsert: params.upsert }) }
      case 'deleteOne':
        return { result: await collection.deleteOne(params.filter) }
      case 'deleteMany':
        return { result: await collection.deleteMany(params.filter) }
      case 'aggregate':
        return { documents: await collection.aggregate(params.pipeline).toArray() }
      case 'count':
        return { count: await collection.countDocuments(params.filter || {}) }
      case 'distinct':
        return { values: await collection.distinct(params.field, params.filter) }
      case 'createIndex':
        return { indexName: await collection.createIndex(params.keys, params.options) }
      case 'dropIndex':
        return { result: await collection.dropIndex(params.indexName) }
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  }

  getSampleDatasets(): Record<string, SandboxDatabase> {
    return SAMPLE_DATASETS
  }

  getTutorialDatasets(): Array<{ id: string; name: string; description: string; collections: string[] }> {
    return Object.entries(SAMPLE_DATASETS).map(([key, db]) => ({
      id: key,
      name: key.replace('sample_', '').replace('_', ' '),
      description: `Learn with the ${key.replace('sample_', '')} sample dataset`,
      collections: db.collections.map(c => c.name),
    }))
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
    }
  }
}

export const sandboxManager = new SandboxManager()