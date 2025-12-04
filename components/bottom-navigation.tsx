'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Calendar, CalendarCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'TobIAs',
    href: '/tobias',
    icon: MessageSquare,
  },
  {
    name: 'Calendário',
    href: '/aluno/cronograma/calendario',
    icon: Calendar,
  },
  {
    name: 'Cronograma',
    href: '/aluno/cronograma',
    icon: CalendarCheck,
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: User,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-around">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2',
                'transition-colors hover:bg-accent active:bg-accent/80',
                isActive && 'text-primary'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className={cn(
                'text-xs font-medium truncate w-full text-center',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}




