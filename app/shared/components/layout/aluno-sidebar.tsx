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
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname, useParams } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { useCurrentUser } from "@/components/providers/user-provider"
import { TenantLogo } from "@/components/ui/tenant-logo"
import { useModuleVisibility } from "@/app/shared/hooks/use-module-visibility"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getDefaultRouteForRole } from "@/app/shared/core/roles"

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
}

/**
 * Get icon component from icon name string
 * Falls back to Circle if icon not found
 */
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle
}

// Default nav items (fallback when no config or during loading)
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
    title: "Cronograma",
    url: "/cronograma",
    icon: CalendarCheck,
  },
  {
    title: "Calendário",
    url: "/cronograma/calendario",
    icon: CalendarDays,
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
  {
    title: "Assistente",
    url: "/agente",
    icon: MessageSquare,
  },
]

export function AlunoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const params = useParams()
  const tenantSlug = params?.tenant as string

  // Get module visibility from context
  const { modules, loading } = useModuleVisibility()

  // Build nav items from module visibility or use defaults
  const navItems = useMemo(() => {
    // Use defaults while loading or if no config exists
    if (loading || modules.length === 0) {
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

  const navMainWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  const homeLink = tenantSlug
    ? `/${tenantSlug}${getDefaultRouteForRole(user.role)}`
    : getDefaultRouteForRole(user.role)

  // Get organization name and first letter for fallback
  const organizationName = user.empresaNome || 'Área do Aluno'
  const fallbackLetter = organizationName.charAt(0).toUpperCase()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={homeLink}>
                <div className="flex items-center gap-3">
                  <TenantLogo
                    logoType="sidebar"
                    empresaId={user.empresaId}
                    width={32}
                    height={32}
                    fallbackText={fallbackLetter}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{organizationName}</span>
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} label="Menu" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
