'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit, ArrowLeft, Zap, Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IndexInfo } from '@/types'

interface IndexManagerProps {
  onBack: () => void
}

export function IndexManager({ onBack }: IndexManagerProps) {
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingIndex, setEditingIndex] = useState<IndexInfo | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    keys: Record<string, number | string>
    unique: boolean
    sparse: boolean
    background: boolean
    expireAfterSeconds: string
    partialFilterExpression: string
  }>({
    name: '',
    keys: { field: 1 },
    unique: false,
    sparse: false,
    background: true,
    expireAfterSeconds: '',
    partialFilterExpression: '',
  })

  const handleCreateIndex = async () => {
    setLoading(true)
    try {
      // Simulate index creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newIndex: IndexInfo = {
        name: formData.name || Object.entries(formData.keys).map(([k, v]) => `${k}_${v}`).join('_'),
        key: formData.keys,
        unique: formData.unique,
        sparse: formData.sparse,
        background: formData.background,
        version: 2,
        expireAfterSeconds: formData.expireAfterSeconds ? parseInt(formData.expireAfterSeconds) : undefined,
        partialFilterExpression: formData.partialFilterExpression ? JSON.parse(formData.partialFilterExpression) : undefined,
      }
      setIndexes(prev => [...prev, newIndex])
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create index:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDropIndex = async (indexName: string) => {
    if (confirm(`Are you sure you want to drop index "${indexName}"?`)) {
      setIndexes(prev => prev.filter(idx => idx.name !== indexName))
    }
  }

  const handleEdit = (index: IndexInfo) => {
    setEditingIndex(index)
    setFormData({
      name: index.name,
      keys: (index.key || { field: 1 }) as Record<string, number | string>,
      unique: index.unique,
      sparse: index.sparse,
      background: index.background,
      expireAfterSeconds: index.expireAfterSeconds?.toString() || '',
      partialFilterExpression: index.partialFilterExpression ? JSON.stringify(index.partialFilterExpression, null, 2) : '',
    })
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setEditingIndex(null)
    setFormData({
      name: '',
      keys: { field: 1 },
      unique: false,
      sparse: false,
      background: true,
      expireAfterSeconds: '',
      partialFilterExpression: '',
    })
  }

  const handleKeyChange = (field: string, value: 1 | -1 | 'text' | '2dsphere' | '2d' | 'hashed') => {
    setFormData(prev => ({ ...prev, keys: { ...prev.keys, [field]: value } }))
  }

  const addKeyField = () => {
    setFormData(prev => ({ ...prev, keys: { ...prev.keys, [`field${Object.keys(prev.keys).length + 1}`]: 1 } }))
  }

  const removeKeyField = (field: string) => {
    if (Object.keys(formData.keys).length <= 1) return
    setFormData(prev => {
      const newKeys = { ...prev.keys }
      delete newKeys[field]
      return { ...prev, keys: newKeys }
    })
  }

  const indexTypes = [
    { value: '1', label: 'Ascending (1)' },
    { value: '-1', label: 'Descending (-1)' },
    { value: 'text', label: 'Text Search' },
    { value: '2dsphere', label: '2dsphere (Geo)' },
    { value: '2d', label: '2d (Legacy Geo)' },
    { value: 'hashed', label: 'Hashed' },
  ]

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight truncate">Index Manager</h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">Optimize query execution and inspect collection index utilization</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs font-semibold shadow-xs self-start sm:self-auto">
          <Plus className="h-3.5 w-3.5" />
          Create Index
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Indexes List */}
        <div className="xl:col-span-8 min-w-0 space-y-4">
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Collection Indexes</CardTitle>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">{indexes.length}</Badge>
              </div>
              <CardDescription className="text-xs">Active indexes configured on this collection</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="p-10 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : indexes.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                    <Key className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-foreground">No indexes found</h3>
                  <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
                    Indexes significantly speed up read queries by avoiding full collection scans (COLLSCAN).
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} size="sm" className="text-xs gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Create First Index
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {indexes.map((index) => (
                    <IndexCard
                      key={index.name}
                      index={index}
                      onEdit={handleEdit}
                      onDrop={() => handleDropIndex(index.name)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Index Recommendations */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                Index Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <RecommendationCard
                  type="missing"
                  title="Missing Index for Frequent Query"
                  description="Queries on 'email' field result in full collection scans. Recommended index: { email: 1 }"
                  action="Create Index"
                />
                <RecommendationCard
                  type="unused"
                  title="Unused Index: old_index_name"
                  description="This index has zero hits. Dropping it will save disk space and improve write throughput."
                  action="Drop Index"
                  variant="destructive"
                />
                <RecommendationCard
                  type="compound"
                  title="Compound Index Opportunity"
                  description="Frequent queries filter by 'status' and sort by 'createdAt'. Recommended: { status: 1, createdAt: -1 }"
                  action="Create Index"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 min-w-0 space-y-4">
          {/* Create/Edit Index Dialog */}
          {showCreateDialog && (
            <Card>
              <CardHeader>
                <CardTitle>{editingIndex ? 'Edit Index' : 'Create New Index'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Index Name (Optional)</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Auto-generated if empty" />
                </div>

                <div className="space-y-2">
                  <Label>Index Keys</Label>
                  <div className="space-y-2">
                    {Object.entries(formData.keys).map(([field, direction]) => (
                      <div key={field} className="flex items-center gap-2">
                        <Input value={field} onChange={(e) => {
                          const newKeys = { ...formData.keys }
                          delete newKeys[field]
                          newKeys[e.target.value] = direction
                          setFormData({ ...formData, keys: newKeys })
                        }} placeholder="field" className="flex-1" />
                        <Select value={String(direction)} onValueChange={(v) => {
                          const parsed = v === '1' ? 1 : v === '-1' ? -1 : (v as 'text' | '2dsphere' | '2d' | 'hashed')
                          handleKeyChange(field, parsed)
                        }}>
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {indexTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeKeyField(field)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addKeyField}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex flex-wrap gap-4">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.unique} onChange={(e) => setFormData({ ...formData, unique: e.target.checked })} className="rounded border-input" />
                        Unique
                      </Label>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.sparse} onChange={(e) => setFormData({ ...formData, sparse: e.target.checked })} className="rounded border-input" />
                        Sparse
                      </Label>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.background} onChange={(e) => setFormData({ ...formData, background: e.target.checked })} className="rounded border-input" />
                        Background
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>TTL (expireAfterSeconds)</Label>
                    <Input type="number" value={formData.expireAfterSeconds} onChange={(e) => setFormData({ ...formData, expireAfterSeconds: e.target.value })} placeholder="3600" />
                  </div>
                  <div className="space-y-2">
                    <Label>Partial Filter Expression (JSON)</Label>
                    <textarea value={formData.partialFilterExpression} onChange={(e) => setFormData({ ...formData, partialFilterExpression: e.target.value })} className="w-full p-2 border rounded font-mono text-sm min-h-[80px]" placeholder='{ "status": { "$exists": true } }' />
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateIndex} disabled={loading}>
                    {loading ? 'Creating...' : (editingIndex ? 'Update' : 'Create')} Index
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Index Types Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Index Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {indexTypes.map(type => (
                <div key={type.value} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.label}</span>
                    <Badge variant="outline">{type.value}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Index Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{indexes.length}</p>
                  <p className="text-xs text-muted-foreground">Total Indexes</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{indexes.filter(i => i.unique).length}</p>
                  <p className="text-xs text-muted-foreground">Unique Indexes</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{indexes.filter(i => i.sparse).length}</p>
                  <p className="text-xs text-muted-foreground">Sparse Indexes</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{indexes.filter(i => i.expireAfterSeconds).length}</p>
                  <p className="text-xs text-muted-foreground">TTL Indexes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Index Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingIndex ? 'Edit Index' : 'Create New Index'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form content would go here */}
            </CardContent>
          </div>
        </div>
      )}
    </div>
  )
}

function IndexCard({ index, onEdit, onDrop }: { index: IndexInfo; onEdit: (index: IndexInfo) => void; onDrop: () => void }) {
  const getIndexType = (key: Record<string, unknown>) => {
    const values = Object.values(key)
    if (values.includes('text')) return 'Text'
    if (values.includes('2dsphere') || values.includes('2d')) return 'Geospatial'
    if (values.includes('hashed')) return 'Hashed'
    return Object.keys(key).length > 1 ? 'Compound' : 'Single Field'
  }

  return (
    <Card className="border-l-4 border-primary bg-card/90 hover:shadow-xs transition-shadow">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="font-mono font-semibold text-xs truncate max-w-[260px]" title={index.name}>{index.name}</h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getIndexType(index.key)}</Badge>
              {index.unique && <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600/90">Unique</Badge>}
              {index.sparse && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Sparse</Badge>}
              {index.expireAfterSeconds && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">TTL: {index.expireAfterSeconds}s</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {Object.entries(index.key).map(([field, direction]) => (
                <span key={field} className="px-2 py-0.5 bg-muted/60 rounded font-mono text-[11px] border border-border/40">
                  {field}: {direction === 1 ? '↑ 1' : direction === -1 ? '↓ -1' : String(direction)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(index)} title="Edit index">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDrop} title="Drop index">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RecommendationCardProps {
  type: string
  title: string
  description: string
  action: string
  variant?: 'default' | 'destructive'
}

function RecommendationCard({ type, title, description, action, variant = 'default' }: RecommendationCardProps) {
  return (
    <Card className={cn('border-l-4 bg-card/90', variant === 'destructive' ? 'border-destructive' : type === 'missing' ? 'border-amber-500' : 'border-blue-500')}>
      <CardContent className="p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs text-foreground truncate">{title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          </div>
          <Button variant={variant === 'destructive' ? 'destructive' : 'outline'} size="sm" className="h-7 text-xs self-start sm:self-auto flex-shrink-0">
            {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}