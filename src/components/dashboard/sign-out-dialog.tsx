'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut } from 'lucide-react'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string
  userEmail?: string
  onConfirmSignOut: (clearStorage: boolean) => void
}

export function SignOutDialog({
  open,
  onOpenChange,
  userName = 'Developer User',
  userEmail = 'dev@mongodb.local',
  onConfirmSignOut,
}: SignOutDialogProps) {
  const [clearHistory, setClearHistory] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    onConfirmSignOut(clearHistory)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-2xl border-border/80 shadow-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-card/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive flex-shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Sign Out of Session?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                You will be signed out of this local development session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* User info card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 ring-1 ring-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {userName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{userName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5">
              Active Session
            </Badge>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="clear-history"
                checked={clearHistory}
                onCheckedChange={(c) => setClearHistory(Boolean(c))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="clear-history"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  Clear local query history & cache
                </label>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Removes saved scratchpads and recent query executions from browser storage
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-border/50 bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            disabled={loading}
            className="text-xs gap-1.5 shadow-xs font-semibold"
          >
            {loading ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
