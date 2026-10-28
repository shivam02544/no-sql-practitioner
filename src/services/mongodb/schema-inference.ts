import { Db } from 'mongodb'
import { SchemaField, BSONType, CollectionSchema, SchemaNode, SchemaEdge, FieldProfile, Document, DataProfile, MissingValueInfo, DuplicateInfo, Collation, Relationship, SchemaVisualization } from '@/types'

export class SchemaInferenceService {
  private readonly SAMPLE_SIZE = 1000
  private readonly MAX_DEPTH = 10

  async inferSchema(
    db: Db,
    collectionName: string,
    databaseName: string,
    sampleSize = this.SAMPLE_SIZE
  ): Promise<CollectionSchema> {
    const collection = db.collection(collectionName)
    const totalCount = await collection.estimatedDocumentCount()
    const sampleCount = Math.min(sampleSize, totalCount)

    const documents = await collection.aggregate([
      { $sample: { size: sampleCount } },
    ]).toArray()

    const fields = this.analyzeFields(documents)
    const indexes = await this.getIndexDefinitions(db, collectionName)
    const relationships = await this.inferRelationships(db, collectionName, fields)

    return {
      collectionName,
      databaseName,
      fields,
      validationRules: await this.getValidationRules(db, collectionName),
      validationLevel: await this.getValidationLevel(db, collectionName),
      validationAction: await this.getValidationAction(db, collectionName),
      indexes,
      relationships,
      sampleSize: documents.length,
      inferredAt: new Date(),
    }
  }

  private analyzeFields(documents: Document[]): SchemaField[] {
    const fieldMap = new Map<string, SchemaField>()

    for (const doc of documents) {
      this.processDocument(doc, fieldMap, '')
    }

    return Array.from(fieldMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  private processDocument(doc: Document, fieldMap: Map<string, SchemaField>, prefix: string, depth = 0): void {
    if (depth > this.MAX_DEPTH) return

    for (const [key, value] of Object.entries(doc)) {
      const fieldName = prefix ? `${prefix}.${key}` : key
      const existingField = fieldMap.get(fieldName)

      const fieldInfo = this.analyzeValue(value, key)

      if (existingField) {
        this.mergeFieldInfo(existingField, fieldInfo)
      } else {
        fieldMap.set(fieldName, fieldInfo)
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.processDocument(value as Document, fieldMap, fieldName, depth + 1)
      } else if (Array.isArray(value) && value.length > 0) {
        const firstElement = value[0]
        if (firstElement && typeof firstElement === 'object') {
          const arrayFieldName = `${fieldName}[]`
          const arrayField = fieldMap.get(arrayFieldName) || this.analyzeValue(firstElement, arrayFieldName)
          arrayField.name = arrayFieldName
          arrayField.type = 'array'
          arrayField.arrayItemType = this.analyzeValue(firstElement, key)
          fieldMap.set(arrayFieldName, arrayField)
        }
      }
    }
  }

  private analyzeValue(value: unknown, fieldName: string): SchemaField {
    if (value === null || value === undefined) {
      return {
        name: fieldName,
        type: 'null',
        required: false,
      }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { name: fieldName, type: 'array', required: true, arrayItemType: { name: 'item', type: 'null', required: false } }
      }
      const itemTypes = new Set(value.map(v => this.getBSONType(v)))
      const primaryType: BSONType = (itemTypes.size === 1 ? itemTypes.values().next().value : 'mixed') || 'mixed'
      return {
        name: fieldName,
        type: 'array',
        required: true,
        arrayItemType: { name: 'item', type: primaryType, required: false },
      }
    }

    const bsonType = this.getBSONType(value)
    return {
      name: fieldName,
      type: bsonType,
      required: true,
    }
  }

  private getBSONType(value: unknown): BSONType {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    const type = typeof value
    switch (type) {
      case 'string':
        return 'string'
      case 'number':
        return Number.isInteger(value) ? 'int' : 'double'
      case 'boolean':
        return 'bool'
      case 'object':
        if (value instanceof Date) return 'date'
        if (value instanceof RegExp) return 'regex'
        if (Array.isArray(value)) return 'array'
        if (value.constructor?.name === 'ObjectId' || value.constructor?.name === 'ObjectID') return 'objectId'
        if (value.constructor?.name === 'Long') return 'long'
        if (value.constructor?.name === 'Decimal128') return 'decimal'
        if (value.constructor?.name === 'Binary') return 'binData'
        if (value.constructor?.name === 'Timestamp') return 'timestamp'
        if (value.constructor?.name === 'MinKey') return 'minKey'
        if (value.constructor?.name === 'MaxKey') return 'maxKey'
        if (value.constructor?.name === 'Code') return 'javascript'
        if (value.constructor?.name === 'Symbol') return 'symbol'
        if (value.constructor?.name === 'DBRef') return 'dbPointer'
        return 'object'
      case 'function':
        return 'javascript'
      default:
        return 'object'
    }
  }

  private mergeFieldInfo(existing: SchemaField, newInfo: SchemaField): void {
    existing.required = existing.required && newInfo.required
    if (existing.type !== newInfo.type) {
      existing.type = this.mergeTypes(existing.type, newInfo.type)
    }
  }

  private mergeTypes(type1: BSONType, type2: BSONType): BSONType {
    if (type1 === type2) return type1
    if (type1 === 'null') return type2
    if (type2 === 'null') return type1
    return 'mixed' as BSONType
  }

  private async getIndexDefinitions(db: Db, collectionName: string) {
    const indexes = await db.collection(collectionName).indexes()
    return indexes.map(idx => ({
      name: idx.name || 'default',
      keys: idx.key as Record<string, 1 | -1 | 'text' | '2dsphere' | '2d' | 'hashed'>,
      options: {
        unique: idx.unique,
        sparse: idx.sparse,
        background: idx.background,
        expireAfterSeconds: idx.expireAfterSeconds,
        partialFilterExpression: idx.partialFilterExpression,
        weights: idx.weights,
        default_language: idx.default_language,
        language_override: idx.language_override,
        textIndexVersion: idx.textIndexVersion,
        sphereVersion: idx.sphereVersion,
        bits: idx.bits,
        min: idx.min,
        max: idx.max,
        bucketSize: idx.bucketSize,
        collation: idx.collation as unknown as Collation | undefined,
      },
    }))
  }

  private async inferRelationships(db: Db, collectionName: string, fields: SchemaField[]): Promise<Relationship[]> {
    const relationships: Relationship[] = []
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name).filter(n => n !== collectionName)

    for (const field of fields) {
      if (field.type === 'objectId' || (field.type === 'string' && field.name.endsWith('Id'))) {
        for (const otherCollection of collectionNames) {
          if (field.name === `${otherCollection}Id` || field.name === `${otherCollection}_id`) {
            relationships.push({
              fromCollection: collectionName,
              fromField: field.name,
              toCollection: otherCollection,
              toField: '_id',
              type: 'references',
              cardinality: 'many-to-one',
            })
          }
        }
      }

      if (field.arrayItemType?.type === 'objectId' || (field.arrayItemType?.type === 'string' && field.name.endsWith('Ids'))) {
        for (const otherCollection of collectionNames) {
          const singular = otherCollection.endsWith('s') ? otherCollection.slice(0, -1) : otherCollection
          if (field.name === `${singular}Ids` || field.name === `${singular}_ids`) {
            relationships.push({
              fromCollection: collectionName,
              fromField: field.name,
              toCollection: otherCollection,
              toField: '_id',
              type: 'references',
              cardinality: 'many-to-many',
            })
          }
        }
      }
    }

    return relationships
  }

  private async getValidationRules(db: Db, collectionName: string): Promise<Document | undefined> {
    try {
      const result = await db.command({ listCollections: 1, filter: { name: collectionName } })
      return result.cursor.firstBatch[0]?.options?.validator
    } catch {
      return undefined
    }
  }

  private async getValidationLevel(db: Db, collectionName: string): Promise<'off' | 'strict' | 'moderate'> {
    try {
      const result = await db.command({ listCollections: 1, filter: { name: collectionName } })
      return result.cursor.firstBatch[0]?.options?.validationLevel || 'strict'
    } catch {
      return 'strict'
    }
  }

  private async getValidationAction(db: Db, collectionName: string): Promise<'error' | 'warn'> {
    try {
      const result = await db.command({ listCollections: 1, filter: { name: collectionName } })
      return result.cursor.firstBatch[0]?.options?.validationAction || 'error'
    } catch {
      return 'error'
    }
  }

  async profileCollection(db: Db, collectionName: string): Promise<DataProfile> {
    const collection = db.collection(collectionName)
    const totalDocuments = await collection.estimatedDocumentCount()
    const sampleSize = Math.min(this.SAMPLE_SIZE, totalDocuments)

    const documents = await collection.aggregate([
      { $sample: { size: sampleSize } },
    ]).toArray()

    const fieldProfiles = await this.profileFields(documents)
    const missingValues = this.findMissingValues(documents, fieldProfiles)
    const duplicates = await this.findDuplicates(db, collectionName, documents)
    const dataQualityScore = this.calculateQualityScore(fieldProfiles, missingValues, duplicates)

    return {
      collectionName,
      databaseName: db.databaseName,
      totalDocuments,
      fieldProfiles,
      missingValues,
      duplicates,
      dataQualityScore,
      analyzedAt: new Date(),
    }
  }

  private async profileFields(documents: Document[]): Promise<FieldProfile[]> {
    const fieldMap = new Map<string, FieldProfile>()

    for (const doc of documents) {
      this.profileDocument(doc, fieldMap, '')
    }

    return Array.from(fieldMap.values())
  }

  private profileDocument(doc: Document, fieldMap: Map<string, FieldProfile>, prefix: string): void {
    for (const [key, value] of Object.entries(doc)) {
      const fieldName = prefix ? `${prefix}.${key}` : key
      let profile = fieldMap.get(fieldName)

      if (!profile) {
        profile = {
          fieldName,
          type: this.getBSONType(value),
          count: 0,
          nullCount: 0,
          uniqueCount: 0,
          topValues: [],
          sampleValues: [],
        }
        fieldMap.set(fieldName, profile)
      }

      profile.count++
      if (value === null || value === undefined) {
        profile.nullCount++
      } else {
        const valueStr = JSON.stringify(value)
        if (profile.sampleValues.length < 5) {
          profile.sampleValues.push(value)
        }

        const existingTop = profile.topValues.find(tv => JSON.stringify(tv.value) === valueStr)
        if (existingTop) {
          existingTop.count++
        } else {
          profile.topValues.push({ value, count: 1, percentage: 0 })
        }

        if (typeof value === 'number') {
          if (profile.minValue === undefined || value < Number(profile.minValue)) profile.minValue = value
          if (profile.maxValue === undefined || value > Number(profile.maxValue)) profile.maxValue = value
        }
        if (typeof value === 'string') {
          const len = value.length
          if (profile.minLength === undefined || len < profile.minLength) profile.minLength = len
          if (profile.maxLength === undefined || len > profile.maxLength) profile.maxLength = len
          profile.avgLength = (profile.avgLength || 0) + len
        }
      }
    }
  }

  private findMissingValues(documents: Document[], fieldProfiles: FieldProfile[]): MissingValueInfo[] {
    const total = documents.length
    return fieldProfiles
      .filter(fp => fp.nullCount > 0)
      .map(fp => ({
        fieldName: fp.fieldName,
        missingCount: fp.nullCount,
        missingPercentage: (fp.nullCount / total) * 100,
      }))
  }

  private async findDuplicates(db: Db, collectionName: string, sampleDocuments: Document[]): Promise<DuplicateInfo[]> {
    const duplicates: DuplicateInfo[] = []
    const fieldProfiles = await this.profileFields(sampleDocuments)

    for (const profile of fieldProfiles) {
      if (profile.uniqueCount < profile.count) {
        const duplicateCount = profile.count - profile.uniqueCount
        if (duplicateCount > 0) {
          const docs = await db.collection(collectionName)
            .aggregate([
              { $group: { _id: `$${profile.fieldName}`, count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
              { $match: { count: { $gt: 1 } } },
              { $limit: 5 },
            ])
            .toArray()

          duplicates.push({
            fields: [profile.fieldName],
            duplicateCount,
            duplicatePercentage: (duplicateCount / profile.count) * 100,
            sampleDocuments: docs.flatMap(d => d.docs.slice(0, 2)),
          })
        }
      }
    }

    return duplicates
  }

  private calculateQualityScore(
    fieldProfiles: FieldProfile[],
    missingValues: MissingValueInfo[],
    duplicates: DuplicateInfo[]
  ): number {
    let score = 100

    for (const fp of fieldProfiles) {
      if (fp.nullCount > 0) {
        score -= (fp.nullCount / fp.count) * 20
      }
    }

    for (const dup of duplicates) {
      score -= dup.duplicatePercentage * 0.5
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  async generateVisualization(db: Db, collectionName: string): Promise<SchemaVisualization> {
    const schema = await this.inferSchema(db, collectionName, db.databaseName)

    const nodes: SchemaNode[] = [{
      id: collectionName,
      label: collectionName,
      collectionName,
      fieldCount: schema.fields.length,
      documentCount: await db.collection(collectionName).estimatedDocumentCount(),
      size: 100,
    }]

    const edges: SchemaEdge[] = []

    for (const rel of schema.relationships) {
      if (!nodes.find(n => n.id === rel.toCollection)) {
        nodes.push({
          id: rel.toCollection,
          label: rel.toCollection,
          collectionName: rel.toCollection,
          fieldCount: 0,
          documentCount: await db.collection(rel.toCollection).estimatedDocumentCount(),
          size: 100,
        })
      }

      edges.push({
        id: `${rel.fromCollection}-${rel.toCollection}-${rel.fromField}`,
        source: rel.fromCollection,
        target: rel.toCollection,
        type: rel.type,
        label: rel.fromField,
        cardinality: rel.cardinality,
      })
    }

    return { nodes, edges }
  }
}

export const schemaInferenceService = new SchemaInferenceService()