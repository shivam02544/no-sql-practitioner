'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus, Trash2, Search, ArrowLeft, ChevronUp, ChevronDown, ChevronRight, Layers, FileJson, Database, Code, Link, Key, EyeOff, Copy, Save } from 'lucide-react'
import { SchemaField, BSONType, CollectionSchema } from '@/types'

interface SchemaDesignerProps {
  onBack: () => void
}

const BSON_TYPES: { value: BSONType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'int', label: 'Integer (32-bit)' },
  { value: 'long', label: 'Long (64-bit)' },
  { value: 'double', label: 'Double' },
  { value: 'decimal', label: 'Decimal128' },
  { value: 'bool', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'objectId', label: 'ObjectId' },
  { value: 'object', label: 'Embedded Document' },
  { value: 'array', label: 'Array' },
  { value: 'binData', label: 'Binary Data' },
  { value: 'regex', label: 'Regular Expression' },
  { value: 'javascript', label: 'JavaScript Code' },
  { value: 'null', label: 'Null' },
]

export function SchemaDesigner({ onBack }: SchemaDesignerProps) {
  const [schema, setSchema] = useState<CollectionSchema>({
    collectionName: '',
    databaseName: '',
    fields: [],
    validationRules: {},
    validationLevel: 'strict',
    validationAction: 'error',
    indexes: [],
    relationships: [],
    sampleSize: 0,
    inferredAt: new Date(),
  })
  const [viewMode, setViewMode] = useState<'designer' | 'json' | 'visualization'>('designer')
  const [showAddField, setShowAddField] = useState(false)

  const addField = () => {
    const newField: SchemaField = {
      name: `field${schema.fields.length + 1}`,
      type: 'string',
      required: false,
    }
    setSchema(prev => ({ ...prev, fields: [...prev.fields, newField] }))
    setShowAddField(false)
  }

  const removeField = (index: number) => {
    setSchema(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }))
  }

  const updateField = (index: number, field: Partial<SchemaField>) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }))
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    setSchema(prev => {
      const fields = [...prev.fields]
      const [removed] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, removed)
      return { ...prev, fields }
    })
  }

  const addEmbeddedField = (parentIndex: number) => {
    setSchema(prev => {
      const fields = [...prev.fields]
      const parent = fields[parentIndex]
      if (!parent.embeddedFields) parent.embeddedFields = []
      parent.embeddedFields.push({
        name: `nestedField${parent.embeddedFields.length + 1}`,
        type: 'string',
        required: false,
      })
      return { ...prev, fields }
    })
  }

  const handleInferSchema = async () => {
    // In a real app, this would call the API to infer schema from existing data
  }

  const handleGenerateValidation = () => {
    const properties: Record<string, { bsonType: string }> = {}
    const required: string[] = []
    schema.fields.forEach(field => {
      properties[field.name] = { bsonType: field.type }
      if (field.required) required.push(field.name)
    })
    const validator: Record<string, unknown> = {
      $jsonSchema: { bsonType: 'object', properties, required },
    }
    setSchema(prev => ({ ...prev, validationRules: validator }))
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Schema Designer</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Define field validation, document structures, and relationships</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button variant="outline" size="sm" onClick={handleInferSchema} className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            Infer from Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateValidation} className="gap-1.5 text-xs">
            <Code className="h-3.5 w-3.5" />
            Generate Validation
          </Button>
          <Button onClick={() => setShowAddField(true)} size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs font-semibold shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Schema Designer */}
        <div className="xl:col-span-8 min-w-0 space-y-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList className="bg-muted/60 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="designer" className="text-xs gap-1.5 py-1.5"><Database className="h-3.5 w-3.5" />Designer</TabsTrigger>
              <TabsTrigger value="visualization" className="text-xs gap-1.5 py-1.5"><Layers className="h-3.5 w-3.5" />Visualization</TabsTrigger>
              <TabsTrigger value="json" className="text-xs gap-1.5 py-1.5"><FileJson className="h-3.5 w-3.5" />JSON Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="designer" className="mt-4">
              <Card className="border bg-card/80">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold">Collection Schema</CardTitle>
                      <CardDescription className="text-xs">Define fields, BSON data types, and validation rules</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                      <Input
                        value={schema.collectionName}
                        onChange={(e) => setSchema({ ...schema, collectionName: e.target.value })}
                        placeholder="Collection name"
                        className="w-[140px] sm:w-[160px] h-8 text-xs font-mono"
                      />
                      <Input
                        value={schema.databaseName}
                        onChange={(e) => setSchema({ ...schema, databaseName: e.target.value })}
                        placeholder="Database name"
                        className="w-[140px] sm:w-[160px] h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {schema.fields.length === 0 && !showAddField ? (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg">
                      <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">No fields defined</h3>
                      <p className="text-muted-foreground mb-4">Add fields to design your collection schema</p>
                      <Button onClick={() => setShowAddField(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Field
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {showAddField && (
                        <AddFieldForm onSubmit={addField} onCancel={() => setShowAddField(false)} />
                      )}
                      {schema.fields.map((field, index) => (
                        <FieldRow
                          key={field.name}
                          field={field}
                          index={index}
                          onUpdate={(updates) => updateField(index, updates)}
                          onRemove={() => removeField(index)}
                          onMoveUp={() => index > 0 && moveField(index, index - 1)}
                          onMoveDown={() => index < schema.fields.length - 1 && moveField(index, index + 1)}
                          onAddEmbedded={() => field.type === 'object' && addEmbeddedField(index)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleGenerateValidation}>
                    <Code className="h-4 w-4 mr-2" />
                    Generate Validation Rules
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Schema
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="visualization" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Visualization</CardTitle>
                  <CardDescription>Visual representation of the schema structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <SchemaVisualizationComponent schema={schema} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>JSON Schema</CardTitle>
                      <CardDescription>Generated MongoDB JSON Schema for validation</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(schema.validationRules, null, 2))}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(schema.validationRules || { $jsonSchema: { bsonType: 'object', properties: {} } }, null, 2)}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 min-w-0 space-y-4">
          {/* Field Types Reference */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">BSON Types Reference</CardTitle>
            </CardHeader>
            <CardContent className="p-2 max-h-[300px] overflow-y-auto scrollbar-thin space-y-1">
              {BSON_TYPES.map(type => (
                <div key={type.value} className="px-2.5 py-1.5 hover:bg-muted/50 rounded-md flex items-center justify-between text-xs transition-colors">
                  <span className="font-medium text-foreground">{type.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{type.value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Relationships */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Link className="h-3.5 w-3.5 text-primary" />
                Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Add Reference</Label>
                <div className="space-y-2">
                  <Select>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Relationship type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="references">References (→)</SelectItem>
                      <SelectItem value="referencedBy">Referenced By (←)</SelectItem>
                      <SelectItem value="embeds">Embeds (⊂)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Target collection" className="h-8 text-xs font-mono" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Local field" className="h-8 text-xs font-mono" />
                    <Input placeholder="Foreign field" className="h-8 text-xs font-mono" />
                  </div>
                  <Button size="sm" className="w-full text-xs h-8">Add Relationship</Button>
                </div>
              </div>
              {schema.relationships.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  {schema.relationships.map((rel, i) => (
                    <div key={i} className="p-2 bg-muted/40 rounded-md border border-border/40 flex items-center justify-between text-xs min-w-0">
                      <span className="truncate flex-1 font-mono">{rel.fromCollection}.{rel.fromField} → {rel.toCollection}.{rel.toField}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indexes from Schema */}
          <Card className="border bg-card/80">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                Suggested Indexes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {schema.fields.filter(f => f.required || f.type === 'objectId').map((field, i) => (
                <div key={i} className="p-2 bg-muted/40 rounded-md border border-border/40 flex items-center justify-between text-xs min-w-0">
                  <span className="font-mono truncate flex-1">{field.name} ({field.type})</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-primary"><Plus className="h-3 w-3" /></Button>
                </div>
              ))}
              {schema.fields.filter(f => f.required || f.type === 'objectId').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No index suggestions yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AddFieldForm({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<BSONType>('string')
  const [required, setRequired] = useState(false)
  const [description, setDescription] = useState('')

  return (
    <Card className="border-2 border-primary/50 bg-card/90">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Add New Field</h4>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}><EyeOff className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Field Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. userEmail" className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BSONType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BSON_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Field description or comments" className="h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 pt-1">
            <Label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded border-input h-3.5 w-3.5" />
              <span>Required field (reject documents missing this key)</span>
            </Label>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={onSubmit} disabled={!name} className="text-xs">Add Field</Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface FieldRowProps {
  field: SchemaField
  index: number
  onUpdate: (updates: Partial<SchemaField>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddEmbedded: () => void
}

function FieldRow({ field, index, onUpdate, onRemove, onMoveUp, onMoveDown, onAddEmbedded }: FieldRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-l-4 border-primary bg-card/90 transition-all hover:shadow-xs">
      <CardContent className="p-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex flex-col items-center gap-0.5 text-muted-foreground flex-shrink-0 pt-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <span className="font-mono text-xs font-semibold text-primary">{index + 1}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveDown}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Input
                value={field.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-[130px] sm:w-[150px] h-8 text-xs font-mono font-medium"
              />
              <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as BSONType })}>
                <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BSON_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium px-2 py-1 rounded bg-muted/40 border border-border/40 select-none">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="rounded border-input h-3.5 w-3.5"
                />
                Required
              </Label>
              {field.type === 'object' && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onAddEmbedded}>
                  <Plus className="h-3 w-3" /> Embedded
                </Button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setExpanded(!expanded)} title="More options">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove} title="Remove field">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {expanded && (
              <div className="mt-3 ml-10 border-l-2 border-muted/50 pl-4 space-y-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={field.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="Field description" />
                </div>
                {field.type === 'array' && field.arrayItemType && (
                  <div className="space-y-2">
                    <Label>Array Item Type</Label>
                    <Select value={field.arrayItemType.type} onValueChange={(v) => onUpdate({ arrayItemType: { ...field.arrayItemType!, type: v as BSONType } })}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BSON_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {field.type === 'object' && field.embeddedFields && field.embeddedFields.length > 0 && (
                  <div className="space-y-2">
                    <Label>Embedded Fields</Label>
                    <div className="space-y-1 ml-4 border-l-2 border-muted/50 pl-4">
                      {field.embeddedFields.map((ef, ei) => (
                        <div key={ei} className="flex items-center gap-2 text-sm">
                          <Input value={ef.name} onChange={(e) => {
                            const newFields = [...field.embeddedFields!]
                            newFields[ei] = { ...newFields[ei], name: e.target.value }
                            onUpdate({ embeddedFields: newFields })
                          }} className="w-[120px]" />
                          <Select value={ef.type} onValueChange={(v) => {
                            const newFields = [...field.embeddedFields!]
                            newFields[ei] = { ...newFields[ei], type: v as BSONType }
                            onUpdate({ embeddedFields: newFields })
                          }}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BSON_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {field.reference && (
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input value={field.reference.collection} onChange={(e) => onUpdate({ reference: { ...field.reference!, collection: e.target.value } })} placeholder="Target collection" />
                      <Input value={field.reference.field} onChange={(e) => onUpdate({ reference: { ...field.reference!, field: e.target.value } })} placeholder="Foreign field" />
                      <Select value={field.reference.type} onValueChange={(v) => onUpdate({ reference: { ...field.reference!, type: v as 'one-to-one' | 'one-to-many' | 'many-to-many' } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-to-one">One-to-One</SelectItem>
                          <SelectItem value="one-to-many">One-to-Many</SelectItem>
                          <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SchemaVisualizationComponent({ schema }: { schema: CollectionSchema }) {
  return (
    <div className="p-4 min-h-[400px]">
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">{schema.collectionName}</h4>
          <div className="space-y-2">
            {schema.fields.map((field, i) => (
              <div key={field.name} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-center">{i + 1}.</span>
                <span className="font-medium">{field.name}</span>
                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                {field.required && <Badge variant="default" className="text-xs">Required</Badge>}
                {field.reference && <Badge variant="secondary" className="text-xs">→ {field.reference.collection}</Badge>}
              </div>
            ))}
          </div>
        </div>
        {schema.relationships.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Relationships</h4>
            <div className="space-y-1">
              {schema.relationships.map((rel, i) => (
                <div key={i} className="text-sm font-mono">
                  {rel.fromCollection}.{rel.fromField} → {rel.toCollection}.{rel.toField}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}