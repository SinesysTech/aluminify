"use client"

import {
  Building2,
  GraduationCap,
  Shield,
  Users,
  LayoutDashboard,
  FileText,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { useCurrentUser } from "@/components/providers/user-provider"
import { TenantLogo } from "@/components/shared/tenant-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getDefaultRouteForRole } from "@/lib/roles"

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
    title: "Relatórios Globais",
    url: "/superadmin/relatorios",
    icon: FileText,
  },
  {
    title: "Perfil",
    url: "/perfil",
    icon: User,
  },
]

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = superAdminNavItems.map((item) => {
    let isActive = false;
    
    if (item.url === '/admin/empresas') {
      // Empresas é ativo quando estamos em /admin ou /admin/empresas
      isActive = pathname === '/admin' || pathname === '/admin/empresas' || pathname?.startsWith('/admin/empresas/');
    } else if (item.url === '/admin/professores') {
      isActive = pathname === '/admin/professores' || pathname?.startsWith('/admin/professores/');
    } else if (item.url === '/admin/alunos') {
      isActive = pathname === '/admin/alunos' || pathname?.startsWith('/admin/alunos/');
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
                  <TenantLogo 
                    logoType="sidebar"
                    empresaId={user.empresaId}
                    fallbackText="Sistema"
                    width={32}
                    height={32}
                    className="shrink-0"
                  />
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

