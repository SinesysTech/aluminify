'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import {
  MessageSquare,
  Calendar,
  CalendarCheck,
  User,
  LayoutDashboard,
  School,
  Users,
  Settings,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/library/utils'
import { useCurrentUser } from '@/components/providers/user-provider'
import { isAdminRoleTipo } from '@/app/shared/core/roles'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

// Itens de navegação por role - máximo 5 itens
const alunoNavItems: NavItem[] = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Estudos', href: '/sala-de-estudos', icon: School },
  { name: 'TobIAs', href: '/tobias', icon: MessageSquare },
  { name: 'Flashcards', href: '/flashcards', icon: BrainCircuit },
  { name: 'Perfil', href: '/perfil', icon: User },
]

const professorNavItems: NavItem[] = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Alunos', href: '/aluno', icon: Users },
  { name: 'Agenda', href: '/agendamentos/disponibilidade', icon: Calendar },
  { name: 'Materiais', href: '/biblioteca/materiais', icon: School },
  { name: 'Perfil', href: '/perfil', icon: User },
]

const adminNavItems: NavItem[] = [
  { name: 'Início', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Alunos', href: '/aluno', icon: Users },
  { name: 'Turmas', href: '/turma', icon: School },
  { name: 'Agenda', href: '/agendamentos', icon: CalendarCheck },
  { name: 'Config', href: '/admin/agendamentos/configuracoes', icon: Settings },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params?.tenant as string | undefined
  const user = useCurrentUser()

  // Seleciona itens de navegação baseado no role
  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'aluno':
        return alunoNavItems
      case 'usuario':
        // Admin types see admin navigation
        if (user.roleType && isAdminRoleTipo(user.roleType)) {
          return adminNavItems
        }
        return professorNavItems
      case 'superadmin':
        return adminNavItems
      default:
        return alunoNavItems
    }
  }

  const navigationItems = getNavItems()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex h-16 items-stretch justify-around">
        {navigationItems.map((item) => {
          const fullHref = tenantSlug ? `/${tenantSlug}${item.href}` : item.href
          const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={fullHref}
              className={cn(
                // Base styles - garantir touch target mínimo de 44px
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[64px] min-h-[44px]',
                // Transições e interações
                'transition-colors duration-150',
                'active:bg-accent/80 hover:bg-accent/50',
                // Estado ativo
                isActive && 'text-primary'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-xs font-medium leading-tight truncate max-w-full px-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
