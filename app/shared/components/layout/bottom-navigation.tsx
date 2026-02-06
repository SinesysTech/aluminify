'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import {
  Calendar,
  CalendarCheck,
  User,
  LayoutDashboard,
  School,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/library/utils'
import { useCurrentUser } from '@/components/providers/user-provider'
import { useModuleVisibility } from '@/app/shared/hooks/use-module-visibility'
import { getIconComponent } from '@/components/layout/navigation-icons'
import { Skeleton } from '@/app/shared/components/feedback/skeleton'
import { BottomNavMoreSheet, type MoreSheetNavItem } from '@/components/layout/bottom-nav-more-sheet'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

// ---------------------------------------------------------------------------
// Itens hardcoded para professor e admin (espelham suas sidebars desktop)
// ---------------------------------------------------------------------------

const professorNavItems: NavItem[] = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Alunos', href: '/usuario/alunos', icon: Users },
  { name: 'Agenda', href: '/agendamentos/disponibilidade', icon: Calendar },
  { name: 'Materiais', href: '/biblioteca/materiais', icon: School },
  { name: 'Perfil', href: '/perfil', icon: User },
]

const adminNavItems: NavItem[] = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Alunos', href: '/usuario/alunos', icon: Users },
  { name: 'Cursos', href: '/curso/admin', icon: School },
  { name: 'Agenda', href: '/agendamentos', icon: CalendarCheck },
  { name: 'Config', href: '/settings', icon: Settings },
]

// ---------------------------------------------------------------------------
// Fallback para aluno quando não existe config de módulos
// (espelha DEFAULT_NAV_ITEMS da sidebar, adaptado para 4 itens + Perfil)
// ---------------------------------------------------------------------------

interface DefaultMobileModule {
  id: string
  name: string
  url: string
  iconName: string
  displayOrder: number
}

const DEFAULT_ALUNO_MOBILE_MODULES: DefaultMobileModule[] = [
  { id: 'dashboard', name: 'Início', url: '/dashboard', iconName: 'LayoutDashboard', displayOrder: 0 },
  { id: 'sala-de-estudos', name: 'Estudos', url: '/sala-de-estudos', iconName: 'BookOpen', displayOrder: 1 },
  { id: 'cronograma', name: 'Cronograma', url: '/cronograma', iconName: 'CalendarCheck', displayOrder: 2 },
  { id: 'flashcards', name: 'Flashcards', url: '/flashcards', iconName: 'Layers', displayOrder: 3 },
]

// ---------------------------------------------------------------------------
// Skeleton para loading state
// ---------------------------------------------------------------------------

function BottomNavSkeleton() {
  return (
    <div className="flex h-16 items-stretch justify-around">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center justify-center gap-1 flex-1">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-2.5 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function BottomNavigation() {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params?.tenant as string | undefined
  const user = useCurrentUser()
  const { modules, loading } = useModuleVisibility()

  // -----------------------------------------------------------------------
  // Navegação estática para professor e admin
  // -----------------------------------------------------------------------

  const staticNavItems = useMemo((): NavItem[] | null => {
    if (user.role === 'aluno') return null
    if (user.role === 'usuario') {
      if (user.isAdmin) {
        return adminNavItems
      }
      return professorNavItems
    }
    // Default fallback — tratado na seção dinâmica
    return null
  }, [user.role, user.isAdmin])

  // -----------------------------------------------------------------------
  // Navegação dinâmica para aluno (mesma lógica de aluno-sidebar.tsx)
  // -----------------------------------------------------------------------

  const dynamicResult = useMemo(() => {
    // Não é aluno, ignora
    if (staticNavItems !== null) {
      return { primaryItems: null, overflowItems: [] as MoreSheetNavItem[], showMore: false, isLoading: false }
    }

    // Loading — exibir skeleton
    if (loading) {
      return { primaryItems: null, overflowItems: [] as MoreSheetNavItem[], showMore: false, isLoading: true }
    }

    // Módulos para processar (API ou fallback)
    const sourceModules = modules.length > 0
      ? modules
      : DEFAULT_ALUNO_MOBILE_MODULES.map(m => ({
        ...m,
        isCore: false,
        submodules: [],
      }))

    // Aplicar mesmos filtros da sidebar desktop
    const filtered = sourceModules
      .filter(module => {
        // Esconder assistente genérico
        if (module.id === 'agente') return false
        // Esconder TobIAs para tenants que não são CDF
        if (module.id === 'tobias') {
          const isCDF = tenantSlug === 'cdf' || tenantSlug === 'cdf-curso-de-fsica'
          return isCDF
        }
        return true
      })
      .filter(module => module.url !== '/agendamentos')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(module => ({
        name: module.name,
        href: tenantSlug ? `/${tenantSlug}${module.url}` : module.url,
        icon: getIconComponent(module.iconName),
      }))

    const perfilItem: NavItem = {
      name: 'Perfil',
      href: tenantSlug ? `/${tenantSlug}/perfil` : '/perfil',
      icon: User,
    }

    // Estratégia de 5 slots
    if (filtered.length <= 4) {
      // Cabe tudo + Perfil
      return {
        primaryItems: [...filtered, perfilItem],
        overflowItems: [] as MoreSheetNavItem[],
        showMore: false,
        isLoading: false,
      }
    }

    if (filtered.length === 5) {
      // Exatamente 5 módulos, sem Perfil na barra
      return {
        primaryItems: filtered,
        overflowItems: [] as MoreSheetNavItem[],
        showMore: false,
        isLoading: false,
      }
    }

    // Mais de 5: primeiros 4 + botão "Mais"
    return {
      primaryItems: filtered.slice(0, 4),
      overflowItems: filtered.slice(4) as MoreSheetNavItem[],
      showMore: true,
      isLoading: false,
    }
  }, [staticNavItems, modules, loading, tenantSlug])

  // -----------------------------------------------------------------------
  // Determinar itens finais para renderizar
  // -----------------------------------------------------------------------

  const isLoading = staticNavItems === null && dynamicResult.isLoading
  const finalItems: NavItem[] | null = staticNavItems ?? dynamicResult.primaryItems

  // Verificar se algum item no overflow está ativo (para destacar o botão "Mais")
  const isOverflowActive = useMemo(() => {
    if (!dynamicResult.showMore) return false
    const perfilHref = tenantSlug ? `/${tenantSlug}/perfil` : '/perfil'
    return dynamicResult.overflowItems.some(
      item => pathname === item.href || pathname?.startsWith(item.href + '/')
    ) || pathname === perfilHref || pathname?.startsWith(perfilHref + '/')
  }, [dynamicResult.showMore, dynamicResult.overflowItems, tenantSlug, pathname])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="navigation"
      aria-label="Navegação principal"
    >
      {isLoading ? (
        <BottomNavSkeleton />
      ) : (
        <div className="flex h-16 items-stretch justify-around">
          {finalItems?.map((item) => {
            const fullHref = staticNavItems
              ? (tenantSlug ? `/${tenantSlug}${item.href}` : item.href)
              : item.href // Itens dinâmicos já incluem o tenant prefix
            const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={fullHref}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-11 min-h-11',
                  'transition-colors duration-150 touch-manipulation',
                  'active:bg-accent/80',
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
                    'text-[11px] font-medium leading-tight truncate max-w-full px-1',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}

          {dynamicResult.showMore && (
            <BottomNavMoreSheet
              items={dynamicResult.overflowItems}
              tenantSlug={tenantSlug}
              isMoreActive={isOverflowActive}
            />
          )}
        </div>
      )}
    </nav>
  )
}
