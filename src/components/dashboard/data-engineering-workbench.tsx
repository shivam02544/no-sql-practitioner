'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Database, FileText, Zap, ArrowRight, ChevronRight, Play, Settings, Download, Upload, Plus } from 'lucide-react'

interface DataEngineeringWorkbenchProps {
  onBack: () => void
}

export function DataEngineeringWorkbench({ onBack }: DataEngineeringWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<'etl' | 'pipeline' | 'transform' | 'export'>('etl')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Data Engineering Workbench</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Build data pipelines, ETL processes, and transformations visually</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-thin border-b border-border/40">
        {[
          { id: 'etl', label: 'ETL Builder', icon: Database },
          { id: 'pipeline', label: 'Pipelines', icon: Zap },
          { id: 'transform', label: 'Transformations', icon: ChevronRight },
          { id: 'export', label: 'Export/Import', icon: Download },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 shrink-0 text-xs sm:text-sm h-9"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Pipeline Canvas */}
        <div className="xl:col-span-8 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0">
                  {activeTab === 'etl' && <Database className="h-4 w-4 text-primary shrink-0" />}
                  {activeTab === 'pipeline' && <Zap className="h-4 w-4 text-primary shrink-0" />}
                  {activeTab === 'transform' && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                  {activeTab === 'export' && <Download className="h-4 w-4 text-primary shrink-0" />}
                  <span className="truncate">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Canvas</span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs shrink-0">Draft Mode</Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">Design and configure data flow stages visually</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-8 sm:p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-4">
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1">No pipeline steps added</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Select steps from the available steps panel to build, filter, map, and output data.
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Source</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"><ChevronRight className="h-3.5 w-3.5" /> Add Transform</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"><Database className="h-3.5 w-3.5" /> Add Destination</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Available Steps</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">Sources</h4>
                <div className="space-y-1.5">
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Database className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">MongoDB Collection</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">CSV File</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="truncate">API Endpoint</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">Transforms</h4>
                <div className="space-y-1.5">
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChevronRight className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="truncate">Filter</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate">Map Fields</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Database className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span className="truncate">Aggregate</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowRight className="h-4 w-4 text-teal-500 shrink-0" />
                      <span className="truncate">Join</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">Destinations</h4>
                <div className="space-y-1.5">
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Database className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">MongoDB Collection</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Download className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">CSV Export</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                  <button className="w-full p-2.5 text-left border border-border/60 rounded-lg hover:bg-muted/50 hover:border-border transition-colors flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Upload className="h-4 w-4 text-rose-500 shrink-0" />
                      <span className="truncate">Data Warehouse</span>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Pipeline Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button className="w-full justify-center gap-2 h-9 text-xs font-medium">
                <Play className="h-3.5 w-3.5" /> Run Pipeline
              </Button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button className="w-full justify-center gap-1.5 h-8 text-xs" variant="outline">
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </Button>
                <Button className="w-full justify-center gap-1.5 h-8 text-xs" variant="outline">
                  <Upload className="h-3.5 w-3.5" /> Import JSON
                </Button>
              </div>
              <Button className="w-full justify-center gap-1.5 h-8 text-xs" variant="outline">
                <Settings className="h-3.5 w-3.5" /> Pipeline Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}