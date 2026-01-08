"use client"

import {
  Building2,
  Settings,
  UserCog,
  Users,
  GraduationCap,
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

const empresaNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/empresa/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Configurações da Empresa",
    url: "/admin/empresa",
    icon: Settings,
  },
  {
    title: "Administradores",
    url: "/admin/empresa/admins",
    icon: UserCog,
  },
  {
    title: "Professores",
    url: "/admin/empresa/professores",
    icon: GraduationCap,
  },
  {
    title: "Alunos da Empresa",
    url: "/admin/empresa/alunos",
    icon: Users,
  },
  {
    title: "Relatórios",
    url: "/empresa/relatorios",
    icon: FileText,
  },
  {
    title: "Perfil",
    url: "/perfil",
    icon: User,
  },
]

export function EmpresaSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = empresaNavItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

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
                    <span className="truncate font-medium">Área da Empresa</span>
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



