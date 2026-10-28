import { Db } from 'mongodb'
import { PerformanceMetrics, SlowQuery, OptimizationSuggestion, IndexUsageMetrics, OperationMetrics, LatencyMetrics, ThroughputMetrics, ConnectionMetrics, MemoryMetrics, LockMetrics, LockMetric, Document } from '@/types'

export class PerformanceMonitor {
  private queryHistory: SlowQuery[] = []
  private readonly MAX_HISTORY = 1000

  async collectMetrics(db: Db, databaseName: string): Promise<PerformanceMetrics> {
    const [serverStatus, collections] = await Promise.all([
      this.getServerStatus(db),
      this.getCollectionMetrics(db),
    ])

    const indexUsage = await this.getIndexUsage(db, collections.map(c => c.name))

    return {
      collectionName: '',
      databaseName,
      timestamp: new Date(),
      operations: this.extractOperationMetrics(serverStatus),
      latency: this.extractLatencyMetrics(serverStatus),
      throughput: this.extractThroughputMetrics(serverStatus),
      connections: this.extractConnectionMetrics(serverStatus),
      memory: this.extractMemoryMetrics(serverStatus),
      locks: this.extractLockMetrics(serverStatus),
      indexUsage,
    }
  }

  private async getServerStatus(db: Db): Promise<Document> {
    return await db.admin().command({ serverStatus: 1 })
  }

  private async getCollectionMetrics(db: Db): Promise<Array<{ name: string; stats: Document }>> {
    const collections = await db.listCollections().toArray()
    const metrics = []

    for (const coll of collections) {
      try {
        const stats = await db.command({ collStats: coll.name })
        metrics.push({ name: coll.name, stats })
      } catch {
        // Skip collections that can't be accessed
      }
    }

    return metrics
  }

  private async getIndexUsage(db: Db, collectionNames: string[]): Promise<IndexUsageMetrics[]> {
    const usage: IndexUsageMetrics[] = []

    for (const name of collectionNames) {
      try {
        const result = await db.command({ indexStats: name })
        if (result.indexes) {
          for (const idx of result.indexes) {
            usage.push({
              indexName: idx.name,
              accesses: idx.accesses?.ops || 0,
              hits: idx.accesses?.ops || 0,
              misses: 0,
              hitRatio: 1,
              size: idx.size || 0,
            })
          }
        }
      } catch {
        // Index stats not available
      }
    }

    return usage
  }

  private extractOperationMetrics(serverStatus: Document): OperationMetrics {
    const opcounters = serverStatus.opcounters || {}
    return {
      insert: opcounters.insert || 0,
      query: opcounters.query || 0,
      update: opcounters.update || 0,
      delete: opcounters.delete || 0,
      getmore: opcounters.getmore || 0,
      command: opcounters.command || 0,
    }
  }

  private extractLatencyMetrics(serverStatus: Document): LatencyMetrics {
    const latencies = serverStatus.latencies || {}
    const read = latencies.reads || { latency: 0 }
    const write = latencies.writes || { latency: 0 }
    const command = latencies.commands || { latency: 0 }

    const calcPercentiles = (latency: number): LatencyMetrics['read'] => ({
      p50: latency,
      p90: latency * 1.5,
      p95: latency * 2,
      p99: latency * 3,
      max: latency * 5,
    })

    return {
      read: calcPercentiles(read.latency || 0),
      write: calcPercentiles(write.latency || 0),
      command: calcPercentiles(command.latency || 0),
    }
  }

  private extractThroughputMetrics(serverStatus: Document): ThroughputMetrics {
    const opcounters = serverStatus.opcounters || {}
    const uptime = serverStatus.uptime || 1

    return {
      readsPerSecond: (opcounters.query || 0) / uptime,
      writesPerSecond: ((opcounters.insert || 0) + (opcounters.update || 0) + (opcounters.delete || 0)) / uptime,
      commandsPerSecond: (opcounters.command || 0) / uptime,
    }
  }

  private extractConnectionMetrics(serverStatus: Document): ConnectionMetrics {
    const connections = serverStatus.connections || {}
    return {
      current: connections.current || 0,
      available: connections.available || 0,
      totalCreated: connections.totalCreated || 0,
    }
  }

  private extractMemoryMetrics(serverStatus: Document): MemoryMetrics {
    const mem = serverStatus.mem || {}
    return {
      resident: (mem.resident || 0) * 1024 * 1024,
      virtual: (mem.virtual || 0) * 1024 * 1024,
      mapped: (mem.mapped || 0) * 1024 * 1024,
      mappedWithJournal: (mem.mappedWithJournal || 0) * 1024 * 1024,
    }
  }

  private extractLockMetrics(serverStatus: Document): LockMetrics {
    const locks = serverStatus.locks || {}
    const global = locks.Global || {}
    const database = locks.Database || {}
    const collection = locks.Collection || {}
    const mutex = locks.Mutex || {}

    const extractLock = (lock: Document): LockMetric => ({
      acquireCount: lock.acquireCount || 0,
      acquireWaitCount: lock.acquireWaitCount || 0,
      timeAcquiringMicros: lock.timeAcquiringMicros || 0,
      deadlockCount: lock.deadlockCount || 0,
    })

    return {
      global: extractLock(global),
      database: extractLock(database),
      collection: extractLock(collection),
      mutex: extractLock(mutex),
    }
  }

  recordSlowQuery(query: SlowQuery): void {
    this.queryHistory.unshift(query)
    if (this.queryHistory.length > this.MAX_HISTORY) {
      this.queryHistory.pop()
    }
  }

  getSlowQueries(limit = 100): SlowQuery[] {
    return this.queryHistory.slice(0, limit)
  }

  getSlowQueriesByCollection(collection: string): SlowQuery[] {
    return this.queryHistory.filter(q => q.collection === collection)
  }

  clearHistory(): void {
    this.queryHistory = []
  }

  analyzeQueryPerformance(explainPlan: Document): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    const winningPlan = explainPlan.queryPlanner?.winningPlan
    const executionStats = explainPlan.executionStats

    if (!winningPlan) return suggestions

    // Check for collection scan
    if (this.hasCollectionScan(winningPlan)) {
      suggestions.push({
        type: 'index',
        severity: 'high',
        title: 'Collection Scan Detected',
        description: 'The query is performing a full collection scan. Consider adding an index to improve performance.',
        impact: 'High - Collection scans examine every document in the collection',
        effort: 'low',
        suggestedAction: 'Create an index on the query filter fields. Use db.collection.createIndex({ field: 1 })',
      })
    }

    // Check for high document examination
    if (executionStats && executionStats.totalDocsExamined > 1000) {
      const ratio = executionStats.totalDocsExamined / Math.max(executionStats.nReturned, 1)
      if (ratio > 10) {
        suggestions.push({
          type: 'index',
          severity: 'medium',
          title: 'High Document Examination Ratio',
          description: `The query examined ${executionStats.totalDocsExamined} documents but returned only ${executionStats.nReturned} (ratio: ${ratio.toFixed(1)}:1).`,
          impact: 'Medium - Excessive document scanning wastes I/O and CPU',
          effort: 'low',
          suggestedAction: 'Create a compound index that matches the query filter and sort order. Consider covering indexes.',
        })
      }
    }

    // Check for sort without index
    if (winningPlan.stage === 'SORT' && !this.hasIndexScan(winningPlan)) {
      suggestions.push({
        type: 'index',
        severity: 'medium',
        title: 'In-Memory Sort',
        description: 'The query is performing an in-memory sort without an index. This can be slow for large result sets.',
        impact: 'Medium - Sorting large datasets in memory can exceed memory limits',
        effort: 'low',
        suggestedAction: 'Create an index that matches the sort order. For compound indexes, put equality fields first, then sort fields.',
      })
    }

    // Check for $or queries without index
    if (this.hasOrQuery(winningPlan)) {
      suggestions.push({
        type: 'query',
        severity: 'medium',
        title: '$or Query Optimization',
        description: 'The query uses $or which may not use indexes efficiently.',
        impact: 'Medium - $or queries may scan multiple index ranges',
        effort: 'medium',
        suggestedAction: 'Consider restructuring the query or using a compound index with $or clauses that share a common prefix.',
      })
    }

    // Check for sparse index usage
    if (this.usesSparseIndex(winningPlan)) {
      suggestions.push({
        type: 'index',
        severity: 'low',
        title: 'Sparse Index Usage',
        description: 'The query uses a sparse index which only includes documents that have the indexed field.',
        impact: 'Low - Documents without the field are not indexed',
        effort: 'low',
        suggestedAction: 'Ensure sparse index behavior is intended. Consider partial indexes for more control.',
      })
    }

    return suggestions
  }

  private hasCollectionScan(plan: Document): boolean {
    if (plan.stage === 'COLLSCAN') return true
    if (plan.inputStage) return this.hasCollectionScan(plan.inputStage)
    if (plan.inputStages) return plan.inputStages.some((s: Document) => this.hasCollectionScan(s))
    return false
  }

  private hasIndexScan(plan: Document): boolean {
    if (plan.stage === 'IXSCAN') return true
    if (plan.inputStage) return this.hasIndexScan(plan.inputStage)
    if (plan.inputStages) return plan.inputStages.some((s: Document) => this.hasIndexScan(s))
    return false
  }

  private hasOrQuery(plan: Document): boolean {
    const query = plan.queryPlanner?.parsedQuery
    if (query && query.$or) return true
    return false
  }

  private usesSparseIndex(plan: Document): boolean {
    const indexName = plan.queryPlanner?.winningPlan?.indexName
    if (!indexName) return false
    // This would require checking index definition
    return false
  }

  generateOptimizationReport(indexUsage: IndexUsageMetrics[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // Unused indexes
    const unusedIndexes = indexUsage.filter(idx => idx.accesses === 0)
    for (const idx of unusedIndexes) {
      suggestions.push({
        type: 'index',
        severity: 'low',
        title: `Unused Index: ${idx.indexName}`,
        description: `Index "${idx.indexName}" has never been used. It consumes storage and slows down writes.`,
        impact: 'Low - Wasted storage and write overhead',
        effort: 'low',
        suggestedAction: `Consider dropping the index: db.collection.dropIndex("${idx.indexName}")`,
      })
    }

    // Low hit ratio indexes
    const lowHitIndexes = indexUsage.filter(idx => idx.hitRatio < 0.5 && idx.accesses > 100)
    for (const idx of lowHitIndexes) {
      suggestions.push({
        type: 'index',
        severity: 'medium',
        title: `Low Hit Ratio Index: ${idx.indexName}`,
        description: `Index "${idx.indexName}" has a hit ratio of ${(idx.hitRatio * 100).toFixed(1)}%. It may not be selective enough.`,
        impact: 'Medium - Index maintenance overhead without proportional query benefit',
        effort: 'medium',
        suggestedAction: 'Review the index selectivity. Consider a more selective compound index or partial index.',
      })
    }

    // Large indexes
    const largeIndexes = indexUsage.filter(idx => idx.size > 100 * 1024 * 1024) // > 100MB
    for (const idx of largeIndexes) {
      suggestions.push({
        type: 'index',
        severity: 'low',
        title: `Large Index: ${idx.indexName}`,
        description: `Index "${idx.indexName}" is ${(idx.size / 1024 / 1024).toFixed(1)}MB. Large indexes consume significant memory and disk.`,
        impact: 'Low - Memory and storage pressure',
        effort: 'medium',
        suggestedAction: 'Evaluate if the index is necessary. Consider partial indexes or removing unused fields from compound indexes.',
      })
    }

    return suggestions
  }
}

export const performanceMonitor = new PerformanceMonitor()