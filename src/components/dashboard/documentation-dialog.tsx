'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Search,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Layers,
  Database,
  Keyboard,
  Compass,
} from 'lucide-react'

interface DocumentationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DocSnippet {
  title: string
  desc: string
  code: string
  tag: string
}

const CRUD_SNIPPETS: DocSnippet[] = [
  {
    title: 'Find with Filters',
    desc: 'Query documents matching criteria with projection and sort',
    code: `db.collection.find(\n  { status: "active", age: { $gte: 21 } },\n  { name: 1, email: 1, _id: 0 }\n).sort({ createdAt: -1 }).limit(10)`,
    tag: 'READ',
  },
  {
    title: 'Insert Single Document',
    desc: 'Insert a new document into collection',
    code: `db.users.insertOne({\n  name: "Jane Doe",\n  email: "jane@example.com",\n  roles: ["admin", "editor"],\n  createdAt: new Date()\n})`,
    tag: 'CREATE',
  },
  {
    title: 'Insert Many Documents',
    desc: 'Bulk insert multiple documents efficiently',
    code: `db.products.insertMany([\n  { name: "Laptop", price: 999, stock: 24 },\n  { name: "Keyboard", price: 89, stock: 150 }\n], { ordered: false })`,
    tag: 'CREATE',
  },
  {
    title: 'Update with Operators',
    desc: 'Update document fields atomically using $set and $inc',
    code: `db.users.updateOne(\n  { email: "jane@example.com" },\n  {\n    $set: { status: "verified" },\n    $inc: { loginCount: 1 },\n    $currentDate: { lastLogin: true }\n  }\n)`,
    tag: 'UPDATE',
  },
  {
    title: 'Delete Documents',
    desc: 'Remove single or multiple documents meeting condition',
    code: `// Delete single match\ndb.orders.deleteOne({ orderId: "ORD-9912" })\n\n// Delete multiple matches\ndb.sessions.deleteMany({ expiresAt: { $lt: new Date() } })`,
    tag: 'DELETE',
  },
  {
    title: 'Upsert (Insert if not exists)',
    desc: 'Update existing document or create a new one if not found',
    code: `db.analytics.updateOne(\n  { date: "2026-10-28", path: "/dashboard" },\n  { $inc: { views: 1 }, $setOnInsert: { createdAt: new Date() } },\n  { upsert: true }\n)`,
    tag: 'UPDATE',
  },
]

const AGGREGATION_SNIPPETS: DocSnippet[] = [
  {
    title: '$match and $group Pipeline',
    desc: 'Filter documents and calculate aggregated sums/averages',
    code: `db.orders.aggregate([\n  { $match: { status: "completed" } },\n  {\n    $group: {\n      _id: "$category",\n      totalRevenue: { $sum: "$amount" },\n      avgOrderValue: { $avg: "$amount" },\n      orderCount: { $sum: 1 }\n    }\n  },\n  { $sort: { totalRevenue: -1 } }\n])`,
    tag: '$group',
  },
  {
    title: '$lookup (Left Outer Join)',
    desc: 'Join documents from another collection on foreign key',
    code: `db.orders.aggregate([\n  {\n    $lookup: {\n      from: "users",\n      localField: "userId",\n      foreignField: "_id",\n      as: "customer"\n    }\n  },\n  { $unwind: "$customer" }\n])`,
    tag: '$lookup',
  },
  {
    title: '$facet (Multi-faceted Analytics)',
    desc: 'Execute multiple aggregation sub-pipelines in parallel',
    code: `db.products.aggregate([\n  {\n    $facet: {\n      "priceRanges": [\n        { $bucket: { groupBy: "$price", boundaries: [0, 50, 150, 500, 2000] } }\n      ],\n      "topCategories": [\n        { $group: { _id: "$category", count: { $sum: 1 } } },\n        { $sort: { count: -1 } },\n        { $limit: 5 }\n      ]\n    }\n  }\n])`,
    tag: '$facet',
  },
  {
    title: '$addFields and $project',
    desc: 'Compute new fields and reshape document schema',
    code: `db.employees.aggregate([\n  {\n    $addFields: {\n      fullName: { $concat: ["$firstName", " ", "$lastName"] },\n      isSenior: { $gte: ["$yearsOfService", 5] }\n    }\n  },\n  { $project: { password: 0, internalAudit: 0 } }\n])`,
    tag: '$addFields',
  },
]

const OPERATOR_SNIPPETS: DocSnippet[] = [
  {
    title: 'Comparison Operators',
    desc: 'Match values relative to thresholds',
    code: `db.products.find({\n  price: { $gte: 50, $lte: 200 },\n  category: { $in: ["Electronics", "Computers"] },\n  stock: { $ne: 0 }\n})`,
    tag: 'COMPARE',
  },
  {
    title: 'Logical ($or, $and, $not)',
    desc: 'Combine multiple query conditions',
    code: `db.users.find({\n  $or: [\n    { role: "admin" },\n    { department: "Engineering", active: true }\n  ]\n})`,
    tag: 'LOGICAL',
  },
  {
    title: 'Array Operators ($elemMatch, $all)',
    desc: 'Query elements inside embedded array fields',
    code: `db.courses.find({\n  tags: { $all: ["mongodb", "database"] },\n  reviews: {\n    $elemMatch: { rating: { $gte: 4.5 }, verified: true }\n  }\n})`,
    tag: 'ARRAY',
  },
  {
    title: 'Regex & Text Search',
    desc: 'Pattern matching and full-text index searches',
    code: `// Case-insensitive regex\ndb.users.find({ email: { $regex: /@mongodb\\.com$/i } })\n\n// Full text search (requires text index)\ndb.articles.find({ $text: { $search: "database aggregation" } })`,
    tag: 'EVAL',
  },
]

const KEYBOARD_SHORTCUTS = [
  { key: '⌘ K / Ctrl + K', action: 'Open Command Palette' },
  { key: '⌘ / / Ctrl + /', action: 'Quick Search & Collection Finder' },
  { key: '⌘ ↵ / Ctrl + Enter', action: 'Execute Query in Query Editor' },
  { key: 'Esc', action: 'Close Drawer / Modal' },
  { key: 'Alt + ↑ / ↓', action: 'Reorder Aggregation Stages' },
  { key: 'Tab / Shift + Tab', action: 'Navigate form inputs' },
]

export function DocumentationDialog({ open, onOpenChange }: DocumentationDialogProps) {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const filterSnippets = (snippets: DocSnippet[]) => {
    if (!search.trim()) return snippets
    const q = search.toLowerCase()
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden sm:rounded-2xl border-border/80 shadow-2xl p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-card/60 backdrop-blur shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">MongoDB Documentation & Reference</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Interactive query cheat sheets, aggregation patterns, and official references
                </DialogDescription>
              </div>
            </div>
            <a
              href="https://www.mongodb.com/docs/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium self-start sm:self-auto"
            >
              Official Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search operators, pipelines, syntax (e.g. $match, upsert, regex)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs bg-background/80"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-3">
          <Tabs defaultValue="crud" className="w-full">
            <TabsList className="grid grid-cols-4 bg-muted/60 p-1 mb-4">
              <TabsTrigger value="crud" className="text-xs gap-1 py-1.5">
                <Code2 className="h-3.5 w-3.5" />
                CRUD
              </TabsTrigger>
              <TabsTrigger value="aggregation" className="text-xs gap-1 py-1.5">
                <Layers className="h-3.5 w-3.5" />
                Aggregation
              </TabsTrigger>
              <TabsTrigger value="operators" className="text-xs gap-1 py-1.5">
                <Database className="h-3.5 w-3.5" />
                Operators
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-xs gap-1 py-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                Shortcuts
              </TabsTrigger>
            </TabsList>

            {/* CRUD Tab */}
            <TabsContent value="crud" className="space-y-3 m-0">
              {filterSnippets(CRUD_SNIPPETS).map((snippet, idx) => (
                <SnippetCard
                  key={idx}
                  id={`crud-${idx}`}
                  snippet={snippet}
                  copied={copiedId === `crud-${idx}`}
                  onCopy={() => copyToClipboard(snippet.code, `crud-${idx}`)}
                />
              ))}
            </TabsContent>

            {/* Aggregation Tab */}
            <TabsContent value="aggregation" className="space-y-3 m-0">
              {filterSnippets(AGGREGATION_SNIPPETS).map((snippet, idx) => (
                <SnippetCard
                  key={idx}
                  id={`agg-${idx}`}
                  snippet={snippet}
                  copied={copiedId === `agg-${idx}`}
                  onCopy={() => copyToClipboard(snippet.code, `agg-${idx}`)}
                />
              ))}
            </TabsContent>

            {/* Operators Tab */}
            <TabsContent value="operators" className="space-y-3 m-0">
              {filterSnippets(OPERATOR_SNIPPETS).map((snippet, idx) => (
                <SnippetCard
                  key={idx}
                  id={`op-${idx}`}
                  snippet={snippet}
                  copied={copiedId === `op-${idx}`}
                  onCopy={() => copyToClipboard(snippet.code, `op-${idx}`)}
                />
              ))}
            </TabsContent>

            {/* Shortcuts & Guide Tab */}
            <TabsContent value="shortcuts" className="space-y-4 m-0">
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-primary" />
                  Keyboard Shortcuts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {KEYBOARD_SHORTCUTS.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40 text-xs">
                      <span className="text-muted-foreground">{item.action}</span>
                      <kbd className="px-2 py-0.5 bg-background rounded font-mono text-[11px] font-semibold border shadow-xs">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  Curated Developer Guides
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="https://www.mongodb.com/docs/manual/crud/"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/40 transition-colors block text-xs group"
                  >
                    <div className="flex items-center justify-between font-semibold text-foreground group-hover:text-primary">
                      MongoDB CRUD Specifications
                      <ExternalLink className="h-3 w-3" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Queries, projections, update filters, and bulk operations</p>
                  </a>

                  <a
                    href="https://www.mongodb.com/docs/manual/meta/aggregation-quick-reference/"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/40 transition-colors block text-xs group"
                  >
                    <div className="flex items-center justify-between font-semibold text-foreground group-hover:text-primary">
                      Aggregation Pipeline Quick Ref
                      <ExternalLink className="h-3 w-3" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Stage operators, accumulator functions, and optimization tips</p>
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SnippetCard({
  snippet,
  copied,
  onCopy,
}: {
  id: string
  snippet: DocSnippet
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-2 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-foreground">{snippet.title}</h4>
          <Badge variant="outline" className="text-[10px] font-mono uppercase px-1.5 py-0">
            {snippet.tag}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground leading-normal">{snippet.desc}</p>
      <div className="relative">
        <pre className="p-3 rounded-lg bg-muted/60 font-mono text-[11px] text-primary/90 overflow-x-auto leading-relaxed border border-border/40 select-all">
          {snippet.code}
        </pre>
      </div>
    </div>
  )
}
