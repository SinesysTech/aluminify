"use client"

import {
  Building2,
  GraduationCap,
  Users,
  LayoutDashboard,
  FileText,
  DollarSign,
  CreditCard,
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
]

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = superAdminNavItems.map((item) => {
    let isActive = false;

    if (item.url === '/empresa/detalhess') {
      // Empresas é ativo quando estamos em /admin ou /empresa/detalhess
      isActive = pathname === '/admin' || pathname === '/empresa/detalhess' || pathname?.startsWith('/empresa/detalhess/');
    } else if (item.url === '/usuario/professores') {
      isActive = pathname === '/usuario/professores' || pathname?.startsWith('/usuario/professores/');
    } else if (item.url === '/usuario/alunos') {
      isActive = pathname === '/usuario/alunos' || pathname?.startsWith('/usuario/alunos/');
    } else {
      isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
    }

    return {
      ...item,
      isActive,
    };
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

