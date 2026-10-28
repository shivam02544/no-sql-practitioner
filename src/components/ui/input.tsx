'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, id, showPasswordToggle = true, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const isPassword = type === 'password'
    const [showPassword, setShowPassword] = React.useState(false)
    const effectiveType = isPassword && showPassword ? 'text' : type

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={effectiveType}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              isPassword && showPasswordToggle && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground transition-colors inline-flex items-center justify-center select-none disabled:pointer-events-none disabled:opacity-50"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              disabled={props.disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }