'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, Sliders, Code2, Database, RotateCcw, Check, Sun, Moon, Laptop, ShieldAlert } from 'lucide-react'

export interface AppPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  // Editor
  fontSize: number
  tabSize: number
  lineNumbers: boolean
  wordWrap: boolean
  minimap: boolean
  // Database & Queries
  defaultLimit: number
  queryTimeoutMS: number
  safeMode: boolean
  autoRefreshMetrics: string
  // User Profile
  userName: string
  userEmail: string
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  compactMode: false,
  fontSize: 14,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: true,
  minimap: false,
  defaultLimit: 20,
  queryTimeoutMS: 30000,
  safeMode: true,
  autoRefreshMetrics: '30s',
  userName: 'Developer User',
  userEmail: 'dev@mongodb.local',
}

const STORAGE_KEY = 'mongodb_app_preferences'

export function loadPreferences(): AppPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Failed to load preferences:', e)
  }
  return DEFAULT_PREFERENCES
}

export function savePreferences(prefs: AppPreferences) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.error('Failed to save preferences:', e)
  }
}

interface PreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (prefs: AppPreferences) => void
}

export function PreferencesDialog({ open, onOpenChange, onSave }: PreferencesDialogProps) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setPrefs(loadPreferences())
      setSavedSuccess(false)
    }
  }, [open])

  const handleSave = () => {
    savePreferences(prefs)
    setSavedSuccess(true)
    onSave?.(prefs)
    setTimeout(() => {
      setSavedSuccess(false)
      onOpenChange(false)
    }, 600)
  }

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES)
    savePreferences(DEFAULT_PREFERENCES)
    onSave?.(DEFAULT_PREFERENCES)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl border-border/80 shadow-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-card/60 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Preferences</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Customize your development environment, editor, and database execution rules
                </DialogDescription>
              </div>
            </div>
            {savedSuccess && (
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1 text-xs">
                <Check className="h-3 w-3" /> Saved
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid grid-cols-3 bg-muted/60 p-1 mb-5">
              <TabsTrigger value="editor" className="text-xs gap-1.5 py-1.5">
                <Code2 className="h-3.5 w-3.5" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="database" className="text-xs gap-1.5 py-1.5">
                <Database className="h-3.5 w-3.5" />
                Database & Safety
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs gap-1.5 py-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Appearance & Profile
              </TabsTrigger>
            </TabsList>

            {/* Editor Preferences */}
            <TabsContent value="editor" className="space-y-4 m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3.5 rounded-xl border border-border/50 bg-card/40">
                  <Label className="text-xs font-semibold">Font Size</Label>
                  <Select
                    value={prefs.fontSize.toString()}
                    onValueChange={(val) => setPrefs({ ...prefs, fontSize: parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12px (Compact)</SelectItem>
                      <SelectItem value="14">14px (Recommended)</SelectItem>
                      <SelectItem value="16">16px (Medium)</SelectItem>
                      <SelectItem value="18">18px (Large)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Adjust Monaco code editor font sizing</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl border border-border/50 bg-card/40">
                  <Label className="text-xs font-semibold">Tab Spacing</Label>
                  <Select
                    value={prefs.tabSize.toString()}
                    onValueChange={(val) => setPrefs({ ...prefs, tabSize: parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 spaces (Standard JSON)</SelectItem>
                      <SelectItem value="4">4 spaces (Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Indentation width for formatted queries</p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="line-numbers">
                      Line Numbers
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Show line numbering gutter in editors</p>
                  </div>
                  <Switch
                    id="line-numbers"
                    checked={prefs.lineNumbers}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, lineNumbers: checked })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="word-wrap">
                      Word Wrapping
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Wrap long query expressions to next line</p>
                  </div>
                  <Switch
                    id="word-wrap"
                    checked={prefs.wordWrap}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, wordWrap: checked })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="minimap">
                      Minimap Preview
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Show small document overview minimap</p>
                  </div>
                  <Switch
                    id="minimap"
                    checked={prefs.minimap}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, minimap: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Database & Safety */}
            <TabsContent value="database" className="space-y-4 m-0">
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-foreground">Safe Mode Protection</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="safe-mode">
                      Warn Before Destructive Operations
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Prompts confirmation dialog before drop, updateMany, and deleteMany queries
                    </p>
                  </div>
                  <Switch
                    id="safe-mode"
                    checked={prefs.safeMode}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, safeMode: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3.5 rounded-xl border border-border/50 bg-card/40">
                  <Label className="text-xs font-semibold">Default Document Limit</Label>
                  <Select
                    value={prefs.defaultLimit.toString()}
                    onValueChange={(val) => setPrefs({ ...prefs, defaultLimit: parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 documents</SelectItem>
                      <SelectItem value="20">20 documents (Default)</SelectItem>
                      <SelectItem value="50">50 documents</SelectItem>
                      <SelectItem value="100">100 documents</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Default batch limit for collection queries</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl border border-border/50 bg-card/40">
                  <Label className="text-xs font-semibold">Server Timeout</Label>
                  <Select
                    value={prefs.queryTimeoutMS.toString()}
                    onValueChange={(val) => setPrefs({ ...prefs, queryTimeoutMS: parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds (Default)</SelectItem>
                      <SelectItem value="60000">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Abort query if execution exceeds duration</p>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-border/50 bg-card/40">
                <Label className="text-xs font-semibold">Metrics Auto-Refresh</Label>
                <Select
                  value={prefs.autoRefreshMetrics}
                  onValueChange={(val) => setPrefs({ ...prefs, autoRefreshMetrics: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off (Manual refresh)</SelectItem>
                    <SelectItem value="10s">Every 10 seconds</SelectItem>
                    <SelectItem value="30s">Every 30 seconds</SelectItem>
                    <SelectItem value="60s">Every 60 seconds</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Refresh interval for server opcounters and memory</p>
              </div>
            </TabsContent>

            {/* Appearance & Profile */}
            <TabsContent value="appearance" className="space-y-4 m-0">
              <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40">
                <Label className="text-xs font-semibold">Theme Mode</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={prefs.theme === 'dark' ? 'default' : 'outline'}
                    className="h-14 flex flex-col gap-1 text-xs"
                    onClick={() => setPrefs({ ...prefs, theme: 'dark' })}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    type="button"
                    variant={prefs.theme === 'light' ? 'default' : 'outline'}
                    className="h-14 flex flex-col gap-1 text-xs"
                    onClick={() => setPrefs({ ...prefs, theme: 'light' })}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    type="button"
                    variant={prefs.theme === 'system' ? 'default' : 'outline'}
                    className="h-14 flex flex-col gap-1 text-xs"
                    onClick={() => setPrefs({ ...prefs, theme: 'system' })}
                  >
                    <Laptop className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40">
                <h4 className="text-xs font-semibold text-foreground">User Profile Details</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Display Name</Label>
                    <input
                      type="text"
                      value={prefs.userName}
                      onChange={(e) => setPrefs({ ...prefs, userName: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Developer Email</Label>
                    <input
                      type="email"
                      value={prefs.userEmail}
                      onChange={(e) => setPrefs({ ...prefs, userEmail: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-border/50 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs font-semibold shadow-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
