'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  employeeType,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  employeeType?: string
}) {
  const getBackgroundColor = (type?: string) => {
    if (!type) return 'bg-[#dbeafe] text-blue-700' // デフォルト（正社員と同じ）
    
    switch (type) {
      case '正社員':
        return 'bg-[#dbeafe] text-blue-700'
      case '契約社員':
      case '派遣社員':
        return 'bg-[#f5d5d5] text-red-700'
      case '業務委託':
      case '外注先':
        return 'bg-[#d1f2d1] text-green-700'
      case 'パートタイム':
        return 'bg-[#fff5cc] text-yellow-700'
      default:
        return 'bg-[#dbeafe] text-blue-700' // デフォルト
    }
  }

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full',
        getBackgroundColor(employeeType),
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
