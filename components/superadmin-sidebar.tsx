"use client"

import {
  Building2,
  GraduationCap,
  Shield,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useCurrentUser } from "@/components/providers/user-provider"
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
    title: "Empresas",
    url: "/admin/empresas",
    icon: Building2,
  },
  {
    title: "Professores",
    url: "/admin/professores",
    icon: GraduationCap,
  },
  {
    title: "Alunos",
    url: "/admin/alunos",
    icon: Users,
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
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Super Admin</span>
                  <span className="truncate text-xs">Sistema de Gestão</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} label="Super Administração" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

