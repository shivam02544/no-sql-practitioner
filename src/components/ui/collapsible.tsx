'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Collapsible = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.Trigger
const CollapsibleContent = CollapsiblePrimitive.Content

const CollapsibleIcon = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'transition-transform duration-200',
      'data-[state=open]:rotate-90',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </span>
)

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleIcon }