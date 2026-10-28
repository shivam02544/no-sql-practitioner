import { DataLineage, LineageNode, LineageEdge, TransformationPipeline, Document } from '@/types'

export class LineageTracker {
  private lineage: DataLineage = { nodes: [], edges: [] }

  addSourceNode(id: string, name: string, type: LineageNode['type'], metadata: Document): void {
    if (!this.lineage.nodes.find(n => n.id === id)) {
      this.lineage.nodes.push({ id, name, type, metadata })
    }
  }

  addTransformationNode(id: string, name: string, metadata: Document): void {
    if (!this.lineage.nodes.find(n => n.id === id)) {
      this.lineage.nodes.push({ id, name, type: 'transformation', metadata })
    }
  }

  addDestinationNode(id: string, name: string, metadata: Document): void {
    if (!this.lineage.nodes.find(n => n.id === id)) {
      this.lineage.nodes.push({ id, name, type: 'destination', metadata })
    }
  }

  addEdge(sourceId: string, targetId: string, type: LineageEdge['type'], metadata?: Document): void {
    const edgeId = `${sourceId}-${targetId}-${type}`
    if (!this.lineage.edges.find(e => e.id === edgeId)) {
      this.lineage.edges.push({ id: edgeId, source: sourceId, target: targetId, type, metadata })
    }
  }

  trackPipeline(pipeline: TransformationPipeline): void {
    // Add source
    if (pipeline.source.type === 'mongodb' && pipeline.source.collection) {
      this.addSourceNode(
        `source-${pipeline.source.collection}`,
        pipeline.source.collection,
        'source',
        { connectionId: pipeline.source.connectionId, query: pipeline.source.query }
      )
    } else if (pipeline.source.type === 'file' && pipeline.source.filePath) {
      this.addSourceNode(
        `source-${pipeline.source.filePath}`,
        pipeline.source.filePath,
        'source',
        { format: pipeline.source.type }
      )
    }

    // Add transformations
    for (const step of pipeline.steps) {
      this.addTransformationNode(
        `step-${step.id}`,
        step.name,
        { type: step.type, config: step.config, order: step.order }
      )
    }

    // Add destination
    if (pipeline.destination.type === 'mongodb' && pipeline.destination.collection) {
      this.addDestinationNode(
        `dest-${pipeline.destination.collection}`,
        pipeline.destination.collection,
        { connectionId: pipeline.destination.connectionId, writeMode: pipeline.destination.writeMode }
      )
    }

    // Connect source to first step
    if (pipeline.steps.length > 0) {
      const sourceId = pipeline.source.type === 'mongodb'
        ? `source-${pipeline.source.collection}`
        : `source-${pipeline.source.filePath}`
      this.addEdge(sourceId, `step-${pipeline.steps[0].id}`, 'reads')
    }

    // Connect steps
    for (let i = 0; i < pipeline.steps.length - 1; i++) {
      this.addEdge(`step-${pipeline.steps[i].id}`, `step-${pipeline.steps[i + 1].id}`, 'transforms')
    }

    // Connect last step to destination
    if (pipeline.steps.length > 0) {
      const destId = pipeline.destination.type === 'mongodb'
        ? `dest-${pipeline.destination.collection}`
        : `dest-output`
      this.addEdge(`step-${pipeline.steps[pipeline.steps.length - 1].id}`, destId, 'writes')
    }
  }

  getLineage(): DataLineage {
    return { ...this.lineage }
  }

  clear(): void {
    this.lineage = { nodes: [], edges: [] }
  }

  exportToGraphViz(): string {
    let dot = 'digraph Lineage {\n'
    dot += '  rankdir=LR;\n'
    dot += '  node [shape=box, style=filled];\n'

    for (const node of this.lineage.nodes) {
      const color = this.getNodeColor(node.type)
      dot += `  "${node.id}" [label="${node.name}", fillcolor="${color}"];\n`
    }

    for (const edge of this.lineage.edges) {
      dot += `  "${edge.source}" -> "${edge.target}" [label="${edge.type}"];\n`
    }

    dot += '}\n'
    return dot
  }

  private getNodeColor(type: LineageNode['type']): string {
    switch (type) {
      case 'source': return '#4CAF50'
      case 'transformation': return '#2196F3'
      case 'destination': return '#FF9800'
      case 'collection': return '#9C27B0'
      default: return '#757575'
    }
  }

  exportToMermaid(): string {
    let mermaid = 'graph LR\n'

    for (const node of this.lineage.nodes) {
      const shape = this.getMermaidShape(node.type)
      mermaid += `  ${node.id}${shape}\n`
    }

    for (const edge of this.lineage.edges) {
      mermaid += `  ${edge.source} -->|${edge.type}| ${edge.target}\n`
    }

    return mermaid
  }

  private getMermaidShape(type: LineageNode['type']): string {
    switch (type) {
      case 'source': return '[[' + 'Source' + ']]'
      case 'transformation': return '[/' + 'Transform' + '/]'
      case 'destination': return '[(' + 'Dest' + ')]'
      case 'collection': return '[[' + 'Collection' + ']]'
      default: return '[' + 'Node' + ']'
    }
  }
}

export class SchemaEvolutionTracker {
  private schemaHistory: Map<string, Array<{ schema: Document; timestamp: Date; version: number }>> = new Map()

  recordSchema(collectionName: string, schema: Document): void {
    const history = this.schemaHistory.get(collectionName) || []
    const version = history.length + 1

    history.push({
      schema,
      timestamp: new Date(),
      version,
    })

    // Keep last 100 versions
    if (history.length > 100) {
      history.shift()
    }

    this.schemaHistory.set(collectionName, history)
  }

  getSchemaHistory(collectionName: string): Array<{ schema: Document; timestamp: Date; version: number }> {
    return this.schemaHistory.get(collectionName) || []
  }

  compareSchemas(collectionName: string, version1: number, version2: number): SchemaDiff | null {
    const history = this.schemaHistory.get(collectionName)
    if (!history) return null

    const v1 = history.find(h => h.version === version1)
    const v2 = history.find(h => h.version === version2)

    if (!v1 || !v2) return null

    return this.diffSchemas(v1.schema, v2.schema)
  }

  getLatestSchema(collectionName: string): Document | null {
    const history = this.schemaHistory.get(collectionName)
    if (!history || history.length === 0) return null
    return history[history.length - 1].schema
  }

  private diffSchemas(oldSchema: Document, newSchema: Document): SchemaDiff {
    const oldFields = this.flattenSchema(oldSchema)
    const newFields = this.flattenSchema(newSchema)

    const added: string[] = []
    const removed: string[] = []
    const modified: SchemaFieldDiff[] = []

    for (const [field, newDef] of Object.entries(newFields)) {
      if (!(field in oldFields)) {
        added.push(field)
      } else {
        const oldDef = oldFields[field]
        if (JSON.stringify(oldDef) !== JSON.stringify(newDef)) {
          modified.push({
            field,
            oldType: oldDef.type,
            newType: newDef.type,
            oldRequired: oldDef.required,
            newRequired: newDef.required,
          })
        }
      }
    }

    for (const field of Object.keys(oldFields)) {
      if (!(field in newFields)) {
        removed.push(field)
      }
    }

    return {
      collectionName: '',
      fromVersion: 0,
      toVersion: 0,
      added,
      removed,
      modified,
      breakingChanges: this.detectBreakingChanges(added, removed, modified),
    }
  }

  private flattenSchema(schema: Document): Record<string, { type: string; required: boolean }> {
    const result: Record<string, { type: string; required: boolean }> = {}

    const process = (obj: Document, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldName = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value) && 'type' in value) {
          const valObj = value as { type?: unknown; required?: boolean }
          result[fieldName] = {
            type: String(valObj.type),
            required: Boolean(valObj.required),
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          process(value as Document, fieldName)
        }
      }
    }

    process(schema)
    return result
  }

  private detectBreakingChanges(
    added: string[],
    removed: string[],
    modified: SchemaFieldDiff[]
  ): string[] {
    const breaking: string[] = []

    for (const field of removed) {
      breaking.push(`Field "${field}" was removed (breaking)`)
    }

    for (const mod of modified) {
      if (mod.oldType !== mod.newType) {
        breaking.push(`Field "${mod.field}" type changed from ${mod.oldType} to ${mod.newType} (breaking)`)
      }
      if (mod.oldRequired === false && mod.newRequired === true) {
        breaking.push(`Field "${mod.field}" became required (breaking)`)
      }
    }

    return breaking
  }
}

export interface SchemaDiff {
  collectionName: string
  fromVersion: number
  toVersion: number
  added: string[]
  removed: string[]
  modified: SchemaFieldDiff[]
  breakingChanges: string[]
}

export interface SchemaFieldDiff {
  field: string
  oldType: string
  newType: string
  oldRequired: boolean
  newRequired: boolean
}

export const lineageTracker = new LineageTracker()
export const schemaEvolutionTracker = new SchemaEvolutionTracker()