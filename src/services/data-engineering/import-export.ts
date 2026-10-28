import Papa from 'papaparse'
import { Document, TransformationPipeline, TransformationStep, RunStats } from '@/types'

export class ImportExportService {
  async parseCSV(content: string, options?: Papa.ParseConfig): Promise<Document[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim(),
        ...options,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
          } else {
            resolve(results.data as Document[])
          }
        },
        error: (error: Error) => reject(error),
      })
    })
  }

  async parseJSON(content: string): Promise<Document[]> {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed as Document[]
      }
      return [parsed as Document]
    } catch (error) {
      throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
    }
  }

  async parseJSONL(content: string): Promise<Document[]> {
    const lines = content.trim().split('\n')
    const documents: Document[] = []

    for (const line of lines) {
      if (line.trim()) {
        try {
          documents.push(JSON.parse(line))
        } catch {
          // Skip invalid lines
        }
      }
    }

    return documents
  }

  async generateCSV(documents: Document[], options?: Papa.UnparseConfig): Promise<string> {
    try {
      const csv = Papa.unparse(documents, {
        header: true,
        ...options,
      })
      return csv
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  async generateJSON(documents: Document[], pretty = true): Promise<string> {
    return JSON.stringify(documents, null, pretty ? 2 : 0)
  }

  async generateJSONL(documents: Document[]): Promise<string> {
    return documents.map(doc => JSON.stringify(doc)).join('\n')
  }

  async detectFormat(content: string): Promise<'csv' | 'json' | 'jsonl' | 'unknown'> {
    const trimmed = content.trim()

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        JSON.parse(trimmed)
        return 'json'
      } catch {
        // Check if it's JSONL
        const lines = trimmed.split('\n')
        let validLines = 0
        for (const line of lines.slice(0, 5)) {
          if (line.trim()) {
            try {
              JSON.parse(line)
              validLines++
            } catch {
              break
            }
          }
        }
        if (validLines === Math.min(5, lines.length)) {
          return 'jsonl'
        }
      }
    }

    // Check for CSV
    const lines = trimmed.split('\n')
    if (lines.length > 1) {
      const firstLine = lines[0]
      const delimiters = [',', ';', '\t', '|']
      for (const delimiter of delimiters) {
        if (firstLine.includes(delimiter)) {
          const headers = firstLine.split(delimiter)
          const secondLine = lines[1].split(delimiter)
          if (headers.length === secondLine.length) {
            return 'csv'
          }
        }
      }
    }

    return 'unknown'
  }

  async streamCSV(file: File, onChunk: (chunk: Document[]) => Promise<void>): Promise<RunStats> {
    const stats: RunStats = {
      documentsRead: 0,
      documentsWritten: 0,
      documentsFailed: 0,
      durationMs: 0,
      errors: [],
    }

    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        chunk: async (results) => {
          if (results.data.length > 0) {
            stats.documentsRead += results.data.length
            try {
              await onChunk(results.data as Document[])
              stats.documentsWritten += results.data.length
            } catch (error) {
              stats.documentsFailed += results.data.length
              stats.errors.push(error instanceof Error ? error.message : 'Unknown error')
            }
          }
        },
        complete: () => {
          stats.durationMs = Date.now() - startTime
          resolve(stats)
        },
        error: (error: Error) => {
          stats.durationMs = Date.now() - startTime
          stats.errors.push(error.message)
          reject(error)
        },
      })
    })
  }

  async streamJSON(file: File, onChunk: (chunk: Document[]) => Promise<void>, chunkSize = 1000): Promise<RunStats> {
    const stats: RunStats = {
      documentsRead: 0,
      documentsWritten: 0,
      documentsFailed: 0,
      durationMs: 0,
      errors: [],
    }

    const startTime = Date.now()
    const text = await file.text()
    const lines = text.trim().split('\n')
    let buffer: Document[] = []

    for (const line of lines) {
      if (line.trim()) {
        try {
          buffer.push(JSON.parse(line))
          stats.documentsRead++

          if (buffer.length >= chunkSize) {
            try {
              await onChunk(buffer)
              stats.documentsWritten += buffer.length
            } catch (error) {
              stats.documentsFailed += buffer.length
              stats.errors.push(error instanceof Error ? error.message : 'Unknown error')
            }
            buffer = []
          }
        } catch {
          stats.documentsFailed++
          stats.errors.push('Invalid JSON line')
        }
      }
    }

    if (buffer.length > 0) {
      try {
        await onChunk(buffer)
        stats.documentsWritten += buffer.length
      } catch (error) {
        stats.documentsFailed += buffer.length
        stats.errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    stats.durationMs = Date.now() - startTime
    return stats
  }
}

export class TransformationEngine {
  async executePipeline(
    pipeline: TransformationPipeline,
    sourceData: Document[],
    writeFn: (documents: Document[]) => Promise<void>
  ): Promise<RunStats> {
    const stats: RunStats = {
      documentsRead: sourceData.length,
      documentsWritten: 0,
      documentsFailed: 0,
      durationMs: 0,
      errors: [],
    }

    const startTime = Date.now()
    let currentData = [...sourceData]

    for (const step of pipeline.steps.filter(s => s.enabled).sort((a, b) => a.order - b.order)) {
      try {
        currentData = await this.executeStep(step, currentData)
      } catch (error) {
        stats.errors.push(`Step "${step.name}" (${step.type}): ${error instanceof Error ? error.message : 'Unknown error'}`)
        stats.documentsFailed = currentData.length
        break
      }
    }

    if (currentData.length > 0) {
      try {
        await writeFn(currentData)
        stats.documentsWritten = currentData.length
      } catch (error) {
        stats.documentsFailed = currentData.length
        stats.errors.push(`Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    stats.durationMs = Date.now() - startTime
    return stats
  }

  private async executeStep(step: TransformationStep, data: Document[]): Promise<Document[]> {
    switch (step.type) {
      case 'filter':
        return this.filterDocuments(data, step.config)
      case 'project':
        return this.projectDocuments(data, step.config)
      case 'map':
        return this.mapDocuments(data, step.config)
      case 'deduplicate':
        return this.deduplicateDocuments(data, step.config)
      case 'validate':
        return this.validateDocuments(data, step.config)
      case 'aggregate':
        return this.aggregateDocuments(data, step.config)
      default:
        return data
    }
  }

  private filterDocuments(data: Document[], config: Document): Document[] {
    const filter = config.filter as Document
    if (!filter) return data

    return data.filter(doc => this.matchesFilter(doc, filter))
  }

  private projectDocuments(data: Document[], config: Document): Document[] {
    const projection = config.projection as Document
    if (!projection) return data

    return data.map(doc => {
      const result: Document = {}
      for (const [key, value] of Object.entries(projection)) {
        if (value === 1 || value === true) {
          const keys = key.split('.')
          let current: unknown = doc
          for (const k of keys) {
            if (current && typeof current === 'object') {
              current = (current as Document)[k]
            } else {
              current = undefined
              break
            }
          }
          if (current !== undefined) {
            let target = result
            for (let i = 0; i < keys.length - 1; i++) {
              target[keys[i]] = target[keys[i]] || {}
              target = target[keys[i]] as Document
            }
            target[keys[keys.length - 1]] = current
          }
        }
      }
      return result
    })
  }

  private mapDocuments(data: Document[], config: Document): Document[] {
    const mapping = config.mapping as Record<string, string>
    if (!mapping) return data

    return data.map(doc => {
      const result: Document = { ...doc }
      for (const [targetField, sourceExpression] of Object.entries(mapping)) {
        try {
          result[targetField] = this.evaluateExpression(doc, sourceExpression)
        } catch {
          // Skip invalid expressions
        }
      }
      return result
    })
  }

  private evaluateExpression(doc: Document, expression: string): unknown {
    // Simple expression evaluator for field references and basic operations
    if (expression.startsWith('$')) {
      const fieldPath = expression.slice(1)
      const keys = fieldPath.split('.')
      let current: unknown = doc
      for (const k of keys) {
        if (current && typeof current === 'object') {
          current = (current as Document)[k]
        } else {
          return undefined
        }
      }
      return current
    }
    return expression
  }

  private deduplicateDocuments(data: Document[], config: Document): Document[] {
    const fields = (config.fields as string[]) || ['_id']
    const seen = new Set<string>()

    return data.filter(doc => {
      const key = fields.map(f => this.getNestedValue(doc, f)).join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private validateDocuments(data: Document[], config: Document): Document[] {
    const rules = config.rules as Document
    if (!rules) return data

    return data.filter(doc => {
      for (const [field, rule] of Object.entries(rules)) {
        const value = this.getNestedValue(doc, field)
        const r = rule as {
          required?: boolean
          type?: string
          min?: number
          max?: number
          pattern?: string
          enum?: unknown[]
        }

        if (r.required && (value === null || value === undefined)) return false
        if (r.type && typeof value !== r.type) return false
        if (r.min !== undefined && typeof value === 'number' && value < r.min) return false
        if (r.max !== undefined && typeof value === 'number' && value > r.max) return false
        if (r.pattern && typeof value === 'string' && !new RegExp(r.pattern).test(value)) return false
        if (r.enum && Array.isArray(r.enum) && !r.enum.includes(value)) return false
      }
      return true
    })
  }

  private aggregateDocuments(data: Document[], config: Document): Document[] {
    const groupBy = config.groupBy as string
    const aggregations = config.aggregations as Record<string, Document>

    if (!groupBy || !aggregations) return data

    const groups = new Map<string, Document[]>()

    for (const doc of data) {
      const key = this.getNestedValue(doc, groupBy)
      const keyStr = String(key)
      if (!groups.has(keyStr)) groups.set(keyStr, [])
      groups.get(keyStr)!.push(doc)
    }

    const results: Document[] = []
    for (const [key, docs] of groups) {
      const result: Document = { _id: key, count: docs.length }
      for (const [field, agg] of Object.entries(aggregations)) {
        const a = agg as { field?: string; operator?: string }
        const targetField = typeof a.field === 'string' ? a.field : field
        const values = docs.map(d => this.getNestedValue(d, targetField)).filter(v => v !== undefined)

        switch (a.operator) {
          case '$sum':
            result[field] = values.reduce((sum, v) => (sum as number) + Number(v), 0)
            break
          case '$avg':
            result[field] = (values.reduce((sum, v) => (sum as number) + Number(v), 0) as number) / values.length
            break
          case '$min':
            result[field] = Math.min(...values.map(v => Number(v)))
            break
          case '$max':
            result[field] = Math.max(...values.map(v => Number(v)))
            break
          case '$first':
            result[field] = values[0]
            break
          case '$last':
            result[field] = values[values.length - 1]
            break
          case '$push':
            result[field] = values
            break
          case '$addToSet':
            result[field] = [...new Set(values)]
            break
        }
      }
      results.push(result)
    }

    return results
  }

  private matchesFilter(doc: Document, filter: Document): boolean {
    for (const [key, condition] of Object.entries(filter)) {
      const value = this.getNestedValue(doc, key)
      const cond = condition as {
        $eq?: unknown
        $ne?: unknown
        $gt?: number
        $gte?: number
        $lt?: number
        $lte?: number
        $in?: unknown[]
        $nin?: unknown[]
        $regex?: string
        $exists?: boolean
      }

      if (cond.$eq !== undefined && value !== cond.$eq) return false
      if (cond.$ne !== undefined && value === cond.$ne) return false
      if (cond.$gt !== undefined && !(Number(value) > cond.$gt)) return false
      if (cond.$gte !== undefined && !(Number(value) >= cond.$gte)) return false
      if (cond.$lt !== undefined && !(Number(value) < cond.$lt)) return false
      if (cond.$lte !== undefined && !(Number(value) <= cond.$lte)) return false
      if (cond.$in !== undefined && Array.isArray(cond.$in) && !cond.$in.includes(value)) return false
      if (cond.$nin !== undefined && Array.isArray(cond.$nin) && cond.$nin.includes(value)) return false
      if (cond.$regex !== undefined && typeof value === 'string' && !new RegExp(cond.$regex).test(value)) return false
      if (cond.$exists !== undefined) {
        const exists = this.hasNestedField(doc, key)
        if (cond.$exists !== exists) return false
      }
    }
    return true
  }

  private getNestedValue(doc: Document, path: string): unknown {
    const keys = path.split('.')
    let current: unknown = doc
    for (const k of keys) {
      if (current && typeof current === 'object') {
        current = (current as Document)[k]
      } else {
        return undefined
      }
    }
    return current
  }

  private hasNestedField(doc: Document, path: string): boolean {
    const keys = path.split('.')
    let current: unknown = doc
    for (const k of keys) {
      if (current && typeof current === 'object' && k in (current as Document)) {
        current = (current as Document)[k]
      } else {
        return false
      }
    }
    return true
  }
}

export const importExportService = new ImportExportService()
export const transformationEngine = new TransformationEngine()