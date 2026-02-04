'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/library/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/shared/components/overlay/sheet'

export interface MoreSheetNavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface BottomNavMoreSheetProps {
  items: MoreSheetNavItem[]
  tenantSlug: string | undefined
  isMoreActive: boolean
}

export function BottomNavMoreSheet({ items, tenantSlug, isMoreActive }: BottomNavMoreSheetProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const perfilHref = tenantSlug ? `/${tenantSlug}/perfil` : '/perfil'
  const isPerfilActive = pathname === perfilHref || pathname?.startsWith(perfilHref + '/')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-11 min-h-11',
          'transition-colors duration-150 touch-manipulation',
          'active:bg-accent/80',
          isMoreActive && 'text-primary'
        )}
        aria-label="Mais opções"
      >
        <MoreHorizontal
          className={cn(
            'h-5 w-5 shrink-0',
            isMoreActive ? 'text-primary' : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'text-[11px] font-medium leading-tight',
            isMoreActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          Mais
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 py-2 overflow-y-auto" aria-label="Menu adicional">
            {items.map((item) => {
              const itemActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={itemActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg',
                    'touch-manipulation transition-colors',
                    itemActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
            <Link
              href={perfilHref}
              onClick={() => setOpen(false)}
              aria-current={isPerfilActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg',
                'touch-manipulation transition-colors',
                isPerfilActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
              )}
            >
              <User className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium">Perfil</span>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
