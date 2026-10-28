import { Document, QueryFilter, AggregationPipeline, MongoDBConnection, IndexDefinition } from '@/types'

export interface GeneratedCommand {
  shell: string
  driver: string
  python?: string
  description: string
  category: 'find' | 'aggregate' | 'update' | 'delete' | 'index' | 'command' | 'admin'
}

export class CommandGeneratorService {
  generateFindCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: QueryFilter
  ): GeneratedCommand {
    let cmd = `db.${collection}.find(${JSON.stringify(filter.filter, null, 2)}`

    if (filter.projection && Object.keys(filter.projection).length > 0) {
      cmd += `, ${JSON.stringify(filter.projection, null, 2)}`
    }

    cmd += ')'

    if (filter.sort && Object.keys(filter.sort).length > 0) {
      cmd += `.sort(${JSON.stringify(filter.sort, null, 2)})`
    }

    if (filter.skip && filter.skip > 0) {
      cmd += `.skip(${filter.skip})`
    }

    if (filter.limit && filter.limit > 0) {
      cmd += `.limit(${filter.limit})`
    }

    if (filter.collation) {
      cmd += `.collation(${JSON.stringify(filter.collation, null, 2)})`
    }

    if (filter.hint) {
      cmd += `.hint(${JSON.stringify(filter.hint, null, 2)})`
    }

    if (filter.maxTimeMS) {
      cmd += `.maxTimeMS(${filter.maxTimeMS})`
    }

    if (filter.batchSize) {
      cmd += `.batchSize(${filter.batchSize})`
    }

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const cursor = db.collection('${collection}').find(${JSON.stringify(filter.filter, null, 2)}, {
  projection: ${JSON.stringify(filter.projection || {}, null, 2)},
  sort: ${JSON.stringify(filter.sort || {}, null, 2)},
  skip: ${filter.skip || 0},
  limit: ${filter.limit || 0},
${filter.collation ? `  collation: ${JSON.stringify(filter.collation, null, 2)},` : ''}
${filter.hint ? `  hint: ${JSON.stringify(filter.hint, null, 2)},` : ''}
${filter.maxTimeMS ? `  maxTimeMS: ${filter.maxTimeMS},` : ''}
${filter.batchSize ? `  batchSize: ${filter.batchSize},` : ''}
});

const documents = await cursor.toArray();`

    return {
      shell,
      driver,
      description: 'Finds documents matching the filter criteria with optional projection, sorting, pagination, and other options.',
      category: 'find',
    }
  }

  generateFindOneCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document,
    projection?: Document
  ): GeneratedCommand {
    let cmd = `db.${collection}.findOne(${JSON.stringify(filter, null, 2)}`
    if (projection && Object.keys(projection).length > 0) {
      cmd += `, ${JSON.stringify(projection, null, 2)}`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const document = await db.collection('${collection}').findOne(${JSON.stringify(filter, null, 2)}, {
  projection: ${JSON.stringify(projection || {}, null, 2)},
});`

    return {
      shell,
      driver,
      description: 'Finds a single document matching the filter criteria.',
      category: 'find',
    }
  }

  generateCountCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document
  ): GeneratedCommand {
    const cmd = `db.${collection}.countDocuments(${JSON.stringify(filter, null, 2)})`

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const count = await db.collection('${collection}').countDocuments(${JSON.stringify(filter, null, 2)});`

    return {
      shell,
      driver,
      description: 'Counts documents matching the filter criteria.',
      category: 'find',
    }
  }

  generateDistinctCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    field: string,
    filter?: Document
  ): GeneratedCommand {
    let cmd = `db.${collection}.distinct("${field}"`
    if (filter && Object.keys(filter).length > 0) {
      cmd += `, ${JSON.stringify(filter, null, 2)}`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const values = await db.collection('${collection}').distinct("${field}"${filter ? `, ${JSON.stringify(filter, null, 2)}` : ''});`

    return {
      shell,
      driver,
      description: `Finds distinct values for the field "${field}".`,
      category: 'find',
    }
  }

  generateAggregateCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    pipeline: AggregationPipeline
  ): GeneratedCommand {
    const stages = pipeline.stages.filter(s => s.enabled).map(s => s.expression)
    const options = pipeline.options

    let cmd = `db.${collection}.aggregate(${JSON.stringify(stages, null, 2)}`
    if (options && Object.keys(options).length > 0) {
      cmd += `, ${this.formatOptions(options)}`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const pipeline = ${JSON.stringify(stages, null, 2)};

const results = await db.collection('${collection}').aggregate(pipeline${options ? `, ${this.formatDriverOptions(options)}` : ''}).toArray();`

    return {
      shell,
      driver,
      description: 'Executes an aggregation pipeline with multiple stages for data transformation and analysis.',
      category: 'aggregate',
    }
  }

  generateInsertOneCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    document: Document
  ): GeneratedCommand {
    const cmd = `db.${collection}.insertOne(${JSON.stringify(document, null, 2)})`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').insertOne(${JSON.stringify(document, null, 2)});
console.log('Inserted ID:', result.insertedId);`

    return {
      shell,
      driver,
      description: 'Inserts a single document into the collection.',
      category: 'update',
    }
  }

  generateInsertManyCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    documents: Document[]
  ): GeneratedCommand {
    const cmd = `db.${collection}.insertMany(${JSON.stringify(documents, null, 2)})`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').insertMany(${JSON.stringify(documents, null, 2)});
console.log('Inserted IDs:', result.insertedIds);`

    return {
      shell,
      driver,
      description: 'Inserts multiple documents into the collection.',
      category: 'update',
    }
  }

  generateUpdateOneCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document,
    update: Document,
    options?: { upsert?: boolean }
  ): GeneratedCommand {
    let cmd = `db.${collection}.updateOne(${JSON.stringify(filter, null, 2)}, ${JSON.stringify(update, null, 2)}`
    if (options?.upsert) {
      cmd += `, { upsert: true }`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').updateOne(
  ${JSON.stringify(filter, null, 2)},
  ${JSON.stringify(update, null, 2)}${options?.upsert ? `,\n  { upsert: true }` : ''}
);
console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);`

    return {
      shell,
      driver,
      description: 'Updates a single document matching the filter.',
      category: 'update',
    }
  }

  generateUpdateManyCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document,
    update: Document,
    options?: { upsert?: boolean }
  ): GeneratedCommand {
    let cmd = `db.${collection}.updateMany(${JSON.stringify(filter, null, 2)}, ${JSON.stringify(update, null, 2)}`
    if (options?.upsert) {
      cmd += `, { upsert: true }`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').updateMany(
  ${JSON.stringify(filter, null, 2)},
  ${JSON.stringify(update, null, 2)}${options?.upsert ? `,\n  { upsert: true }` : ''}
);
console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);`

    return {
      shell,
      driver,
      description: 'Updates all documents matching the filter.',
      category: 'update',
    }
  }

  generateReplaceOneCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document,
    replacement: Document,
    options?: { upsert?: boolean }
  ): GeneratedCommand {
    let cmd = `db.${collection}.replaceOne(${JSON.stringify(filter, null, 2)}, ${JSON.stringify(replacement, null, 2)}`
    if (options?.upsert) {
      cmd += `, { upsert: true }`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').replaceOne(
  ${JSON.stringify(filter, null, 2)},
  ${JSON.stringify(replacement, null, 2)}${options?.upsert ? `,\n  { upsert: true }` : ''}
);
console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);`

    return {
      shell,
      driver,
      description: 'Replaces a single document matching the filter.',
      category: 'update',
    }
  }

  generateDeleteOneCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document
  ): GeneratedCommand {
    const cmd = `db.${collection}.deleteOne(${JSON.stringify(filter, null, 2)})`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').deleteOne(${JSON.stringify(filter, null, 2)});
console.log('Deleted:', result.deletedCount);`

    return {
      shell,
      driver,
      description: 'Deletes a single document matching the filter.',
      category: 'delete',
    }
  }

  generateDeleteManyCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: Document
  ): GeneratedCommand {
    const cmd = `db.${collection}.deleteMany(${JSON.stringify(filter, null, 2)})`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').deleteMany(${JSON.stringify(filter, null, 2)});
console.log('Deleted:', result.deletedCount);`

    return {
      shell,
      driver,
      description: 'Deletes all documents matching the filter.',
      category: 'delete',
    }
  }

  generateCreateIndexCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    index: IndexDefinition
  ): GeneratedCommand {
    const keys = JSON.stringify(index.keys, null, 2)
    const options = JSON.stringify(index.options, null, 2)

    let cmd = `db.${collection}.createIndex(${keys}`
    if (index.options && Object.keys(index.options).length > 0) {
      cmd += `, ${options}`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const indexName = await db.collection('${collection}').createIndex(${keys}, ${options});
console.log('Created index:', indexName);`

    return {
      shell,
      driver,
      description: `Creates an index on the collection with keys: ${Object.keys(index.keys).join(', ')}`,
      category: 'index',
    }
  }

  generateDropIndexCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    indexName: string
  ): GeneratedCommand {
    const cmd = `db.${collection}.dropIndex("${indexName}")`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.collection('${collection}').dropIndex("${indexName}");
console.log('Dropped index:', result);`

    return {
      shell,
      driver,
      description: `Drops the index "${indexName}" from the collection.`,
      category: 'index',
    }
  }

  generateListIndexesCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string
  ): GeneratedCommand {
    const cmd = `db.${collection}.getIndexes()`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const indexes = await db.collection('${collection}').indexes();
console.log(indexes);`

    return {
      shell,
      driver,
      description: 'Lists all indexes on the collection.',
      category: 'index',
    }
  }

  generateCreateCollectionCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    options?: Document
  ): GeneratedCommand {
    let cmd = `db.createCollection("${collection}"`
    if (options && Object.keys(options).length > 0) {
      cmd += `, ${JSON.stringify(options, null, 2)}`
    }
    cmd += ')'

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `await db.createCollection("${collection}"${options ? `, ${JSON.stringify(options, null, 2)}` : ''});
console.log('Collection created');`

    return {
      shell,
      driver,
      description: 'Creates a new collection with optional configuration.',
      category: 'command',
    }
  }

  generateDropCollectionCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string
  ): GeneratedCommand {
    const cmd = `db.${collection}.drop()`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `await db.collection('${collection}').drop();
console.log('Collection dropped');`

    return {
      shell,
      driver,
      description: 'Drops the collection and all its data.',
      category: 'command',
    }
  }

  generateExplainCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    filter: QueryFilter
  ): GeneratedCommand {
    const cmd = `db.${collection}.find(${JSON.stringify(filter.filter, null, 2)}).explain("executionStats")`

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const explain = await db.collection('${collection}').find(${JSON.stringify(filter.filter, null, 2)}).explain();
console.log(JSON.stringify(explain, null, 2));`

    return {
      shell,
      driver,
      description: 'Returns the query execution plan with statistics.',
      category: 'command',
    }
  }

  generateAdminCommand(
    connection: MongoDBConnection,
    database: string,
    command: Document
  ): GeneratedCommand {
    const cmd = `db.adminCommand(${JSON.stringify(command, null, 2)})`
    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `const result = await db.admin().command(${JSON.stringify(command, null, 2)});
console.log(result);`

    return {
      shell,
      driver,
      description: 'Executes an administrative command on the database.',
      category: 'admin',
    }
  }

  generateValidationCommand(
    connection: MongoDBConnection,
    database: string,
    collection: string,
    validator: Document,
    validationLevel: 'off' | 'strict' | 'moderate' = 'strict',
    validationAction: 'error' | 'warn' = 'error'
  ): GeneratedCommand {
    const cmd = `db.runCommand({
  collMod: "${collection}",
  validator: ${JSON.stringify(validator, null, 2)},
  validationLevel: "${validationLevel}",
  validationAction: "${validationAction}"
})`

    const shell = database ? `use ${database}\n${cmd}` : cmd

    const driver = `await db.command({
  collMod: "${collection}",
  validator: ${JSON.stringify(validator, null, 2)},
  validationLevel: "${validationLevel}",
  validationAction: "${validationAction}"
});`

    return {
      shell,
      driver,
      description: `Sets validation rules for the "${collection}" collection.`,
      category: 'command',
    }
  }

  private formatOptions(options: object): string {
    return JSON.stringify(options, null, 2)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"/g, "'")
  }

  private formatDriverOptions(options: object): string {
    return JSON.stringify(options, null, 2)
  }

  formatJSON(json: string): string {
    try {
      return JSON.stringify(JSON.parse(json), null, 2)
    } catch {
      return json
    }
  }

  parseShellCommand(shellCommand: string): { type: string; parsed: Document } | null {
    // Simplified parser for common shell commands
    const trimmed = shellCommand.trim()

    if (trimmed.startsWith('db.') && trimmed.includes('.find(')) {
      return { type: 'find', parsed: {} }
    }

    if (trimmed.startsWith('db.') && trimmed.includes('.aggregate(')) {
      return { type: 'aggregate', parsed: {} }
    }

    return null
  }
}

export const commandGeneratorService = new CommandGeneratorService()