'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, Table, Plus, RefreshCw, FolderOpen, FileText, Layers, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatabaseInfo, CollectionInfo, MongoDBConnection } from '@/types'

const DEMO_DATABASES: DatabaseInfo[] = [
  {
    name: 'ecommerce',
    sizeOnDisk: 45200000,
    dataSize: 38400000,
    indexSize: 6800000,
    collections: 4,
    views: 1,
    objects: 24500,
    avgObjSize: 1560,
    storageSize: 42000000,
    freeStorageSize: 3200000,
  },
  {
    name: 'analytics',
    sizeOnDisk: 124000000,
    dataSize: 110000000,
    indexSize: 14000000,
    collections: 3,
    views: 0,
    objects: 182400,
    avgObjSize: 603,
    storageSize: 118000000,
    freeStorageSize: 8000000,
  },
  {
    name: 'sample_mflix',
    sizeOnDisk: 78000000,
    dataSize: 68000000,
    indexSize: 10000000,
    collections: 3,
    views: 0,
    objects: 45900,
    avgObjSize: 1481,
    storageSize: 72000000,
    freeStorageSize: 4000000,
  },
]

const DEMO_COLLECTIONS: Record<string, CollectionInfo[]> = {
  ecommerce: [
    {
      name: 'users',
      type: 'collection',
      count: 1250,
      size: 1540000,
      avgObjSize: 1232,
      storageSize: 1800000,
      freeStorageSize: 260000,
      totalIndexSize: 320000,
      indexes: [
        { name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 },
        { name: 'email_1', key: { email: 1 }, unique: true, sparse: false, background: true, version: 2 },
      ],
    },
    {
      name: 'products',
      type: 'collection',
      count: 480,
      size: 980000,
      avgObjSize: 2041,
      storageSize: 1200000,
      freeStorageSize: 220000,
      totalIndexSize: 180000,
      indexes: [
        { name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 },
        { name: 'category_1_price_1', key: { category: 1, price: 1 }, unique: false, sparse: false, background: true, version: 2 },
      ],
    },
    {
      name: 'orders',
      type: 'collection',
      count: 8900,
      size: 24500000,
      avgObjSize: 2752,
      storageSize: 26000000,
      freeStorageSize: 1500000,
      totalIndexSize: 4200000,
      indexes: [
        { name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 },
        { name: 'userId_1_status_1', key: { userId: 1, status: 1 }, unique: false, sparse: false, background: true, version: 2 },
      ],
    },
    {
      name: 'reviews',
      type: 'collection',
      count: 13870,
      size: 11380000,
      avgObjSize: 820,
      storageSize: 13000000,
      freeStorageSize: 1620000,
      totalIndexSize: 2100000,
      indexes: [
        { name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 },
      ],
    },
  ],
  analytics: [
    {
      name: 'pageviews',
      type: 'collection',
      count: 145000,
      size: 78000000,
      avgObjSize: 537,
      storageSize: 82000000,
      freeStorageSize: 4000000,
      totalIndexSize: 9500000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
    {
      name: 'events',
      type: 'collection',
      count: 32000,
      size: 26000000,
      avgObjSize: 812,
      storageSize: 29000000,
      freeStorageSize: 3000000,
      totalIndexSize: 3500000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
    {
      name: 'conversions',
      type: 'collection',
      count: 5400,
      size: 6000000,
      avgObjSize: 1111,
      storageSize: 7000000,
      freeStorageSize: 1000000,
      totalIndexSize: 1000000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
  ],
  sample_mflix: [
    {
      name: 'movies',
      type: 'collection',
      count: 23530,
      size: 42000000,
      avgObjSize: 1785,
      storageSize: 45000000,
      freeStorageSize: 3000000,
      totalIndexSize: 6200000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
    {
      name: 'comments',
      type: 'collection',
      count: 18200,
      size: 19000000,
      avgObjSize: 1043,
      storageSize: 20000000,
      freeStorageSize: 1000000,
      totalIndexSize: 2800000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
    {
      name: 'users',
      type: 'collection',
      count: 4170,
      size: 7000000,
      avgObjSize: 1678,
      storageSize: 7000000,
      freeStorageSize: 0,
      totalIndexSize: 1000000,
      indexes: [{ name: '_id_', key: { _id: 1 }, unique: true, sparse: false, background: false, version: 2 }],
    },
  ],
}

interface DatabaseExplorerProps {
  onSelectCollection: (database: string, collection: string) => void
  activeConnection?: MongoDBConnection | null
}

export function DatabaseExplorer({ onSelectCollection, activeConnection }: DatabaseExplorerProps) {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchCollections = useCallback(async (dbName: string) => {
    setLoading(true)
    setError(null)
    try {
      const connId = activeConnection?.id || 'current'
      const headers: Record<string, string> = {}
      if (activeConnection?.uri) {
        headers['x-connection-uri'] = activeConnection.uri
      }
      const response = await fetch(`/api/connections/${connId}/databases/${encodeURIComponent(dbName)}/collections`, { headers })
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      } else {
        const errData = await response.json().catch(() => ({}))
        setCollections(DEMO_COLLECTIONS[dbName] || [])
        if (errData.error) setError(errData.error)
      }
    } catch (err) {
      setCollections(DEMO_COLLECTIONS[dbName] || [])
      setError(err instanceof Error ? err.message : 'Failed to fetch collections')
    } finally {
      setLoading(false)
    }
  }, [activeConnection])

  const fetchDatabases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const connId = activeConnection?.id || 'current'
      const headers: Record<string, string> = {}
      if (activeConnection?.uri) {
        headers['x-connection-uri'] = activeConnection.uri
      }
      const response = await fetch(`/api/connections/${connId}/databases`, { headers })
      if (response.ok) {
        const data = await response.json()
        const dbs: DatabaseInfo[] = data.databases || []
        if (dbs.length > 0) {
          setDatabases(dbs)
          const targetDb =
            activeConnection?.database && dbs.some((d) => d.name === activeConnection.database)
              ? activeConnection.database
              : dbs[0].name
          setSelectedDatabase(targetDb)
          await fetchCollections(targetDb)
        } else {
          setDatabases([])
          setCollections([])
        }
      } else {
        const errData = await response.json().catch(() => ({}))
        setDatabases(DEMO_DATABASES)
        setSelectedDatabase('ecommerce')
        setCollections(DEMO_COLLECTIONS['ecommerce'] || [])
        if (errData.error) setError(errData.error)
      }
    } catch {
      setDatabases(DEMO_DATABASES)
      setSelectedDatabase('ecommerce')
      setCollections(DEMO_COLLECTIONS['ecommerce'] || [])
    } finally {
      setLoading(false)
    }
  }, [activeConnection, fetchCollections])

  useEffect(() => {
    fetchDatabases()
  }, [fetchDatabases])

  const handleDatabaseSelect = async (dbName: string) => {
    setSelectedDatabase(dbName)
    await fetchCollections(dbName)
  }

  const handleCollectionClick = (collectionName: string) => {
    if (selectedDatabase) {
      onSelectCollection(selectedDatabase, collectionName)
    }
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">Database Explorer</h2>
            {activeConnection && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {activeConnection.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Browse databases, inspect collections, and view statistics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDatabases()}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchDatabases()} className="h-7 text-xs flex-shrink-0">
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        {/* Databases Panel */}
        <Card className="md:col-span-5 lg:col-span-4 h-fit border bg-card/80">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">Databases</CardTitle>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">{databases.length}</Badge>
            </div>
            <CardDescription className="text-xs">Select a database to view its collections</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-3 border-b bg-muted/20">
              <Input
                placeholder="Search databases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs h-8"
              />
            </div>
            <ScrollArea className="max-h-[450px]">
              <div className="p-2 space-y-1">
                {databases.length === 0 ? (
                  <div className="text-center py-10 px-4 text-muted-foreground">
                    <Database className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
                    <p className="text-sm font-medium text-foreground">No databases found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                      Connect to a MongoDB instance to browse databases
                    </p>
                  </div>
                ) : (
                  databases.map((db) => (
                    <Button
                      key={db.name}
                      variant={selectedDatabase === db.name ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2.5 px-3 py-2 text-left h-auto min-w-0"
                      onClick={() => handleDatabaseSelect(db.name)}
                    >
                      <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-xs truncate">{db.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {db.collections} colls · {formatBytes(db.dataSize)}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 flex-shrink-0">{formatBytes(db.sizeOnDisk)}</Badge>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Collections Panel */}
        <Card className="md:col-span-7 lg:col-span-8 border bg-card/80">
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  {selectedDatabase ? (
                    <>
                      <Database className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{selectedDatabase}</span>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Collections</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs truncate mt-0.5">
                  {selectedDatabase
                    ? `${collections.length} collections · ${collections.reduce((sum, c) => sum + c.count, 0).toLocaleString()} documents`
                    : 'Choose a database on the left to explore its collections'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                  <SelectTrigger className="w-[85px] sm:w-[95px] h-8 text-xs shrink-0">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[130px] sm:w-[160px] h-8 text-xs shrink-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-xs">Loading collections...</p>
              </div>
            ) : selectedDatabase ? (
              filteredCollections.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="text-sm font-medium text-foreground">No collections found</p>
                  <p className="text-xs text-muted-foreground mt-1">This database appears to be empty</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => {}}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Collection
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {filteredCollections.map((collection) => (
                    <CollectionCard
                      key={collection.name}
                      collection={collection}
                      onClick={() => handleCollectionClick(collection.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="p-4">Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Documents</th>
                        <th className="p-4">Size</th>
                        <th className="p-4">Indexes</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCollections.map((collection) => (
                        <tr key={collection.name} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {collection.type === 'view' ? (
                                <Layers className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Table className="h-5 w-5 text-primary" />
                              )}
                              <span className="font-medium">{collection.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{collection.type}</Badge>
                          </td>
                          <td className="p-4 font-mono">{collection.count.toLocaleString()}</td>
                          <td className="p-4 font-mono">{formatBytes(collection.size)}</td>
                          <td className="p-4">{collection.indexes.length}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="icon" onClick={() => handleCollectionClick(collection.name)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Select a database to view collections</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CollectionCard({ collection, onClick }: { collection: CollectionInfo; onClick: () => void }) {
  return (
    <Card className="h-full transition-all hover:shadow-md cursor-pointer border bg-card/90 hover:border-primary/50 group flex flex-col justify-between" onClick={onClick}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {collection.type === 'view' ? (
                <Layers className="h-4 w-4" />
              ) : (
                <Table className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors" title={collection.name}>
                {collection.name}
              </h3>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 mt-0.5">{collection.type}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40">
          <div>
            <p className="text-[11px] text-muted-foreground truncate">Documents</p>
            <p className="font-mono font-medium truncate">{collection.count.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground truncate">Size</p>
            <p className="font-mono font-medium truncate">{formatBytes(collection.size)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground truncate">Avg Doc Size</p>
            <p className="font-mono font-medium truncate">{formatBytes(collection.avgObjSize)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground truncate">Indexes</p>
            <p className="font-mono font-medium truncate">{collection.indexes.length}</p>
          </div>
        </div>
        {collection.capped && (
          <Badge variant="secondary" className="w-fit text-[10px]">Capped Collection</Badge>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 group-hover:border-primary/40" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Documents
        </Button>
      </CardFooter>
    </Card>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-y-auto scrollbar-thin', className)}>
      {children}
    </div>
  )
}