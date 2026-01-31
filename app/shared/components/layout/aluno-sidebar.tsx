"use client"

import { useMemo } from "react"
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  Circle,
  Clock,
  Library,
  Layers,
  CalendarPlus,
  Bot,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname, useParams } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { useModuleVisibility } from "@/app/shared/hooks/use-module-visibility"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: {
    title: string
    url: string
  }[]
}

// Icon mapping: name string -> Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Calendar,
  CalendarDays,
  CalendarPlus,
  MessageSquare,
  Clock,
  Library,
  Layers,
  Bot,
}

/**
 * Get icon component from icon name string
 * Falls back to Circle if icon not found
 */
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle
}

/**
 * Skeleton component for sidebar menu items while loading
 * Shows placeholder items to prevent layout shift without showing actual menu items
 */
function NavMenuSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {/* Show 5 skeleton items to match typical module count */}
        {[1, 2, 3, 4, 5].map((i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuButton disabled className="pointer-events-none">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// Default nav items (fallback ONLY when no config exists, NOT during loading)
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sala de Estudos",
    url: "/sala-de-estudos",
    icon: BookOpen,
  },
  {
    title: "Cronograma de Estudo",
    url: "/cronograma",
    icon: CalendarCheck,
  },
  {
    title: "Modo Foco",
    url: "/foco",
    icon: Clock,
  },
  {
    title: "Biblioteca",
    url: "/biblioteca",
    icon: Library,
  },
  {
    title: "Flashcards",
    url: "/flashcards",
    icon: Layers,
  },
  {
    title: "Meus Agendamentos",
    url: "/agendamentos/meus",
    icon: Calendar,
  },
  {
    title: "Agendar Mentoria",
    url: "/agendamentos",
    icon: CalendarPlus,
  },
]

export function AlunoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params?.tenant as string

  // Get module visibility from context
  const { modules, loading } = useModuleVisibility()

  // Build nav items from module visibility or use defaults
  // IMPORTANT: During loading, return null to show skeleton (prevents flash)
  // Only use defaults if loading is complete but no modules exist
  const navItems = useMemo(() => {
    // Still loading - return null to trigger skeleton display
    if (loading) {
      return null
    }

    // Loading complete but no modules configured - use defaults as fallback
    if (modules.length === 0) {
      return DEFAULT_NAV_ITEMS.map(item => ({
        ...item,
        url: tenantSlug ? `/${tenantSlug}${item.url}` : item.url,
        items: item.items?.map(subItem => ({
          ...subItem,
          url: tenantSlug ? `/${tenantSlug}${subItem.url}` : subItem.url,
        })),
      }))
    }

    // Build nav items from module visibility config
    return modules
      .filter(module => {
        // HIDE generic assistant for everyone
        if (module.id === 'agente') return false;

        // HIDE TobIAs for non-CDF tenants
        if (module.id === 'tobias') {
          const isCDF = tenantSlug === 'cdf' || tenantSlug === 'cdf-curso-de-fsica';
          return isCDF;
        }

        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(module => ({
        title: module.name,
        url: tenantSlug ? `/${tenantSlug}${module.url}` : module.url,
        icon: getIconComponent(module.iconName),
        items: module.submodules.length > 0
          ? module.submodules
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(sub => ({
              title: sub.name,
              url: tenantSlug ? `/${tenantSlug}${sub.url}` : sub.url,
            }))
          : undefined,
      }))
  }, [modules, loading, tenantSlug])

  // Only compute active state if we have nav items (not during loading)
  const navMainWithActive = navItems?.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  })) ?? null

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navMainWithActive ? (
          <NavMain items={navMainWithActive} label="Menu" />
        ) : (
          <NavMenuSkeleton />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
