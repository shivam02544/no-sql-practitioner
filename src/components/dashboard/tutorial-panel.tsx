'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Lock, Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TutorialPanelProps {
  onBack: () => void
}

const TUTORIALS = {
  beginner: [
    { id: 'getting-started', title: 'Getting Started with MongoDB', duration: '15 min', lessons: 5, completed: true, description: 'Learn what MongoDB is and how to set up your first database' },
    { id: 'crud-basics', title: 'CRUD Operations Basics', duration: '20 min', lessons: 6, completed: true, description: 'Master Create, Read, Update, and Delete operations' },
    { id: 'querying', title: 'Querying Documents', duration: '25 min', lessons: 7, completed: false, description: 'Filter, sort, project, and paginate query results' },
    { id: 'data-types', title: 'BSON Data Types', duration: '15 min', lessons: 4, completed: false, description: 'Understand MongoDB\'s rich data type system' },
  ],
  intermediate: [
    { id: 'aggregation', title: 'Aggregation Pipeline', duration: '30 min', lessons: 8, completed: false, description: 'Build powerful data processing pipelines' },
    { id: 'indexes', title: 'Indexes and Performance', duration: '25 min', lessons: 6, completed: false, description: 'Optimize queries with proper indexing strategies' },
    { id: 'data-modeling', title: 'Data Modeling Patterns', duration: '30 min', lessons: 7, completed: false, description: 'Design schemas for different access patterns' },
    { id: 'transactions', title: 'Multi-Document Transactions', duration: '20 min', lessons: 5, completed: false, description: 'ACID transactions across multiple documents' },
  ],
  advanced: [
    { id: 'sharding', title: 'Sharding and Scaling', duration: '35 min', lessons: 8, completed: false, description: 'Horizontal scaling with MongoDB sharding' },
    { id: 'replication', title: 'Replica Sets', duration: '25 min', lessons: 6, completed: false, description: 'High availability with replica sets' },
    { id: 'change-streams', title: 'Change Streams', duration: '20 min', lessons: 4, completed: false, description: 'Real-time data change notifications' },
    { id: 'atlas', title: 'MongoDB Atlas', duration: '30 min', lessons: 7, completed: false, description: 'Managed MongoDB in the cloud' },
  ],
}

const CATEGORIES = [
  { id: 'beginner', label: 'Beginner', icon: BookOpen, count: 4 },
  { id: 'intermediate', label: 'Intermediate', icon: Star, count: 4 },
  { id: 'advanced', label: 'Advanced', icon: Lock, count: 4 },
]

export function TutorialPanel({ onBack }: TutorialPanelProps) {
  const [activeCategory, setActiveCategory] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)

  const tutorials = TUTORIALS[activeCategory]
  const expandedTutorialData = expandedTutorial ? tutorials.find(t => t.id === expandedTutorial) : null

  const getProgress = (tutorial: typeof tutorials[0]) => {
    if (tutorial.completed) return 100
    return 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Interactive Tutorials</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Master MongoDB concepts with guided, interactive step-by-step lessons</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-thin border-b border-border/40">
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 shrink-0 text-xs sm:text-sm h-9"
            onClick={() => {
              setActiveCategory(cat.id as typeof activeCategory)
              setExpandedTutorial(null)
            }}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{cat.count}</Badge>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Tutorial List */}
        <div className="xl:col-span-5 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Learning Path</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} curriculum modules</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {tutorials.map(tutorial => {
                const progress = getProgress(tutorial)
                const isCompleted = tutorial.completed
                const isLocked = !isCompleted && tutorials.findIndex(t => t.id === tutorial.id) > 0 && !tutorials[tutorials.findIndex(t => t.id === tutorial.id) - 1].completed

                return (
                  <div
                    key={tutorial.id}
                    className={cn(
                      'p-3.5 border border-border/60 rounded-xl cursor-pointer transition-all space-y-3',
                      expandedTutorial === tutorial.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/40 hover:border-border',
                      isLocked && 'opacity-60 cursor-not-allowed'
                    )}
                    onClick={() => isLocked ? null : setExpandedTutorial(expandedTutorial === tutorial.id ? null : tutorial.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs',
                        isCompleted ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm leading-snug truncate" title={tutorial.title}>{tutorial.title}</h4>
                          {isCompleted && <Badge variant="success" className="text-[10px] shrink-0 px-1.5 py-0">Completed</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{tutorial.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tutorial.duration}</span>
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{tutorial.lessons} lessons</span>
                        </div>
                        <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full transition-all rounded-full', isCompleted ? 'bg-emerald-500' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {expandedTutorial === tutorial.id && !isLocked && (
                      <div className="pt-3 border-t border-border/50 space-y-2.5">
                        <div className="space-y-1">
                          {Array.from({ length: tutorial.lessons }, (_, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs py-1 px-1.5 rounded hover:bg-muted/40 transition-colors">
                              <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                                i < (isCompleted ? tutorial.lessons : 0) ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                              )}>
                                {i < (isCompleted ? tutorial.lessons : 0) ? <CheckCircle className="h-3 w-3" /> : i + 1}
                              </span>
                              <span className={cn('truncate', i < (isCompleted ? tutorial.lessons : 0) ? 'text-emerald-600 font-medium' : 'text-muted-foreground')}>
                                Lesson {i + 1}: {tutorial.title} Part {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full h-8 text-xs gap-1.5" variant={isCompleted ? 'outline' : 'default'} size="sm">
                          {isCompleted ? 'Review Tutorial' : 'Start Lesson 1'} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      className="text-muted/40"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      className="text-primary transition-all duration-1000"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="301"
                      strokeDashoffset={301 * (1 - 0.33)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold tracking-tight">33%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Overall Curriculum Completion</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Completed Tutorials</span>
                  <span className="font-semibold text-foreground">4 / 12</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Hours Learned</span>
                  <span className="font-semibold text-foreground">2.5 hrs</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-semibold text-emerald-500">3 days 🔥</span>
                </div>
              </div>
              <Button variant="outline" className="w-full h-8 text-xs gap-1.5">
                <Star className="h-3.5 w-3.5" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tutorial Detail */}
        <div className="xl:col-span-7">
          {expandedTutorialData ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{activeCategory}</Badge>
                  {expandedTutorialData.completed && <Badge variant="success" className="text-[10px]">Completed</Badge>}
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">{expandedTutorialData.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">{expandedTutorialData.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 text-xs">
                  <div className="p-3 bg-muted/40 border border-border/50 rounded-lg">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />{expandedTutorialData.duration}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border/50 rounded-lg">
                    <p className="text-muted-foreground">Lessons</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />{expandedTutorialData.lessons} modules
                    </p>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border/50 rounded-lg">
                    <p className="text-muted-foreground">Difficulty</p>
                    <p className="font-semibold text-foreground capitalize mt-1">{activeCategory}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">What you&apos;ll learn</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Understanding core MongoDB architectures and primitives</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Hands-on practice writing idiomatic, expressive queries</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Best practices for robust schema design and indexing</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Performance profiling with real execution metrics</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Prerequisites</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">Basic JavaScript</Badge>
                    <Badge variant="outline" className="text-xs">JSON Syntax</Badge>
                    <Badge variant="outline" className="text-xs">Command Line Basics</Badge>
                  </div>
                </div>

                <Button className="w-full h-10 text-xs sm:text-sm font-medium gap-2">
                  <Play className="h-4 w-4" />
                  {expandedTutorialData.completed ? 'Review Tutorial' : 'Start Interactive Tutorial'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-8 sm:p-14 text-center">
                <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1">Select a Tutorial</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Choose a module from the learning path on the left to review its curriculum, duration, and lessons.
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <Button variant="default" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setExpandedTutorial(tutorials[0].id)}>
                    <Play className="h-3.5 w-3.5" /> Start First Tutorial
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setActiveCategory('beginner')}>
                    <BookOpen className="h-3.5 w-3.5" /> Beginner Path
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}