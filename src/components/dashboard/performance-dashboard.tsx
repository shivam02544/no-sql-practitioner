'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, RefreshCw, Activity, Database, MemoryStick, AlertTriangle, TrendingUp, Clock, Zap, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceDashboardProps {
  onBack: () => void
}

export function PerformanceDashboard({ onBack }: PerformanceDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Mock data
  const metrics = {
    operations: { insert: 1250, query: 8900, update: 3400, delete: 120, getmore: 450, command: 2100 },
    latency: { read: { p50: 12, p90: 45, p95: 78, p99: 156, max: 890 }, write: { p50: 8, p90: 32, p95: 56, p99: 120, max: 450 }, command: { p50: 5, p90: 18, p95: 34, p99: 89, max: 320 } },
    throughput: { readsPerSecond: 148, writesPerSecond: 58, commandsPerSecond: 35 },
    connections: { current: 45, available: 55, totalCreated: 1240 },
    memory: { resident: 2.4, virtual: 4.8, mapped: 1.2, mappedWithJournal: 2.4 },
    locks: { global: { acquireCount: 125000, acquireWaitCount: 1200, timeAcquiringMicros: 45000000, deadlockCount: 0 } },
  }

  const slowQueries = [
    { query: 'db.orders.find({ status: "pending" }).sort({ createdAt: -1 })', collection: 'orders', database: 'ecommerce', durationMs: 1250, timestamp: new Date(Date.now() - 300000), planSummary: 'COLLSCAN', keysExamined: 0, docsExamined: 125000, nReturned: 15 },
    { query: 'db.users.aggregate([{ $match: { age: { $gte: 18 } } }, { $group: { _id: "$city", count: { $sum: 1 } } }])', collection: 'users', database: 'analytics', durationMs: 890, timestamp: new Date(Date.now() - 600000), planSummary: 'COLLSCAN', keysExamined: 0, docsExamined: 85000, nReturned: 240 },
    { query: 'db.products.find({ category: "electronics", price: { $lt: 500 } })', collection: 'products', database: 'catalog', durationMs: 560, timestamp: new Date(Date.now() - 900000), planSummary: 'IXSCAN { category: 1 }', keysExamined: 1200, docsExamined: 1200, nReturned: 45 },
  ]

  const suggestions = [
    { type: 'index', severity: 'high', title: 'Missing Index on orders.status', description: 'Query on orders collection performs COLLSCAN. Add index: { status: 1, createdAt: -1 }', impact: 'High', effort: 'low', suggestedAction: 'db.orders.createIndex({ status: 1, createdAt: -1 })' },
    { type: 'index', severity: 'medium', title: 'Compound Index for users Query', description: 'Query filters by age and groups by city. Consider compound index: { age: 1, city: 1 }', impact: 'Medium', effort: 'low', suggestedAction: 'db.users.createIndex({ age: 1, city: 1 })' },
    { type: 'query', severity: 'low', title: 'Large Result Set', description: 'Query returns 15 documents but examines 125,000. Consider adding limit() or more selective filter', impact: 'Low', effort: 'low', suggestedAction: 'Add .limit(100) to query' },
  ]

  const indexUsage = [
    { indexName: '_id_', accesses: 45000, hits: 45000, misses: 0, hitRatio: 1, size: 2.5 * 1024 * 1024 },
    { indexName: 'status_1_createdAt_-1', accesses: 12000, hits: 11800, misses: 200, hitRatio: 0.98, size: 5.2 * 1024 * 1024 },
    { indexName: 'email_1', accesses: 8500, hits: 8500, misses: 0, hitRatio: 1, size: 1.8 * 1024 * 1024 },
    { indexName: 'category_1_price_1', accesses: 3200, hits: 2100, misses: 1100, hitRatio: 0.65, size: 8.4 * 1024 * 1024 },
    { indexName: 'old_unused_index', accesses: 0, hits: 0, misses: 0, hitRatio: 0, size: 12.1 * 1024 * 1024 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Performance Dashboard</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Monitor database performance, resource utilization, and slow queries</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={timeRange} onValueChange={(val: '1h' | '6h' | '24h' | '7d') => setTimeRange(val)}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground px-2 py-1 rounded hover:bg-muted/50">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5" />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => {}}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Operations/sec" value={Math.round(metrics.throughput.readsPerSecond + metrics.throughput.writesPerSecond)} icon={Activity} trend="+12%" trendUp />
        <MetricCard title="Read Latency (p95)" value={`${metrics.latency.read.p95}ms`} icon={Clock} trend="-5%" trendUp />
        <MetricCard title="Write Latency (p95)" value={`${metrics.latency.write.p95}ms`} icon={Clock} trend="+3%" trendUp={false} />
        <MetricCard title="Active Connections" value={metrics.connections.current} icon={Database} trend={`${metrics.connections.available} available`} trendUp />
        <MetricCard title="Memory Usage" value={`${metrics.memory.resident} GB`} icon={MemoryStick} trend={`${((metrics.memory.resident / metrics.memory.virtual) * 100).toFixed(0)}% virt`} trendUp />
        <MetricCard title="Lock Wait Ratio" value={`${((metrics.locks.global.acquireWaitCount / metrics.locks.global.acquireCount) * 100).toFixed(2)}%`} icon={AlertTriangle} trend="0 deadlocks" trendUp />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Operations */}
        <Card className="xl:col-span-6 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Operations Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3.5">
              {Object.entries(metrics.operations).map(([op, count]) => (
                <div key={op} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getOpColor(op) }} />
                    <span className="capitalize font-medium text-xs sm:text-sm truncate">{op}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end min-w-0">
                    <div className="w-24 sm:w-36 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / Math.max(...Object.values(metrics.operations))) * 100}%`, backgroundColor: getOpColor(op) }} />
                    </div>
                    <span className="font-mono text-xs sm:text-sm w-16 text-right tabular-nums font-medium text-foreground">{count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latency Percentiles */}
        <Card className="xl:col-span-6 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Latency Percentiles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[440px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground font-medium">
                    <th className="pb-2.5 pr-3">Operation</th>
                    <th className="pb-2.5 px-3">p50</th>
                    <th className="pb-2.5 px-3">p90</th>
                    <th className="pb-2.5 px-3">p95</th>
                    <th className="pb-2.5 px-3">p99</th>
                    <th className="pb-2.5 pl-3 text-right">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Object.entries(metrics.latency).map(([op, percentiles]) => (
                    <tr key={op} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-3 font-medium capitalize">{op}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{percentiles.p50}ms</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{percentiles.p90}ms</td>
                      <td className="py-2.5 px-3 font-mono text-foreground font-medium">{percentiles.p95}ms</td>
                      <td className="py-2.5 px-3 font-mono text-warning font-medium">{percentiles.p99}ms</td>
                      <td className="py-2.5 pl-3 font-mono text-right text-destructive font-medium">{percentiles.max}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Slow Queries */}
        <Card className="xl:col-span-8 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Slow Queries
              </CardTitle>
              <Badge variant="secondary" className="px-2 py-0.5 text-xs">{slowQueries.length} detected</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[720px] text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground font-medium">
                    <th className="pb-2.5 pr-3">Query</th>
                    <th className="pb-2.5 px-3">Collection</th>
                    <th className="pb-2.5 px-3">Duration</th>
                    <th className="pb-2.5 px-3">Plan</th>
                    <th className="pb-2.5 px-3">Keys Examined</th>
                    <th className="pb-2.5 px-3">Docs Examined</th>
                    <th className="pb-2.5 pl-3 text-right">Returned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {slowQueries.map((sq, i) => (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-3 font-mono text-xs max-w-[240px] truncate" title={sq.query}>{sq.query}</td>
                      <td className="py-2.5 px-3 font-medium">{sq.collection}</td>
                      <td className="py-2.5 px-3 font-mono text-destructive font-semibold">{sq.durationMs}ms</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{sq.planSummary}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{sq.keysExamined.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{sq.docsExamined.toLocaleString()}</td>
                      <td className="py-2.5 pl-3 font-mono text-right">{sq.nReturned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card className="xl:col-span-4 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="p-3 border-l-4 bg-muted/40 rounded-r-lg border border-l-transparent space-y-2" style={{ borderLeftColor: getSeverityColor(s.severity) }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs sm:text-sm leading-snug break-words">{s.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.type}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.impact} Impact</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.effort} Effort</Badge>
                      </div>
                    </div>
                    <Badge variant={s.severity === 'high' ? 'destructive' : s.severity === 'medium' ? 'warning' : 'secondary'} className="capitalize text-[10px] shrink-0">
                      {s.severity}
                    </Badge>
                  </div>
                  <div className="p-2 bg-background/80 border border-border/60 rounded font-mono text-[11px] break-all leading-relaxed select-all">
                    {s.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Index Usage */}
        <Card className="xl:col-span-12 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Index Usage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[700px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground font-medium">
                    <th className="pb-2.5 pr-3">Index</th>
                    <th className="pb-2.5 px-3">Accesses</th>
                    <th className="pb-2.5 px-3">Hits</th>
                    <th className="pb-2.5 px-3">Misses</th>
                    <th className="pb-2.5 px-3">Hit Ratio</th>
                    <th className="pb-2.5 px-3">Size</th>
                    <th className="pb-2.5 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {indexUsage.map((idx, i) => (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-3 font-mono text-xs max-w-[220px] truncate" title={idx.indexName}>{idx.indexName}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{idx.accesses.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{idx.hits.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{idx.misses.toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full" style={{ width: `${idx.hitRatio * 100}%`, backgroundColor: idx.hitRatio > 0.8 ? '#10b981' : idx.hitRatio > 0.5 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className="font-mono text-xs tabular-nums">{(idx.hitRatio * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs">{(idx.size / 1024 / 1024).toFixed(1)} MB</td>
                      <td className="py-2.5 pl-3 text-right">
                        {idx.accesses === 0 ? (
                          <Badge variant="destructive" className="text-[10px]">Unused</Badge>
                        ) : idx.hitRatio < 0.5 ? (
                          <Badge variant="warning" className="text-[10px]">Low Hit Ratio</Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px]">Healthy</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; trend: string; trendUp: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3 sm:p-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate" title={title}>{title}</p>
            <p className="text-lg sm:text-2xl font-bold mt-1 tracking-tight truncate">{value}</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-muted/70 rounded-lg shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2.5 min-w-0">
          <TrendingUp className={cn('h-3 w-3 shrink-0', trendUp ? 'text-emerald-500' : 'text-rose-500')} />
          <span className={cn('text-[11px] truncate font-medium', trendUp ? 'text-emerald-500' : 'text-rose-500')}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function getOpColor(op: string): string {
  const colors: Record<string, string> = { insert: 'green', query: 'blue', update: 'orange', delete: 'red', getmore: 'purple', command: 'gray' }
  return colors[op] || 'gray'
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'yellow', critical: 'red' }
  return colors[severity] || 'gray'
}