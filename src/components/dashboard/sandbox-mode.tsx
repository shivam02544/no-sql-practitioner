'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Terminal, Database, BookOpen, RefreshCw, Save, Trash2 } from 'lucide-react'

interface SandboxModeProps {
  onBack: () => void
}

const SAMPLE_QUERIES = {
  find: 'db.movies.find({ year: { $gte: 2000 } }).limit(10)',
  aggregate: 'db.movies.aggregate([{ $match: { year: { $gte: 2000 } } }, { $group: { _id: "$genre", count: { $sum: 1 } } }])',
  update: 'db.movies.updateMany({ year: { $lt: 2000 } }, { $set: { classic: true } })',
  index: 'db.movies.createIndex({ title: "text", plot: "text" })',
}

export function SandboxMode({ onBack }: SandboxModeProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'datasets'>('learn')
  const [query, setQuery] = useState(SAMPLE_QUERIES.find)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    setOutput('Executing query...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    setOutput(`Query executed successfully!\n\n// ${query}\n[\n  { "_id": "1", "title": "The Dark Knight", "year": 2008, "genre": "Action" },\n  { "_id": "2", "title": "Inception", "year": 2010, "genre": "Sci-Fi" }\n]`)
    setRunning(false)
  }

  const loadSample = (sampleQuery: string) => {
    setQuery(sampleQuery)
    setOutput('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Sandbox Mode</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Learn MongoDB queries in a safe, interactive environment</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/60">
          <TabsTrigger value="learn" className="text-xs sm:text-sm py-2">
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
            <span className="truncate">Guided Lessons</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="text-xs sm:text-sm py-2">
            <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
            <span className="truncate">Free Practice</span>
          </TabsTrigger>
          <TabsTrigger value="datasets" className="text-xs sm:text-sm py-2">
            <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" />
            <span className="truncate">Sample Datasets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Lessons</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Step-by-step MongoDB tutorials</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2.5">
                  {[
                    { id: 'intro', title: 'Introduction to MongoDB', desc: 'Learn the basics of documents and collections', duration: '10 min' },
                    { id: 'crud', title: 'CRUD Operations', desc: 'Create, read, update, and delete documents', duration: '15 min' },
                    { id: 'query', title: 'Querying Data', desc: 'Filter, sort, and project query results', duration: '20 min' },
                    { id: 'aggregation', title: 'Aggregation Pipeline', desc: 'Transform and analyze data with pipelines', duration: '25 min' },
                    { id: 'indexes', title: 'Indexes & Performance', desc: 'Optimize queries with proper indexing', duration: '15 min' },
                    { id: 'data-modeling', title: 'Data Modeling', desc: 'Design effective schemas for your use case', duration: '20 min' },
                  ].map(lesson => (
                    <div key={lesson.id} className="p-3 border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border cursor-pointer transition-all space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-xs sm:text-sm leading-snug">{lesson.title}</h4>
                        <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">{lesson.duration}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{lesson.desc}</p>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">Start Lesson</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-8 space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Lesson: Introduction to MongoDB</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Interactive tutorial with live query execution</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="p-4 bg-muted/40 border border-border/50 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Welcome to MongoDB Sandbox!</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      This interactive environment lets you practice MongoDB queries safely against mock datasets.
                      Try clicking a sample template below or write your own queries in the editor.
                    </p>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 pt-1">
                      {Object.entries(SAMPLE_QUERIES).map(([key, value]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-mono justify-center"
                          onClick={() => loadSample(value)}
                        >
                          {key}()
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Query Editor</label>
                      <textarea
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full h-64 font-mono text-xs p-3 border border-border/60 rounded-lg bg-zinc-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                        placeholder="Enter MongoDB query..."
                        spellCheck={false}
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleRun} disabled={running}>
                          {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          {running ? 'Running...' : 'Run Query'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setQuery('')}>
                          <Trash2 className="h-3.5 w-3.5" /> Clear
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                          <Save className="h-3.5 w-3.5" /> Save
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Output</label>
                      <div className="w-full h-64 font-mono text-xs p-3 border border-border/60 rounded-lg bg-zinc-950 text-zinc-100 overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                        {output || <span className="text-zinc-500 italic">{'// Output will appear here after execution...'}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Free Practice Mode</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Experiment with MongoDB queries without constraints</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Query Editor</label>
                  <textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full h-80 font-mono text-xs p-3 border border-border/60 rounded-lg bg-zinc-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                    placeholder="Enter any MongoDB query..."
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleRun} disabled={running}>
                      {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      {running ? 'Running...' : 'Run Query'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setQuery('')}>
                      <Trash2 className="h-3.5 w-3.5" /> Clear
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                      <Save className="h-3.5 w-3.5" /> Save Query
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Output</label>
                  <div className="w-full h-80 font-mono text-xs p-3 border border-border/60 rounded-lg bg-zinc-950 text-zinc-100 overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                    {output || <span className="text-zinc-500 italic">{'// Output will appear here...'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/40">
                <span className="text-xs font-medium text-muted-foreground">Quick samples:</span>
                {Object.entries(SAMPLE_QUERIES).map(([key, value]) => (
                  <Button key={key} variant="outline" size="sm" className="h-7 text-xs font-mono" onClick={() => loadSample(value)}>
                    {key}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datasets" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Sample Mflix', desc: 'Movie database with 23k+ documents', collections: ['movies', 'users', 'comments', 'sessions'], icon: '🎬' },
              { name: 'Sample Analytics', desc: 'E-commerce transactions and customers', collections: ['transactions', 'customers', 'products'], icon: '📊' },
              { name: 'Sample Geospatial', desc: 'Restaurant locations with GeoJSON', collections: ['restaurants', 'neighborhoods'], icon: '🗺️' },
              { name: 'Sample Training', desc: 'Student grades and classes', collections: ['grades', 'students', 'classes'], icon: '🎓' },
              { name: 'Sample Airbnb', desc: 'Airbnb listings and reviews', collections: ['listings', 'reviews', 'calendar'], icon: '🏠' },
              { name: 'Sample Weather', desc: 'Weather station data', collections: ['stations', 'readings', 'forecasts'], icon: '🌤️' },
            ].map(dataset => (
              <Card key={dataset.name} className="h-full flex flex-col shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl shrink-0">{dataset.icon}</span>
                    <CardTitle className="text-base font-semibold truncate">{dataset.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed">{dataset.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {dataset.collections.map(col => (
                      <Badge key={col} variant="outline" className="text-[11px] font-mono px-2 py-0.5">{col}</Badge>
                    ))}
                  </div>
                  <Button className="w-full h-8 text-xs gap-1.5" variant="outline">
                    <Play className="h-3.5 w-3.5" />
                    Load Dataset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}