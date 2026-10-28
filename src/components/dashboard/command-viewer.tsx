'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Copy, Download, Terminal, Filter, Trash2, Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface CommandEntry {
  id?: string
  language: 'shell' | 'node' | 'python' | 'compass'
  timestamp: Date
  operation: string
  database?: string
  collection?: string
  command: string
  explanation?: string
  status?: 'success' | 'error'
  metadata?: {
    duration?: number
    documentsExamined?: number
    keysExamined?: number
    indexUsed?: string
  }
}

interface CommandViewerProps {
  isOpen?: boolean
  defaultCollapsed?: boolean
}

export function CommandViewer({ isOpen = true, defaultCollapsed = true }: CommandViewerProps) {
  const [commands, setCommands] = useState<CommandEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'shell' | 'node' | 'python' | 'compass'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const maxCommands = 100

  // Simulate receiving commands from other components
  useEffect(() => {
    const handleCommand = (event: CustomEvent<CommandEntry>) => {
      setCommands(prev => {
        const newCommands = [event.detail, ...prev].slice(0, maxCommands)
        return newCommands
      })
    }

    window.addEventListener('mongodb-command', handleCommand as EventListener)
    return () => window.removeEventListener('mongodb-command', handleCommand as EventListener)
  }, [])

  const filteredCommands = commands.filter(cmd =>
    filter === 'all' || cmd.language === filter
  )

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const downloadCommands = () => {
    const content = commands.map(cmd =>
      `// ${cmd.timestamp.toISOString()} - ${cmd.language}\n${cmd.command}\n`
    ).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mongodb-commands-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearCommands = () => {
    setCommands([])
  }

  if (!isOpen) return null

  return (
    <aside className={cn(
      'hidden md:flex h-full border-l bg-card transition-all duration-300 flex-shrink-0 relative z-30 flex-col',
      collapsed ? 'w-12' : 'w-80 lg:w-96'
    )}>
      {!collapsed ? (
        <div className="flex flex-col h-full min-w-0">
          {/* Header */}
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between flex-shrink-0 space-y-0">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="h-4 w-4 text-primary flex-shrink-0" />
              <CardTitle className="text-sm font-semibold truncate">Commands</CardTitle>
              <Badge variant="secondary" className="text-[11px] px-1.5 py-0 flex-shrink-0">{commands.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Filter className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Language</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter('shell')}>Mongo Shell</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('node')}>Node.js Driver</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('python')}>PyMongo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('compass')}>MongoDB Compass</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={downloadCommands} title="Download commands">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={clearCommands} title="Clear all">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground ml-1"
                onClick={() => setCollapsed(true)}
                title="Collapse panel"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Auto-scroll toggle */}
          <div className="px-3 py-2 border-b bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
            <input
              type="checkbox"
              id="auto-scroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-input h-3.5 w-3.5"
            />
            <label htmlFor="auto-scroll" className="cursor-pointer select-none">Auto-scroll</label>
            <span className="flex-1" />
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">{filter}</Badge>
          </div>

          {/* Commands List */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground px-4">
                    <div className="p-3 rounded-full bg-muted/40 w-fit mx-auto mb-3">
                      <Terminal className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No commands logged</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                      Run queries or pipeline stages to inspect the generated MongoDB syntax here
                    </p>
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => (
                    <CommandCard
                      key={cmd.id || index}
                      command={cmd}
                      index={index}
                      onCopy={copyCommand}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </div>
      ) : (
        <div
          className="flex flex-col h-full items-center py-3 text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors group select-none"
          onClick={() => setCollapsed(false)}
          title="Expand Command Log"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mb-2 group-hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(false)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 rounded-md group-hover:bg-primary/10 transition-colors">
            <Terminal className="h-5 w-5 group-hover:text-primary" />
          </div>
          {commands.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-2 font-mono">
              {commands.length}
            </Badge>
          )}
          <span className="mt-4 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/80 [writing-mode:vertical-lr] rotate-180">
            Commands
          </span>
        </div>
      )}
    </aside>
  )
}

function CommandCard({ command, index, onCopy }: { command: CommandEntry; index: number; onCopy: (cmd: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const languageColors: Record<string, string> = {
    shell: 'text-green-400',
    node: 'text-blue-400',
    python: 'text-yellow-400',
    compass: 'text-purple-400',
  }

  const languageLabels: Record<string, string> = {
    shell: 'Shell',
    node: 'Node.js',
    python: 'Python',
    compass: 'Compass',
  }

  return (
    <Card className={cn('overflow-hidden', expanded && 'ring-2 ring-primary/50')}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground min-w-[40px]">
            <span className="font-mono">{index + 1}</span>
            <span className={cn('font-medium', languageColors[command.language])}>
              {languageLabels[command.language]}
            </span>
            <span className="font-mono">{command.timestamp.toLocaleTimeString()}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs', languageColors[command.language])}>
                {command.operation}
              </Badge>
              {command.database && (
                <Badge variant="secondary" className="text-xs">
                  {command.database}.{command.collection}
                </Badge>
              )}
              <span className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  onCopy(command.command)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                title="Copy command"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>

            <pre className={cn(
              'font-mono text-xs overflow-x-auto rounded p-2 bg-muted/50',
              expanded ? 'max-h-96' : 'max-h-20 line-clamp-3'
            )}>
              <code>{command.command}</code>
            </pre>

            {expanded && command.explanation && (
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                <strong>Explanation:</strong> {command.explanation}
              </div>
            )}

            {expanded && command.metadata && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <div className="flex flex-wrap gap-2 text-muted-foreground">
                  {command.metadata.duration && <span>⏱ {command.metadata.duration}ms</span>}
                  {command.metadata.documentsExamined && <span>📄 {command.metadata.documentsExamined} docs examined</span>}
                  {command.metadata.keysExamined && <span>🔑 {command.metadata.keysExamined} keys examined</span>}
                  {command.metadata.indexUsed && <span>✅ Index: {command.metadata.indexUsed}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to emit commands from other components
export function emitCommand(command: CommandEntry) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mongodb-command', { detail: command }))
  }
}