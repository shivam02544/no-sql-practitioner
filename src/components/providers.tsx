'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-card border-border text-foreground',
            description: 'text-muted-foreground',
            actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
            cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
          },
        }}
      />
    </ThemeProvider>
  )
}