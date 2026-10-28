'use client'

import { useState, useEffect } from 'react'
import { MongoDBConnection } from '@/types'
import { Sidebar, SidebarHeader, SidebarFooter, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleIcon } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import {
  Database,
  FolderOpen,
  FileText,
  Terminal,
  GitBranch,
  Layers,
  Table,
  Activity,
  Zap,
  Play,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  Settings,
  HelpCircle,
  Key,
  PanelLeft,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

function LogOut({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ConnectionManager } from './connection-manager'
import { DatabaseExplorer } from './database-explorer'
import { DocumentViewer } from './document-viewer'
import { QueryEditor } from './query-editor'
import { AggregationBuilder } from './aggregation-builder'
import { IndexManager } from './index-manager'
import { SchemaDesigner } from './schema-designer'
import { PerformanceDashboard } from './performance-dashboard'
import { DataEngineeringWorkbench } from './data-engineering-workbench'
import { CommandViewer } from './command-viewer'
import { SandboxMode } from './sandbox-mode'
import { TutorialPanel } from './tutorial-panel'
import { PreferencesDialog, loadPreferences, AppPreferences } from './preferences-dialog'
import { DocumentationDialog } from './documentation-dialog'
import { SignOutDialog } from './sign-out-dialog'

type ViewMode =
  | 'connections'
  | 'explorer'
  | 'documents'
  | 'query'
  | 'aggregation'
  | 'indexes'
  | 'schema'
  | 'performance'
  | 'data-engineering'
  | 'sandbox'
  | 'tutorials'

interface NavItem {
  id: ViewMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { id: 'connections', label: 'Connections', icon: Database },
  { id: 'explorer', label: 'Database Explorer', icon: FolderOpen, children: [
    { id: 'explorer', label: 'Overview', icon: FolderOpen },
    { id: 'documents', label: 'Documents', icon: FileText },
  ]},
  { id: 'query', label: 'Query Editor', icon: Terminal },
  { id: 'aggregation', label: 'Aggregation Builder', icon: GitBranch },
  { id: 'indexes', label: 'Index Manager', icon: Layers },
  { id: 'schema', label: 'Schema Designer', icon: Table },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'data-engineering', label: 'Data Engineering', icon: Zap },
  { id: 'sandbox', label: 'Sandbox Mode', icon: Play },
  { id: 'tutorials', label: 'Tutorials', icon: BookOpen },
]

export function Dashboard() {
  const [activeView, setActiveView] = useState<ViewMode>('connections')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [activeConnection, setActiveConnection] = useState<MongoDBConnection | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/connections/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.connection) {
          setActiveConnection(data.connection)
          if (data.connection.database) {
            setSelectedDatabase(data.connection.database)
          }
        }
      })
      .catch(() => {})
  }, [])

  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [documentationOpen, setDocumentationOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [isSignedOut, setIsSignedOut] = useState(false)
  const [userProfile, setUserProfile] = useState(() => {
    const p = loadPreferences()
    return { name: p.userName || 'Developer User', email: p.userEmail || 'dev@mongodb.local' }
  })

  const handleSavePreferences = (newPrefs: AppPreferences) => {
    setUserProfile({ name: newPrefs.userName, email: newPrefs.userEmail })
    if (newPrefs.theme && (newPrefs.theme === 'light' || newPrefs.theme === 'dark' || newPrefs.theme === 'system')) {
      if (newPrefs.theme !== theme) setTheme(newPrefs.theme)
    }
  }

  const handleConfirmSignOut = (clearStorage: boolean) => {
    if (clearStorage && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mongodb_saved_queries')
        localStorage.removeItem('mongodb_command_history')
      } catch {}
    }
    setIsSignedOut(true)
  }

  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed)
  const handleNavSelect = (id: ViewMode) => {
    setActiveView(id)
    setMobileOpen(false)
  }

  if (isSignedOut) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
        <Card className="w-full max-w-md border-border/70 shadow-2xl bg-card/90 backdrop-blur-md relative z-10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary/80" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-sm">
              <Database className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">MongoDB Platform</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              You are signed out. Reconnect to resume your developer workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 ring-1 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {userProfile.name[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{userProfile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground flex-shrink-0">Signed Out</Badge>
            </div>
            <Button
              className="w-full font-semibold shadow-xs gap-2 h-10"
              onClick={() => setIsSignedOut(false)}
            >
              <Key className="h-4 w-4" />
              Sign Back In as {userProfile.name}
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t border-border/40 py-3 text-center justify-center">
            <p className="text-[11px] text-muted-foreground">
              Local environment · Encrypted session keys
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const ViewComponent = () => {
    switch (activeView) {
      case 'connections':
        return (
          <ConnectionManager
            activeConnectionId={activeConnection?.id}
            onConnect={(conn) => {
              if (conn) {
                setActiveConnection(conn)
                if (conn.database) setSelectedDatabase(conn.database)
              }
              setActiveView('explorer')
            }}
          />
        )
      case 'explorer':
        return (
          <DatabaseExplorer
            activeConnection={activeConnection}
            onSelectCollection={(db, coll) => {
              setSelectedDatabase(db)
              setSelectedCollection(coll)
              setActiveView('documents')
            }}
          />
        )
      case 'documents':
        return (
          <DocumentViewer
            activeConnection={activeConnection}
            database={selectedDatabase}
            collection={selectedCollection}
            onBack={() => setActiveView('explorer')}
          />
        )
      case 'query':
        return <QueryEditor onBack={() => setActiveView('explorer')} />
      case 'aggregation':
        return <AggregationBuilder onBack={() => setActiveView('explorer')} />
      case 'indexes':
        return <IndexManager onBack={() => setActiveView('explorer')} />
      case 'schema':
        return <SchemaDesigner onBack={() => setActiveView('explorer')} />
      case 'performance':
        return <PerformanceDashboard onBack={() => setActiveView('explorer')} />
      case 'data-engineering':
        return <DataEngineeringWorkbench onBack={() => setActiveView('explorer')} />
      case 'sandbox':
        return <SandboxMode onBack={() => setActiveView('connections')} />
      case 'tutorials':
        return <TutorialPanel onBack={() => setActiveView('connections')} />
      default:
        return <ConnectionManager onConnect={() => setActiveView('explorer')} />
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar className={cn(
        'transition-all duration-300 ease-in-out flex-shrink-0 z-50 flex flex-col',
        // Mobile (< lg): fixed drawer that slides in/out
        'fixed inset-y-0 left-0 w-72 shadow-2xl bg-card border-r',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop (>= lg): static in-flow column, ALWAYS visible!
        'lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        {/* Sidebar Header */}
        <SidebarHeader className={cn(
          'px-4 h-14 sm:h-16 flex items-center justify-between border-b',
          sidebarCollapsed && 'lg:justify-center lg:px-2'
        )}>
          {(!sidebarCollapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-primary/15 rounded-lg text-primary shrink-0 shadow-xs">
                <Database className="h-5 w-5" />
              </div>
              <span className="font-bold text-base tracking-tight truncate">MongoDB Learn</span>
            </div>
          )}
          {sidebarCollapsed && !mobileOpen && (
            <div className="p-1.5 bg-primary/15 rounded-lg text-primary mx-auto shadow-xs">
              <Database className="h-5 w-5" />
            </div>
          )}

          {/* Close button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden shrink-0"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Collapse/Expand button on desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex shrink-0"
            onClick={toggleSidebarCollapse}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <nav className="flex-1 space-y-1.5" aria-label="Main navigation">
            {navItems.map((item) => (
              <SidebarGroup key={item.id}>
                {item.children ? (
                  <Collapsible className="w-full" defaultOpen={true}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          'w-full justify-between',
                          (activeView === item.id || item.children.some(c => c.id === activeView)) && 'bg-primary/10 text-primary font-semibold',
                          sidebarCollapsed && !mobileOpen && 'justify-center px-0'
                        )}
                        onClick={() => handleNavSelect(item.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {(!sidebarCollapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                        </div>
                        {(!sidebarCollapsed || mobileOpen) && (
                          <CollapsibleIcon className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuItem key={child.id}>
                            <SidebarMenuButton
                              className={cn(
                                'pl-3',
                                activeView === child.id && 'bg-primary/15 text-primary font-semibold',
                                sidebarCollapsed && !mobileOpen && 'justify-center pl-0'
                              )}
                              onClick={() => handleNavSelect(child.id)}
                            >
                              <child.icon className="h-3.5 w-3.5 shrink-0" />
                              {(!sidebarCollapsed || mobileOpen) && <span className="truncate flex-1">{child.label}</span>}
                              {child.badge && (!sidebarCollapsed || mobileOpen) && (
                                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">
                                  {child.badge}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={cn(
                          'w-full',
                          activeView === item.id && 'bg-primary/10 text-primary font-semibold',
                          sidebarCollapsed && !mobileOpen && 'justify-center px-0'
                        )}
                        onClick={() => handleNavSelect(item.id)}
                        title={sidebarCollapsed && !mobileOpen ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {(!sidebarCollapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                        </div>
                        {item.badge && (!sidebarCollapsed || mobileOpen) && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
              </SidebarGroup>
            ))}
          </nav>

          {(!sidebarCollapsed || mobileOpen) && (
            <div className="border-t border-border/40 pt-4 mt-2">
              <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    variant="outline"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleNavSelect('sandbox')}
                  >
                    <Play className="h-3.5 w-3.5 text-primary" />
                    <span>Launch Sandbox</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    variant="outline"
                    className="w-full justify-start text-xs font-medium"
                    onClick={() => handleNavSelect('tutorials')}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Guided Tutorials</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          )}
        </SidebarContent>

        {(!sidebarCollapsed || mobileOpen) && (
          <SidebarFooter className="border-t border-border/40 p-3">
            <button
              onClick={() => setPreferencesOpen(true)}
              className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
              title="Open Preferences"
            >
              <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {userProfile.name[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-none group-hover:text-primary transition-colors">
                  {userProfile.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-1">{userProfile.email}</p>
              </div>
              <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground opacity-60 shrink-0" />
            </button>
          </SidebarFooter>
        )}
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md px-3 sm:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Sidebar Toggle Button - Always visible on all devices! */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileOpen(!mobileOpen)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              }}
              aria-label="Toggle navigation menu"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            {/* View Breadcrumb / Title */}
            <div className="flex items-center gap-2 min-w-0">
              {(() => {
                const currentItem = navItems.find(item => item.id === activeView) ||
                  navItems.flatMap(i => i.children || []).find(c => c.id === activeView)
                const Icon = currentItem?.icon || Database
                return (
                  <>
                    <div className="p-1 rounded bg-muted/60 hidden sm:flex text-primary shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
                      {currentItem?.label || 'Dashboard'}
                    </h1>
                  </>
                )
              })()}
            </div>

            {/* Active Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium ml-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick action button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex h-8 text-xs gap-1.5 border-border/70"
              onClick={() => handleNavSelect('sandbox')}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Sandbox</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 ring-1 ring-border" aria-label="User Profile Menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {userProfile.name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none">{userProfile.name}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">{userProfile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavSelect('connections')} className="cursor-pointer">
                  <Database className="mr-2 h-3.5 w-3.5 text-primary" />
                  Connections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavSelect('sandbox')} className="cursor-pointer">
                  <Play className="mr-2 h-3.5 w-3.5 text-primary" />
                  Sandbox Environment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavSelect('tutorials')} className="cursor-pointer">
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  Tutorials & Lessons
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPreferencesOpen(true)} className="cursor-pointer">
                  <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDocumentationOpen(true)} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSignOutOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 min-w-0 bg-background/50">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            <ViewComponent />
          </div>
        </main>

        {/* Command Palette Footer */}
        <footer className="border-t border-border/40 bg-card/60 backdrop-blur px-4 py-2 text-xs text-muted-foreground flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] border shadow-xs">⌘K</kbd>
            <span className="text-[11px]">Command Palette</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px]">Quick Search</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] border shadow-xs">⌘/</kbd>
          </div>
        </footer>
      </div>

      {/* Command Viewer Panel (Right Sidebar) */}
      <CommandViewer defaultCollapsed={true} />

      {/* Global Interactive Dialogs */}
      <PreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
        onSave={handleSavePreferences}
      />
      <DocumentationDialog
        open={documentationOpen}
        onOpenChange={setDocumentationOpen}
      />
      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        userName={userProfile.name}
        userEmail={userProfile.email}
        onConfirmSignOut={handleConfirmSignOut}
      />
    </div>
  )
}
