import { AggregationPipeline, AggregationStage, Document, AggregationOptions } from '@/types'

export const AGGREGATION_STAGES = [
  { operator: '$match', name: 'Match', category: 'filter', description: 'Filters documents to pass only those that match the specified condition(s)' },
  { operator: '$project', name: 'Project', category: 'transform', description: 'Reshapes each document in the stream by adding, removing, or renaming fields' },
  { operator: '$group', name: 'Group', category: 'aggregate', description: 'Groups documents by a specified identifier expression and applies accumulator expressions' },
  { operator: '$sort', name: 'Sort', category: 'transform', description: 'Reorders the document stream by a specified sort key' },
  { operator: '$limit', name: 'Limit', category: 'transform', description: 'Limits the number of documents passed to the next stage' },
  { operator: '$skip', name: 'Skip', category: 'transform', description: 'Skips the specified number of documents and passes the remaining documents' },
  { operator: '$unwind', name: 'Unwind', category: 'transform', description: 'Deconstructs an array field from the input documents to output a document for each element' },
  { operator: '$lookup', name: 'Lookup', category: 'join', description: 'Performs a left outer join to another collection in the same database' },
  { operator: '$addFields', name: 'Add Fields', category: 'transform', description: 'Adds new fields to documents or replaces existing fields' },
  { operator: '$facet', name: 'Facet', category: 'aggregate', description: 'Processes multiple aggregation pipelines within a single stage on the same set of input documents' },
  { operator: '$count', name: 'Count', category: 'aggregate', description: 'Returns a count of the number of documents at this stage of the pipeline' },
  { operator: '$bucket', name: 'Bucket', category: 'aggregate', description: 'Categorizes incoming documents into groups based on a specified expression and bucket boundaries' },
  { operator: '$bucketAuto', name: 'Bucket Auto', category: 'aggregate', description: 'Categorizes incoming documents into a specific number of groups based on a specified expression' },
  { operator: '$sortByCount', name: 'Sort By Count', category: 'aggregate', description: 'Groups incoming documents based on the value of a specified expression and sorts by count' },
  { operator: '$sample', name: 'Sample', category: 'transform', description: 'Randomly selects a specified number of documents from the input' },
  { operator: '$replaceRoot', name: 'Replace Root', category: 'transform', description: 'Replaces the input document with the specified embedded document' },
  { operator: '$replaceWith', name: 'Replace With', category: 'transform', description: 'Replaces the input document with the specified embedded document' },
  { operator: '$merge', name: 'Merge', category: 'output', description: 'Writes the resulting documents of the aggregation pipeline to a collection' },
  { operator: '$out', name: 'Out', category: 'output', description: 'Writes the resulting documents of the aggregation pipeline to a collection' },
  { operator: '$set', name: 'Set', category: 'transform', description: 'Adds new fields to documents or replaces existing fields (alias for $addFields)' },
  { operator: '$unset', name: 'Unset', category: 'transform', description: 'Removes/excludes fields from documents (alias for $project with exclusion)' },
  { operator: '$redact', name: 'Redact', category: 'filter', description: 'Restricts the contents of documents based on information stored in the documents themselves' },
  { operator: '$graphLookup', name: 'Graph Lookup', category: 'join', description: 'Performs a recursive search on a collection' },
  { operator: '$geoNear', name: 'Geo Near', category: 'filter', description: 'Returns an ordered stream of documents based on proximity to a geospatial point' },
  { operator: '$densify', name: 'Densify', category: 'transform', description: 'Creates new documents in a sequence of documents where certain values in a field are missing' },
  { operator: '$fill', name: 'Fill', category: 'transform', description: 'Fills null and missing field values in documents' },
  { operator: '$pivot', name: 'Pivot', category: 'transform', description: 'Rotates a table by turning unique values from one field into multiple fields' },
  { operator: '$unpivot', name: 'Unpivot', category: 'transform', description: 'Rotates a table by turning fields into values' },
]

export const STAGE_TEMPLATES: Record<string, Document> = {
  '$match': { $match: {} },
  '$project': { $project: { _id: 0 } },
  '$group': { $group: { _id: null, count: { $sum: 1 } } },
  '$sort': { $sort: {} },
  '$limit': { $limit: 10 },
  '$skip': { $skip: 0 },
  '$unwind': { $unwind: { path: '$field', preserveNullAndEmptyArrays: false } },
  '$lookup': { $lookup: { from: 'collection', localField: 'field', foreignField: '_id', as: 'result' } },
  '$addFields': { $addFields: {} },
  '$set': { $set: {} },
  '$unset': { $unset: '' },
  '$facet': { $facet: {} },
  '$count': { $count: 'count' },
  '$bucket': { $bucket: { groupBy: '$field', boundaries: [], default: 'Other', output: {} } },
  '$bucketAuto': { $bucketAuto: { groupBy: '$field', buckets: 5, output: {} } },
  '$sortByCount': { $sortByCount: '$field' },
  '$sample': { $sample: { size: 10 } },
  '$replaceRoot': { $replaceRoot: { newRoot: '$field' } },
  '$replaceWith': { $replaceWith: '$field' },
  '$merge': { $merge: { into: 'collection', on: '_id', whenMatched: 'merge', whenNotMatched: 'insert' } },
  '$out': { $out: 'collection' },
  '$redact': { $redact: { $cond: { if: { $gt: ['$field', 10] }, then: '$$DESCEND', else: '$$PRUNE' } } },
  '$graphLookup': { $graphLookup: { from: 'collection', startWith: '$field', connectFromField: 'field', connectToField: '_id', as: 'result', depthField: 'depth', maxDepth: 5 } },
  '$geoNear': { $geoNear: { near: { type: 'Point', coordinates: [0, 0] }, distanceField: 'distance', spherical: true } },
  '$densify': { $densify: { field: 'field', range: { step: 1 } } },
  '$fill': { $fill: { sortBy: 1, output: { method: 'linear' } } },
  '$pivot': { $pivot: { groupBy: '$field', aggregate: { $sum: '$value' } } },
  '$unpivot': { $unpivot: { groupBy: '$field', field: 'key', value: 'value' } },
}

export class AggregationBuilderService {
  validatePipeline(pipeline: AggregationPipeline): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!pipeline.stages || pipeline.stages.length === 0) {
      errors.push('Pipeline must have at least one stage')
      return { valid: false, errors }
    }

    for (let i = 0; i < pipeline.stages.length; i++) {
      const stage = pipeline.stages[i]
      const stageErrors = this.validateStage(stage, i)
      errors.push(...stageErrors)
    }

    const outputStages = pipeline.stages.filter(s => ['$out', '$merge'].includes(s.operator))
    if (outputStages.length > 1) {
      errors.push('Only one output stage ($out or $merge) is allowed per pipeline')
    }

    if (outputStages.length === 1) {
      const outputIndex = pipeline.stages.findIndex(s => ['$out', '$merge'].includes(s.operator))
      if (outputIndex !== pipeline.stages.length - 1) {
        errors.push('Output stage ($out or $merge) must be the last stage in the pipeline')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  private validateStage(stage: AggregationStage, index: number): string[] {
    const errors: string[] = []

    if (!stage.operator) {
      errors.push(`Stage ${index + 1}: Missing operator`)
      return errors
    }

    const template = STAGE_TEMPLATES[stage.operator]
    if (!template) {
      errors.push(`Stage ${index + 1}: Unknown operator ${stage.operator}`)
      return errors
    }

    if (!stage.expression || Object.keys(stage.expression).length === 0) {
      errors.push(`Stage ${index + 1} (${stage.operator}): Empty expression`)
    }

    if (stage.operator === '$lookup') {
      const expr = (stage.expression as Record<string, unknown>).$lookup as { from?: string; localField?: string; foreignField?: string; as?: string } | undefined
      if (!expr?.from) errors.push(`Stage ${index + 1} ($lookup): Missing 'from' collection`)
      if (!expr?.localField) errors.push(`Stage ${index + 1} ($lookup): Missing 'localField'`)
      if (!expr?.foreignField) errors.push(`Stage ${index + 1} ($lookup): Missing 'foreignField'`)
      if (!expr?.as) errors.push(`Stage ${index + 1} ($lookup): Missing 'as' output field`)
    }

    if (stage.operator === '$unwind') {
      const expr = (stage.expression as Record<string, unknown>).$unwind as { path?: string } | undefined
      if (!expr?.path) errors.push(`Stage ${index + 1} ($unwind): Missing 'path'`)
    }

    if (stage.operator === '$group') {
      const expr = (stage.expression as Record<string, unknown>).$group as { _id?: unknown } | undefined
      if (!expr?._id) errors.push(`Stage ${index + 1} ($group): Missing '_id' field`)
    }

    if (['$out', '$merge'].includes(stage.operator)) {
      const expr = (stage.expression as Record<string, unknown>)[stage.operator] as { into?: string } | undefined
      if (!expr?.into) errors.push(`Stage ${index + 1} (${stage.operator}): Missing 'into' collection`)
    }

    return errors
  }

  generatePipelineJSON(pipeline: AggregationPipeline): Document[] {
    return pipeline.stages
      .filter(s => s.enabled)
      .map(s => s.expression)
  }

  generateMongoShellCommand(
    pipeline: AggregationPipeline,
    collectionName: string,
    databaseName?: string
  ): string {
    const stages = this.generatePipelineJSON(pipeline)
    const options = pipeline.options ? this.formatOptions(pipeline.options) : ''

    let cmd = `db.${collectionName}.aggregate(${JSON.stringify(stages, null, 2)}`
    if (options) {
      cmd += `, ${options}`
    }
    cmd += ')'

    if (databaseName) {
      cmd = `use ${databaseName}\n${cmd}`
    }

    return cmd
  }

  generateNodeDriverCode(
    pipeline: AggregationPipeline,
    collectionName: string
  ): string {
    const stages = this.generatePipelineJSON(pipeline)
    const options = pipeline.options ? this.formatOptions(pipeline.options) : ''

    return `const pipeline = ${JSON.stringify(stages, null, 2)};

const results = await db.collection('${collectionName}').aggregate(pipeline${options ? `, ${options}` : ''}).toArray();

console.log(results);`
  }

  generatePythonCode(
    pipeline: AggregationPipeline,
    collectionName: string
  ): string {
    const stages = this.generatePipelineJSON(pipeline)

    return `pipeline = ${JSON.stringify(stages, null, 2)}

results = list(db.${collectionName}.aggregate(pipeline))

for doc in results:
    print(doc)`
  }

  private formatOptions(options: AggregationOptions): string {
    const opts: string[] = []
    if (options.allowDiskUse) opts.push('allowDiskUse: true')
    if (options.maxTimeMS) opts.push(`maxTimeMS: ${options.maxTimeMS}`)
    if (options.batchSize) opts.push(`batchSize: ${options.batchSize}`)
    if (options.collation) opts.push(`collation: ${JSON.stringify(options.collation)}`)
    if (options.comment) opts.push(`comment: "${options.comment}"`)
    return `{ ${opts.join(', ')} }`
  }

  optimizePipeline(pipeline: AggregationPipeline): AggregationPipeline {
    const stages = [...pipeline.stages]
    const optimized: AggregationStage[] = []

    let matchStage: AggregationStage | null = null
    let projectStage: AggregationStage | null = null

    for (const stage of stages) {
      if (stage.operator === '$match' && stage.enabled) {
        if (!matchStage) {
          matchStage = stage
        } else {
          const prevMatch = (matchStage.expression as Record<string, unknown>).$match
          const curMatch = (stage.expression as Record<string, unknown>).$match
          matchStage.expression = { $match: { $and: [prevMatch, curMatch] } }
        }
      } else if (stage.operator === '$project' && stage.enabled) {
        if (!projectStage) {
          projectStage = stage
        } else {
          const prevProj = ((projectStage.expression as Record<string, unknown>).$project as object) || {}
          const curProj = ((stage.expression as Record<string, unknown>).$project as object) || {}
          projectStage.expression = { $project: { ...prevProj, ...curProj } }
        }
      } else {
        optimized.push(stage)
      }
    }

    if (matchStage) optimized.unshift(matchStage)
    if (projectStage) {
      const matchIndex = optimized.findIndex(s => s.operator === '$match')
      if (matchIndex >= 0) {
        optimized.splice(matchIndex + 1, 0, projectStage)
      } else {
        optimized.unshift(projectStage)
      }
    }

    return { ...pipeline, stages: optimized }
  }

  explainStage(stage: AggregationStage): string {
    const descriptions: Record<string, string> = {
      '$match': 'Filters documents, reducing the number of documents passed to the next stage. Place early in pipeline for best performance.',
      '$project': 'Reshapes documents. Can add computed fields, rename fields, or exclude fields. Use to reduce document size early.',
      '$group': 'Groups documents by _id expression. Uses accumulators like $sum, $avg, $min, $max, $push, $addToSet. Can be memory intensive.',
      '$sort': 'Sorts documents. Place after $match and $limit for best performance. Use indexes when possible.',
      '$limit': 'Limits output documents. Place early to reduce processing. Works well with $sort for top-N queries.',
      '$skip': 'Skips documents. Use with $limit for pagination. Can be slow on large offsets.',
      '$unwind': 'Deconstructs arrays. Increases document count. Use preserveNullAndEmptyArrays to keep docs with empty/null arrays.',
      '$lookup': 'Joins with another collection. Can be slow. Consider $match before $lookup to reduce joined documents.',
      '$addFields': 'Adds or replaces fields. Similar to $project but keeps existing fields unless explicitly removed.',
      '$facet': 'Runs multiple sub-pipelines. Useful for categorizing data. Each sub-pipeline runs on same input.',
      '$count': 'Counts documents. Returns single document with count field.',
      '$bucket': 'Groups into buckets by boundaries. Useful for histograms.',
      '$bucketAuto': 'Automatically determines bucket boundaries.',
      '$sortByCount': 'Shortcut for $group + $sort by count. Groups by expression and sorts descending by count.',
      '$sample': 'Random sampling. Uses pseudo-random cursor. Not suitable for statistically valid samples on sharded collections.',
      '$replaceRoot': 'Promotes embedded document to root. Useful for flattening.',
      '$replaceWith': 'Same as $replaceRoot but more flexible.',
      '$merge': 'Writes results to collection. Supports upsert, merge, replace. Can be used for incremental updates.',
      '$out': 'Writes results to collection, replacing existing. Atomic replace.',
      '$set': 'Alias for $addFields. Adds new fields.',
      '$unset': 'Alias for $project with field exclusion. Removes fields.',
      '$redact': 'Restricts content based on document data. Use for field-level security.',
      '$graphLookup': 'Recursive search. Use for hierarchical data. Can be slow on deep hierarchies.',
      '$geoNear': 'Geospatial sorting. Requires 2dsphere index. Returns distance field.',
      '$densify': 'Fills gaps in sequences. Useful for time series data.',
      '$fill': 'Fills null/missing values. Supports linear, locf, etc.',
      '$pivot': 'Rotates rows to columns. Creates wide format from long format.',
      '$unpivot': 'Rotates columns to rows. Creates long format from wide format.',
    }
    return descriptions[stage.operator] || 'No description available'
  }

  createStage(operator: string): AggregationStage {
    const template = STAGE_TEMPLATES[operator] || {}
    const stageInfo = AGGREGATION_STAGES.find(s => s.operator === operator)

    return {
      id: crypto.randomUUID(),
      name: stageInfo?.name || operator,
      operator,
      expression: template,
      description: stageInfo?.description,
      enabled: true,
    }
  }

  cloneStage(stage: AggregationStage): AggregationStage {
    return {
      ...stage,
      id: crypto.randomUUID(),
      expression: JSON.parse(JSON.stringify(stage.expression)),
    }
  }

  moveStage(pipeline: AggregationPipeline, fromIndex: number, toIndex: number): AggregationPipeline {
    const stages = [...pipeline.stages]
    const [removed] = stages.splice(fromIndex, 1)
    stages.splice(toIndex, 0, removed)
    return { ...pipeline, stages }
  }

  removeStage(pipeline: AggregationPipeline, index: number): AggregationPipeline {
    return {
      ...pipeline,
      stages: pipeline.stages.filter((_, i) => i !== index),
    }
  }

  toggleStage(pipeline: AggregationPipeline, index: number): AggregationPipeline {
    return {
      ...pipeline,
      stages: pipeline.stages.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s),
    }
  }
}

export const aggregationBuilderService = new AggregationBuilderService()