"use client"

import {
  Building2,
  GraduationCap,
  Users,
  LayoutDashboard,
  FileText,
  DollarSign,
  CreditCard,
  Link2,
  ScrollText,
  Settings,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/app/shared/components/layout/nav-main"
import { NavUser } from "@/app/shared/components/layout/nav-user"
import { useCurrentUser } from "@/app/shared/components/providers/user-provider"
import { AluminifyLogo } from "@/app/shared/components/ui/aluminify-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/shared/components/ui/sidebar"
import { getDefaultRouteForRole } from "@/app/shared/core/roles"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

const superAdminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/superadmin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Empresas",
    url: "/superadmin/empresas",
    icon: Building2,
  },
  {
    title: "Professores",
    url: "/superadmin/professores",
    icon: GraduationCap,
  },
  {
    title: "Alunos",
    url: "/superadmin/alunos",
    icon: Users,
  },
  {
    title: "Financeiro",
    url: "/superadmin/financeiro",
    icon: DollarSign,
  },
  {
    title: "Planos",
    url: "/superadmin/planos",
    icon: CreditCard,
  },
  {
    title: "Relatórios Globais",
    url: "/superadmin/relatorios",
    icon: FileText,
  },
  {
    title: "Integrações",
    url: "/superadmin/integracoes",
    icon: Link2,
  },
  {
    title: "Logs",
    url: "/superadmin/logs",
    icon: ScrollText,
  },
  {
    title: "Configurações",
    url: "/superadmin/configuracoes",
    icon: Settings,
  },
]

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = superAdminNavItems.map((item) => {
    const isActive = pathname === item.url || pathname?.startsWith(item.url + "/")

    return {
      ...item,
      isActive,
    }
  })

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={getDefaultRouteForRole(user.role)}>
                <div className="flex items-center gap-3">
                  <AluminifyLogo />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Super Admin</span>
                    <span className="truncate text-xs">Sistema de Gestão</span>
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
