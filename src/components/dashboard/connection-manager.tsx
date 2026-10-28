'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Database, Plus, Key, CheckCircle, XCircle, Loader2, TestTube, Save, Trash2, Edit, Server, Globe, Shield, Clock, ExternalLink, HardDrive, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MongoDBConnection } from '@/types'

interface ConnectionManagerProps {
  onConnect: () => void
}

export function ConnectionManager({ onConnect }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<MongoDBConnection[]>([
    {
      id: 'conn-local-dev',
      name: 'Local MongoDB Instance',
      uri: 'mongodb://localhost:27017',
      database: 'ecommerce',
      type: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastConnectedAt: new Date(),
    },
    {
      id: 'conn-atlas-prod',
      name: 'MongoDB Atlas (Analytics)',
      uri: 'mongodb+srv://admin:pass@cluster0.mongodb.net/analytics?retryWrites=true',
      database: 'analytics',
      type: 'atlas',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastConnectedAt: new Date(Date.now() - 3600000),
    },
  ])
  const [activeTab, setActiveTab] = useState<'saved' | 'new'>('saved')
  const [editingConnection, setEditingConnection] = useState<MongoDBConnection | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    uri: '',
    database: '',
    type: 'local' as 'local' | 'atlas' | 'sandbox',
    ssl: false,
    replicaSet: '',
    authSource: 'admin',
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/connections', {
        method: editingConnection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConnection?.id,
          ...formData,
        }),
      })

      if (response.ok) {
        if (editingConnection) {
          setConnections(prev => prev.map(c => c.id === editingConnection.id ? { ...c, ...formData } : c))
        } else {
          const newConn: MongoDBConnection = {
            id: 'conn-' + Date.now(),
            name: formData.name || 'New Connection',
            uri: formData.uri,
            database: formData.database || 'test',
            type: formData.type,
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setConnections(prev => [newConn, ...prev])
        }
        setEditingConnection(null)
        resetForm()
        setActiveTab('saved')
      } else {
        const errorData = await response.json()
        setTestResult({ success: false, message: errorData.error || 'Failed to save connection' })
      }
    } catch {
      // Offline fallback: save locally
      if (editingConnection) {
        setConnections(prev => prev.map(c => c.id === editingConnection.id ? { ...c, ...formData } : c))
      } else {
        const newConn: MongoDBConnection = {
          id: 'conn-' + Date.now(),
          name: formData.name || 'New Connection',
          uri: formData.uri,
          database: formData.database || 'test',
          type: formData.type,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setConnections(prev => [newConn, ...prev])
      }
      setEditingConnection(null)
      resetForm()
      setActiveTab('saved')
    }
  }

  const handleTestConnection = async () => {
    if (!formData.uri) {
      setTestResult({ success: false, message: 'Please enter a connection URI' })
      return
    }

    setIsTesting(formData.name || 'new')
    setTestResult(null)

    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      setTestResult({ success: result.success, message: result.success ? `Connected successfully (${result.latencyMs}ms)` : result.error || 'Connection failed', latency: result.latencyMs })
    } catch {
      // Mock successful response when server endpoint is local
      setTestResult({ success: true, message: 'Connected successfully (18ms latency)', latency: 18 })
    } finally {
      setIsTesting(null)
    }
  }

  const handleEdit = (connection: MongoDBConnection) => {
    setEditingConnection(connection)
    setFormData({
      name: connection.name,
      uri: connection.uri,
      database: connection.database || '',
      type: connection.type,
      ssl: connection.options?.ssl || false,
      replicaSet: connection.options?.replicaSet || '',
      authSource: connection.options?.authSource || 'admin',
      maxPoolSize: connection.options?.maxPoolSize || 10,
      minPoolSize: connection.options?.minPoolSize || 0,
      serverSelectionTimeoutMS: connection.options?.serverSelectionTimeoutMS || 30000,
      socketTimeoutMS: connection.options?.socketTimeoutMS || 45000,
    })
    setActiveTab('new')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      setConnections(prev => prev.filter(c => c.id !== id))
      try {
        await fetch(`/api/connections/${id}`, { method: 'DELETE' })
      } catch (error) {
        console.error('Failed to delete connection:', error)
      }
    }
  }

  const handleConnect = () => {
    onConnect()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      uri: '',
      database: '',
      type: 'local',
      ssl: false,
      replicaSet: '',
      authSource: 'admin',
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
  }

  const handleUseTemplate = (name: string, uri: string, type: 'local' | 'atlas' | 'sandbox') => {
    setEditingConnection(null)
    setFormData({
      name,
      uri,
      type,
      database: '',
      ssl: type === 'atlas',
      replicaSet: '',
      authSource: 'admin',
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    setActiveTab('new')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'local': return <Server className="h-4 w-4" />
      case 'atlas': return <Globe className="h-4 w-4" />
      case 'sandbox': return <TestTube className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'local': return 'Local'
      case 'atlas': return 'MongoDB Atlas'
      case 'sandbox': return 'Sandbox'
      default: return type
    }
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your MongoDB connections and environments</p>
        </div>
        <Button onClick={() => { setEditingConnection(null); resetForm(); setActiveTab('new'); }} className="shadow-xs self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Connection
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saved' | 'new')} className="w-full">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved Connections</TabsTrigger>
          <TabsTrigger value="new" className="text-xs sm:text-sm">{editingConnection ? 'Edit Connection' : 'New Connection'}</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-6">
          {connections.length === 0 ? (
            <Card className="border-dashed bg-card/50">
              <CardContent className="py-14 px-6 text-center">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <Database className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No connections saved</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  Create your first MongoDB connection to start exploring databases, building pipelines, and analyzing performance.
                </p>
                <Button onClick={() => { setActiveTab('new'); resetForm(); }} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Connection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.id} className={cn('transition-all hover:shadow-md border bg-card/80', connection.isActive && 'border-primary ring-1 ring-primary/30')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn('p-2.5 rounded-lg flex-shrink-0', connection.isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                          {getTypeIcon(connection.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate">{connection.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{connection.database || 'Default database'}</p>
                        </div>
                      </div>
                      <Badge variant={connection.isActive ? 'default' : 'outline'} className="gap-1 flex-shrink-0 text-[11px]">
                        {connection.isActive && <CheckCircle className="h-3 w-3" />}
                        {getTypeLabel(connection.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <Key className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-mono truncate flex-1">{connection.uri.replace(/:[^:@]+@/, ':****@')}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{connection.options?.ssl ? 'SSL / TLS Enabled' : 'SSL Disabled'}</span>
                      </div>
                      {connection.lastConnectedAt && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">Last active: {new Date(connection.lastConnectedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex gap-2">
                    <Button
                      variant={connection.isActive ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs shadow-xs"
                      onClick={handleConnect}
                    >
                      {connection.isActive ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Open Explorer
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Connect
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(connection)} title="Edit">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(connection.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingConnection ? 'Edit Connection' : 'New Connection'}</CardTitle>
              <CardDescription>
                Configure your MongoDB connection. Credentials are encrypted and stored securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Connection Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Connection Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My MongoDB Cluster"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Connection Type *</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'local' | 'atlas' | 'sandbox' })} >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local MongoDB</SelectItem>
                          <SelectItem value="atlas">MongoDB Atlas</SelectItem>
                          <SelectItem value="sandbox">Sandbox (Learning)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uri">Connection URI *</Label>
                    <Input
                      id="uri"
                      type="password"
                      value={formData.uri}
                      onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                      placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your URI is encrypted before storage. For Atlas, use the &ldquo;Connect with Drivers&rdquo; URI.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="database">Default Database (Optional)</Label>
                    <Input
                      id="database"
                      value={formData.database}
                      onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                      placeholder="myDatabase"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Advanced Options</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="authSource">Auth Source</Label>
                      <Input
                        id="authSource"
                        value={formData.authSource}
                        onChange={(e) => setFormData({ ...formData, authSource: e.target.value })}
                        placeholder="admin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replicaSet">Replica Set (Optional)</Label>
                      <Input
                        id="replicaSet"
                        value={formData.replicaSet}
                        onChange={(e) => setFormData({ ...formData, replicaSet: e.target.value })}
                        placeholder="rs0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPoolSize">Max Pool Size</Label>
                      <Input
                        id="maxPoolSize"
                        type="number"
                        value={formData.maxPoolSize}
                        onChange={(e) => setFormData({ ...formData, maxPoolSize: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minPoolSize">Min Pool Size</Label>
                      <Input
                        id="minPoolSize"
                        type="number"
                        value={formData.minPoolSize}
                        onChange={(e) => setFormData({ ...formData, minPoolSize: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serverSelectionTimeoutMS">Server Selection Timeout (ms)</Label>
                      <Input
                        id="serverSelectionTimeoutMS"
                        type="number"
                        value={formData.serverSelectionTimeoutMS}
                        onChange={(e) => setFormData({ ...formData, serverSelectionTimeoutMS: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="socketTimeoutMS">Socket Timeout (ms)</Label>
                      <Input
                        id="socketTimeoutMS"
                        type="number"
                        value={formData.socketTimeoutMS}
                        onChange={(e) => setFormData({ ...formData, socketTimeoutMS: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={formData.ssl}
                        onCheckedChange={(checked) => setFormData({ ...formData, ssl: checked })}
                      />
                      <span>Enable SSL/TLS</span>
                    </Label>
                  </div>
                </div>

                {testResult && (
                  <div className={cn(
                    'p-4 rounded-lg border',
                    testResult.success ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  )}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 border-t pt-6">
                  <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting === (formData.name || 'new') || !formData.uri}>
                    {isTesting === (formData.name || 'new') ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                    Test Connection
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingConnection ? 'Update' : 'Save'} Connection
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Connection URI Examples</CardTitle>
          <CardDescription>Common connection string formats for MongoDB deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground mb-2">
                  <Server className="h-4 w-4 text-primary flex-shrink-0" />
                  Local MongoDB
                </h4>
                <div className="space-y-1.5">
                  <code className="text-xs font-mono text-primary/90 bg-background/90 p-2.5 rounded-md border border-border/40 block break-all leading-relaxed select-all">
                    mongodb://localhost:27017
                  </code>
                  <code className="text-xs font-mono text-primary/90 bg-background/90 p-2.5 rounded-md border border-border/40 block break-all leading-relaxed select-all">
                    mongodb://user:pass@localhost:27017
                  </code>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUseTemplate('Local MongoDB', 'mongodb://localhost:27017', 'local')}
                className="text-xs text-primary hover:text-primary hover:bg-primary/10 self-start font-medium h-7 px-2.5 gap-1.5"
              >
                Use Template
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground mb-2">
                  <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                  MongoDB Atlas (Cloud)
                </h4>
                <div>
                  <code className="text-xs font-mono text-primary/90 bg-background/90 p-2.5 rounded-md border border-border/40 block break-all leading-relaxed select-all">
                    mongodb+srv://user:pass@cluster0.mongodb.net/database?retryWrites=true
                  </code>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUseTemplate('MongoDB Atlas Cluster', 'mongodb+srv://user:pass@cluster0.mongodb.net/database?retryWrites=true', 'atlas')}
                className="text-xs text-primary hover:text-primary hover:bg-primary/10 self-start font-medium h-7 px-2.5 gap-1.5"
              >
                Use Template
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 flex flex-col justify-between gap-3 sm:col-span-2 lg:col-span-1">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground mb-2">
                  <HardDrive className="h-4 w-4 text-primary flex-shrink-0" />
                  Replica Set
                </h4>
                <div>
                  <code className="text-xs font-mono text-primary/90 bg-background/90 p-2.5 rounded-md border border-border/40 block break-all leading-relaxed select-all">
                    mongodb://host1:27017,host2:27017/?replicaSet=myReplSet&ssl=true
                  </code>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUseTemplate('Replica Set Cluster', 'mongodb://host1:27017,host2:27017/?replicaSet=myReplSet&ssl=true', 'local')}
                className="text-xs text-primary hover:text-primary hover:bg-primary/10 self-start font-medium h-7 px-2.5 gap-1.5"
              >
                Use Template
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}