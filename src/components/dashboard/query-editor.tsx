'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Save, Copy, Download, Terminal, ArrowLeft, History, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Editor } from '@monaco-editor/react'

interface QueryEditorProps {
  onBack: () => void
}

export function QueryEditor({ onBack }: QueryEditorProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'aggregate' | 'update' | 'delete' | 'command'>('find')
  const [query, setQuery] = useState(`db.collection.find({})
  // Example queries:
  // db.users.find({ age: { $gte: 18 } })
  // db.orders.find({ status: "completed" }).sort({ createdAt: -1 }).limit(10)
  // db.products.find({ price: { $gt: 100, $lt: 500 } }, { name: 1, price: 1 })`)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ query: string; timestamp: Date; type: string }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [savedQueries, setSavedQueries] = useState<Array<{ name: string; query: string; type: string }>>([])

  const handleExecute = async () => {
    setLoading(true)
    try {
      // In a real app, this would call the API
      // const response = await fetch('/api/connections/current/query', { method: 'POST', body: JSON.stringify({ type: activeTab, query }) })
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, 500))
      setResult(`// Query executed successfully\n// Type: ${activeTab}\n// Time: ${new Date().toLocaleTimeString()}\n\n// Results would appear here\n{ "acknowledged": true, "matchedCount": 1, "modifiedCount": 1 }`)

      // Add to history
      setHistory(prev => [{ query, timestamp: new Date(), type: activeTab }, ...prev.slice(0, 49)])
    } catch (error) {
      setResult(`// Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    const name = prompt('Enter a name for this query:')
    if (name) {
      setSavedQueries(prev => [...prev, { name, query, type: activeTab }])
    }
  }

  const handleLoadSaved = (savedQuery: string) => {
    setQuery(savedQuery)
  }

  const handleLoadHistory = (histQuery: string) => {
    setQuery(histQuery)
    setShowHistory(false)
  }

  const templates = {
    find: `db.collection.find({})
// Find all documents
// db.collection.find({})

// Find with filter
// db.collection.find({ status: "active", age: { $gte: 18 } })

// Find with projection
// db.collection.find({}, { name: 1, email: 1, _id: 0 })

// Find with sort and limit
// db.collection.find({}).sort({ createdAt: -1 }).limit(10)

// Find with skip (pagination)
// db.collection.find({}).skip(20).limit(10)`,
    aggregate: `db.collection.aggregate([
  // Pipeline stages
  // { $match: { status: "active" } },
  // { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
  // { $sort: { count: -1 } },
  // { $limit: 10 }
])`,
    update: `db.collection.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "updated", updatedAt: new Date() } }
)

// Update many
// db.collection.updateMany(
//   { status: "pending" },
//   { $set: { status: "processing" } }
// )

// Upsert
// db.collection.updateOne(
//   { email: "user@example.com" },
//   { $setOnInsert: { createdAt: new Date() }, $set: { lastLogin: new Date() } },
//   { upsert: true }
)`,
    delete: `db.collection.deleteOne({ _id: ObjectId("...") })

// Delete many
// db.collection.deleteMany({ status: "archived", createdAt: { $lt: new Date("2023-01-01") } })`,
    command: `// Administrative commands
// db.runCommand({ ping: 1 })
// db.runCommand({ serverStatus: 1 })
// db.runCommand({ listCollections: 1 })
// db.runCommand({ collStats: "collectionName" })
// db.runCommand({ indexStats: "collectionName" })`
  }

  const handleTemplateSelect = (template: string) => {
    setQuery(template)
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Query Editor</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Write, test, and execute MongoDB queries in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5 text-xs">
            <Save className="h-3.5 w-3.5" />
            Save Query
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            History
          </Button>
          <Button onClick={handleExecute} disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs font-semibold shadow-xs">
            {loading ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Query
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Editor Panel */}
        <div className="xl:col-span-8 min-w-0 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="bg-muted/60 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="find" className="text-xs gap-1.5 py-1.5"><Terminal className="h-3.5 w-3.5" />Find</TabsTrigger>
              <TabsTrigger value="aggregate" className="text-xs gap-1.5 py-1.5"><Terminal className="h-3.5 w-3.5" />Aggregate</TabsTrigger>
              <TabsTrigger value="update" className="text-xs gap-1.5 py-1.5"><Terminal className="h-3.5 w-3.5" />Update</TabsTrigger>
              <TabsTrigger value="delete" className="text-xs gap-1.5 py-1.5"><Terminal className="h-3.5 w-3.5" />Delete</TabsTrigger>
              <TabsTrigger value="command" className="text-xs gap-1.5 py-1.5"><Terminal className="h-3.5 w-3.5" />Command</TabsTrigger>
            </TabsList>

            <TabsContent value="find" className="mt-4 h-[400px]">
              <Editor
                height="100%"
                language="javascript"
                value={query}
                onChange={(value) => value && setQuery(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </TabsContent>

            <TabsContent value="aggregate" className="mt-4 h-[400px]">
              <Editor
                height="100%"
                language="javascript"
                value={query}
                onChange={(value) => value && setQuery(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </TabsContent>

            <TabsContent value="update" className="mt-4 h-[400px]">
              <Editor
                height="100%"
                language="javascript"
                value={query}
                onChange={(value) => value && setQuery(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </TabsContent>

            <TabsContent value="delete" className="mt-4 h-[400px]">
              <Editor
                height="100%"
                language="javascript"
                value={query}
                onChange={(value) => value && setQuery(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </TabsContent>

            <TabsContent value="command" className="mt-4 h-[400px]">
              <Editor
                height="100%"
                language="javascript"
                value={query}
                onChange={(value) => value && setQuery(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Templates */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Templates</CardTitle>
              <CardDescription className="text-xs">Select a common query pattern to populate the editor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Object.entries(templates).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto p-3 text-left justify-start whitespace-normal flex flex-col items-start w-full min-w-0 hover:border-primary/50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <span className="font-semibold text-xs capitalize text-foreground">{key}</span>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {template.split('\n')[1]?.replace('//', '').trim() || 'Execute operation'}
                    </p>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 min-w-0 space-y-4">
          {/* Saved Queries */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Saved Queries</CardTitle>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">{savedQueries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {savedQueries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No saved queries yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                  {savedQueries.map((sq, i) => (
                    <div key={i} className="p-2.5 bg-muted/40 rounded-lg border border-border/40 hover:border-border transition-colors">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="font-semibold text-xs truncate flex-1">{sq.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase flex-shrink-0">{sq.type}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono truncate mt-1 break-all">{sq.query.substring(0, 80)}...</p>
                      <div className="flex gap-2 mt-2 pt-1 border-t border-border/30">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleLoadSaved(sq.query)}>
                          Load
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive ml-auto">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {showHistory && (
            <Card className="border bg-card/80">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">Query History</CardTitle>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">{history.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No history yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-muted/40 rounded-lg border border-border/40 hover:border-primary/40 cursor-pointer transition-colors"
                        onClick={() => handleLoadHistory(h.query)}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase flex-shrink-0">{h.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{h.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] font-mono truncate mt-1 text-muted-foreground break-all">{h.query.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Result Panel */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Results</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(result || '')} title="Copy result">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[280px] font-mono text-xs">
                <pre className="whitespace-pre-wrap break-all leading-relaxed text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border/40">{result || '// No results yet. Execute a query to view output here.'}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Need to create a Textarea component
import * as React from 'react'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'