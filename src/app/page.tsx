'use client'

import { Dashboard } from '@/components/dashboard/dashboard'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Set theme to dark by default
    if (theme === 'system') {
      setTheme('dark')
    }
  }, [theme, setTheme])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <Dashboard />
}