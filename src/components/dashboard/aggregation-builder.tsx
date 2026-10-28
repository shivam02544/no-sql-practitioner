'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Play, Copy, Download, Trash2, Eye, ChevronUp, ChevronDown, Layers, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AggregationStage, AggregationPipeline } from '@/types'
import { AGGREGATION_STAGES, aggregationBuilderService } from '@/services/mongodb/aggregation-builder'

interface AggregationBuilderProps {
  onBack: () => void
}

export function AggregationBuilder({ onBack }: AggregationBuilderProps) {
  const [pipeline, setPipeline] = useState<AggregationPipeline>({ stages: [], options: {} })
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStage, setSelectedStage] = useState<AggregationStage | null>(null)
  const [showTemplates, setShowTemplates] = useState(true)

  // Used for stage detail panel
  void setSelectedStage

  const addStage = (operator: string) => {
    const newStage = aggregationBuilderService.createStage(operator)
    setPipeline(prev => ({ ...prev, stages: [...prev.stages, newStage] }))
  }

  const removeStage = (index: number) => {
    setPipeline(prev => aggregationBuilderService.removeStage(prev, index))
  }

  const moveStage = (fromIndex: number, toIndex: number) => {
    setPipeline(prev => aggregationBuilderService.moveStage(prev, fromIndex, toIndex))
  }

  const toggleStage = (index: number) => {
    setPipeline(prev => aggregationBuilderService.toggleStage(prev, index))
  }

  const updateStage = (index: number, expression: Record<string, unknown>) => {
    setPipeline(prev => ({
      ...prev,
      stages: prev.stages.map((s, i) => i === index ? { ...s, expression } : s)
    }))
  }

  const handleExecute = async () => {
    setLoading(true)
    try {
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 500))
      const validation = aggregationBuilderService.validatePipeline(pipeline)
      if (!validation.valid) {
        setResult(`// Validation Errors:\n${validation.errors.map(e => `// - ${e}`).join('\n')}`)
        return
      }
      setResult(`// Pipeline executed successfully\n// Stages: ${pipeline.stages.filter(s => s.enabled).length}\n// Time: ${new Date().toLocaleTimeString()}\n\n// Results would appear here\n[\n  { "_id": "category1", "count": 42, "avgPrice": 125.50 },\n  { "_id": "category2", "count": 38, "avgPrice": 89.99 }\n]`)
    } catch (error) {
      setResult(`// Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = () => {
    setPipeline(prev => aggregationBuilderService.optimizePipeline(prev))
  }

  const stageCategories = AGGREGATION_STAGES.reduce((acc, stage) => {
    if (!acc[stage.category]) acc[stage.category] = []
    acc[stage.category].push(stage)
    return acc
  }, {} as Record<string, typeof AGGREGATION_STAGES>)

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Aggregation Pipeline Builder</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Construct, test, and optimize multi-stage aggregation pipelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button variant="outline" size="sm" onClick={handleOptimize} className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Optimize
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
                Execute Pipeline
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Pipeline Canvas */}
        <div className="xl:col-span-8 min-w-0 space-y-4">
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Pipeline Stages</CardTitle>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">{pipeline.stages.length} stages</Badge>
              </div>
              <CardDescription className="text-xs">Configure stages in sequence to transform and aggregate documents</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {pipeline.stages.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                    <Layers className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-foreground">No stages added yet</h3>
                  <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
                    Select a stage from the palette on the right, or click a quick-start operator below:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(stageCategories).slice(0, 4).map(([category, stages]) => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 h-8"
                        onClick={() => addStage(stages[0].operator)}
                      >
                        <Plus className="h-3 w-3" />
                        {stages[0].operator}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipeline.stages.map((stage, index) => (
                    <StageCard
                      key={stage.id || index}
                      stage={stage}
                      index={index}
                      onRemove={() => removeStage(index)}
                      onMoveUp={() => index > 0 && moveStage(index, index - 1)}
                      onMoveDown={() => index < pipeline.stages.length - 1 && moveStage(index, index + 1)}
                      onToggle={() => toggleStage(index)}
                      onUpdate={(expr) => updateStage(index, expr)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Options */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Pipeline Execution Options</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Allow Disk Use</Label>
                <Select value={pipeline.options?.allowDiskUse ? 'true' : 'false'} onValueChange={(v) => setPipeline(prev => ({ ...prev, options: { ...prev.options, allowDiskUse: v === 'true' } }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled (Disk spillover)</SelectItem>
                    <SelectItem value="false">Disabled (Memory only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Max Time (ms)</Label>
                <input
                  type="number"
                  placeholder="e.g. 60000"
                  value={pipeline.options?.maxTimeMS || ''}
                  onChange={(e) => setPipeline(prev => ({ ...prev, options: { ...prev.options, maxTimeMS: parseInt(e.target.value) || undefined } }))}
                  className="w-full h-8 px-2.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Batch Size</Label>
                <input
                  type="number"
                  placeholder="e.g. 101"
                  value={pipeline.options?.batchSize || ''}
                  onChange={(e) => setPipeline(prev => ({ ...prev, options: { ...prev.options, batchSize: parseInt(e.target.value) || undefined } }))}
                  className="w-full h-8 px-2.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 min-w-0 space-y-4">
          {/* Stage Palette */}
          <Card className="border bg-card/80">
            <CardHeader className="p-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Stage Palette</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setShowTemplates(!showTemplates)}>
                  {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showTemplates && (
              <CardContent className="p-3 max-h-[460px] overflow-y-auto scrollbar-thin">
                <div className="space-y-4">
                  {Object.entries(stageCategories).map(([category, stages]) => (
                    <div key={category} className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">{category}</Label>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {stages.map(stage => (
                          <Button
                            key={stage.operator}
                            variant="outline"
                            size="sm"
                            className="h-auto p-2.5 text-left justify-start whitespace-normal flex flex-col items-start w-full min-w-0 hover:border-primary/50 transition-colors group"
                            onClick={() => addStage(stage.operator)}
                          >
                            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{stage.name}</span>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{stage.description}</p>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage Details */}
          {selectedStage && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedStage.name}</CardTitle>
                <CardDescription>{selectedStage.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Stage Configuration (JSON)</Label>
                    <textarea
                      value={JSON.stringify(selectedStage.expression, null, 2)}
                      onChange={(e) => {
                        try {
                          updateStage(pipeline.stages.findIndex(s => s.id === selectedStage.id), JSON.parse(e.target.value))
                        } catch {}
                      }}
                      className="w-full p-2 border rounded font-mono text-sm min-h-[200px]"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">What this stage does:</p>
                    <p>{aggregationBuilderService.explainStage(selectedStage)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Pipeline Output</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(result || '')} title="Copy results">
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
                <pre className="whitespace-pre-wrap break-all leading-relaxed text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border/40">{result || '// Execute the pipeline to see output results here.'}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface StageCardProps {
  stage: AggregationStage
  index: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onUpdate: (expression: Record<string, unknown>) => void
}

function StageCard({ stage, index, onRemove, onMoveUp, onMoveDown, onToggle, onUpdate }: StageCardProps) {
  return (
    <Card className={cn('border-l-4 transition-all bg-card/90', stage.enabled ? 'border-primary ring-1 ring-primary/20' : 'border-muted opacity-75')}>
      <CardContent className="p-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex flex-col items-center gap-0.5 text-muted-foreground flex-shrink-0 pt-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0} title="Move up">
              <ChevronUp className="h-3 w-3" />
            </Button>
            <span className="font-mono text-xs font-semibold text-primary">{index + 1}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveDown} title="Move down">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant={stage.enabled ? 'default' : 'outline'} className="text-[11px] font-mono px-2 py-0 flex-shrink-0">
                  {stage.operator}
                </Badge>
                <span className="font-semibold text-xs truncate flex-1 min-w-0" title={stage.name}>{stage.name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onToggle} title={stage.enabled ? 'Disable stage' : 'Enable stage'}>
                  {stage.enabled ? <Eye className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-50" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove} title="Remove stage">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <textarea
              value={JSON.stringify(stage.expression, null, 2)}
              onChange={(e) => {
                try {
                  onUpdate(JSON.parse(e.target.value))
                } catch {}
              }}
              className="w-full p-2.5 border rounded-md font-mono text-xs leading-relaxed min-h-[75px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}