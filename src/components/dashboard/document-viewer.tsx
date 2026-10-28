'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Search, Plus, ChevronLeft, ChevronRight, Filter, Edit, Trash2, Download, Upload, FileJson, FileText, Grid, ListTree as Tree, ArrowLeft, X, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Document, QueryFilter } from '@/types'

interface DocumentViewerProps {
  onBack: () => void
}

export function DocumentViewer({ onBack }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [viewMode, setViewMode] = useState<'table' | 'json' | 'tree'>('table')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState<QueryFilter>({ filter: {} })
  const [showFilter, setShowFilter] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  void selectedDoc

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      // In a real app, this would call the API
      // const response = await fetch(`/api/connections/current/databases/${db}/collections/${coll}/documents?...`)
      // For now, use mock data
      const mockDocs = generateMockDocuments(pageSize)
      setDocuments(mockDocs)
      setTotalCount(100)
      setColumns(extractColumns(mockDocs))
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchDocuments()
  }

  const handleViewModeChange = (mode: 'table' | 'json' | 'tree') => {
    setViewMode(mode)
  }

  const handleEdit = (doc: Document) => {
    setSelectedDoc(doc)
    // Open edit dialog
  }

  const handleDelete = async (_id: string) => {
    void _id
    if (confirm('Are you sure you want to delete this document?')) {
      // Delete document
      fetchDocuments()
    }
  }

  const handleDuplicate = (_doc: Document) => {
    void _doc
    // Duplicate document
  }

  const handleExport = () => {
    // Export documents
  }

  const handleImport = () => {
    // Import documents
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight truncate">Documents</h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">View, query, and manage collection documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button onClick={() => setSelectedDoc(null)} size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs font-semibold shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilter && (
        <Card className="border bg-card/80">
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Filter (JSON)</Label>
                <Input
                  value={JSON.stringify(filter.filter, null, 2)}
                  onChange={(e) => {
                    try {
                      setFilter({ ...filter, filter: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  placeholder='{ "field": "value" }'
                  className="font-mono text-xs h-8"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Projection (JSON)</Label>
                <Input
                  value={JSON.stringify(filter.projection || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setFilter({ ...filter, projection: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  placeholder='{ "field": 1 }'
                  className="font-mono text-xs h-8"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Sort (JSON)</Label>
                <Input
                  value={JSON.stringify(filter.sort || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setFilter({ ...filter, sort: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  placeholder='{ "field": 1 }'
                  className="font-mono text-xs h-8"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)} className="text-xs">
                <X className="h-3.5 w-3.5 mr-1" />
                Hide Filter
              </Button>
              <Button size="sm" onClick={fetchDocuments} className="text-xs">
                <Search className="h-3.5 w-3.5 mr-1" />
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showFilter && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowFilter(true)} className="text-xs gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Query & Filter
          </Button>
        </div>
      )}

      {/* Documents */}
      <Card className="border bg-card/80">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as typeof viewMode)}>
                <TabsList className="bg-muted/60 p-0.5 h-8">
                  <TabsTrigger value="table" className="h-7 px-2.5 text-xs"><Grid className="h-3.5 w-3.5 mr-1" /> Table</TabsTrigger>
                  <TabsTrigger value="json" className="h-7 px-2.5 text-xs"><FileJson className="h-3.5 w-3.5 mr-1" /> JSON</TabsTrigger>
                  <TabsTrigger value="tree" className="h-7 px-2.5 text-xs"><Tree className="h-3.5 w-3.5 mr-1" /> Tree</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); fetchDocuments(); }}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span>Page {currentPage} of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
              <span>•</span>
              <span>{totalCount.toLocaleString()} total documents</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'table' && (
            <DocumentTable
              documents={documents}
              columns={columns}
              loading={loading}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          )}
          {viewMode === 'json' && (
            <DocumentJsonView documents={documents} loading={loading} />
          )}
          {viewMode === 'tree' && (
            <DocumentTreeView documents={documents} loading={loading} />
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(totalCount / pageSize)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

interface DocumentTableProps {
  documents: Document[]
  columns: string[]
  loading: boolean
  sortField: string
  sortOrder: 'asc' | 'desc'
  onSort: (field: string) => void
  onEdit: (doc: Document) => void
  onDelete: (id: string) => void
  onDuplicate: (doc: Document) => void
}

function DocumentTable({ documents, columns, loading, sortField, sortOrder, onSort, onEdit, onDelete, onDuplicate }: DocumentTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading documents...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p>No documents found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <Table className="min-w-[650px]">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {columns.map((col: string) => (
              <TableHead
                key={col}
                className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-xs font-semibold"
                onClick={() => onSort(col)}
              >
                <div className="flex items-center gap-1 font-mono">
                  {col}
                  {sortField === col && (
                    sortOrder === 'asc' ? <ChevronRight className="h-3 w-3 text-primary" /> : <ChevronLeft className="h-3 w-3 text-primary" />
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[80px] text-right pr-4 text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc: Document) => (
            <TableRow key={doc._id?.toString() || Math.random()} className="hover:bg-muted/40 transition-colors">
              {columns.map((col: string) => (
                <TableCell key={col} className="px-3 py-2 text-xs max-w-[200px] truncate">
                  <DocumentValue value={getNestedValue(doc, col)} />
                </TableCell>
              ))}
              <TableCell className="text-right pr-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(doc)} className="text-xs">
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(doc)} className="text-xs">
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive text-xs" onClick={() => onDelete(doc._id?.toString() || '')}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface DocumentJsonViewProps {
  documents: Document[]
  loading: boolean
}

function DocumentJsonView({ documents, loading }: DocumentJsonViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading documents...</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[480px] p-4 font-mono text-xs">
      <pre className="whitespace-pre-wrap break-all leading-relaxed p-4 bg-muted/30 rounded-lg border border-border/40">{JSON.stringify(documents, null, 2)}</pre>
    </ScrollArea>
  )
}

interface DocumentTreeViewProps {
  documents: Document[]
  loading: boolean
}

function DocumentTreeView({ documents, loading }: DocumentTreeViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading documents...</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[500px] p-4">
      <div className="space-y-2">
        {documents.map((doc: Document, i: number) => (
          <DocumentTreeNode key={doc._id?.toString() || i} data={doc} name={`Document ${i + 1}`} />
        ))}
      </div>
    </ScrollArea>
  )
}

function DocumentTreeNode({ data, name }: { data: unknown; name: string }) {
  const [open, setOpen] = useState(false)
  const isObject = data && typeof data === 'object' && !Array.isArray(data)
  const isArray = Array.isArray(data)

  if (!isObject && !isArray) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{name}:</span>
        <DocumentValue value={data} />
      </div>
    )
  }

  return (
    <div className="ml-4 border-l border-muted/50 pl-4">
      <div className="flex items-center gap-2 text-sm" onClick={() => setOpen(!open)}>
        <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} />
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">
          {isObject ? `Object (${Object.keys(data).length})` : `Array (${data.length})`}
        </span>
      </div>
      {open && (
        <div className="mt-1 space-y-1">
          {isObject ? Object.entries(data).map(([key, value]) => (
            <DocumentTreeNode key={key} data={value} name={key} />
          )) : data.map((value, i) => (
            <DocumentTreeNode key={i} data={value} name={i.toString()} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-muted-foreground/60 font-mono text-xs">null</span>
  if (value === undefined) return <span className="text-muted-foreground/40 font-mono text-xs">undefined</span>
  if (typeof value === 'string') return <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs truncate block" title={value}>&ldquo;{value}&rdquo;</span>
  if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400 font-mono font-medium text-xs">{value}</span>
  if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-mono font-medium text-xs">{value.toString()}</span>
  if (value instanceof Date) return <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px] truncate block" title={value.toISOString()}>ISODate(&ldquo;{value.toISOString()}&rdquo;)</span>
  if (typeof value === 'object') return <span className="text-muted-foreground font-mono text-[11px] truncate block">{Array.isArray(value) ? `[${value.length} items]` : '{...}'}</span>
  return <span className="truncate block font-mono text-xs">{String(value)}</span>
}

function getNestedValue(obj: Document, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => (current as Record<string, unknown>)?.[key], obj)
}

function extractColumns(documents: Document[]): string[] {
  const columns = new Set<string>()
  documents.forEach(doc => {
    flattenKeys(doc).forEach(key => columns.add(key))
  })
  return Array.from(columns).sort()
}

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, newKey))
    } else {
      keys.push(newKey)
    }
  }
  return keys
}

function generateMockDocuments(count: number): Document[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: `ObjectId("${'507f1f77bcf86cd799439011'.slice(0, -1)}${i.toString(16).padStart(1, '0')}")`,
    name: `Document ${i + 1}`,
    value: Math.floor(Math.random() * 1000),
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    active: Math.random() > 0.5,
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    tags: ['tag1', 'tag2'].slice(0, Math.floor(Math.random() * 3)),
    metadata: { source: 'test', version: 1 }
  }))
}