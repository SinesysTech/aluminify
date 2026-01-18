"use client"

import {
  BookOpen,
  Calendar,
  CalendarCheck,
  FileText,
  Layers,
  FolderOpen,
  Users,
  LayoutDashboard,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname, useParams } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { useCurrentUser } from "@/components/providers/user-provider"
import { AluminifyLogo } from "@/components/ui/aluminify-logo"
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

const professorNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/professor/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Alunos",
    url: "/aluno",
    icon: Users,
  },
  {
    title: "Cursos",
    url: "/curso",
    icon: BookOpen,
  },
  {
    title: "Disciplinas",
    url: "/disciplina",
    icon: FileText,
  },
  {
    title: "Segmentos",
    url: "/segmento",
    icon: Layers,
  },
  {
    title: "Materiais",
    url: "/professor/materiais",
    icon: FolderOpen,
  },
  {
    title: "Flashcards",
    url: "/professor/flashcards",
    icon: FolderOpen,
  },
  {
    title: "Conteúdo Programático",
    url: "/conteudos",
    icon: Calendar,
  },
  {
    title: "Disponibilidade",
    url: "/professor/disponibilidade",
    icon: CalendarCheck,
  },
  {
    title: "Agendamentos",
    url: "/professor/agendamentos",
    icon: Calendar,
  },

]

export function ProfessorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const params = useParams()
  const tenantSlug = params?.tenant as string

  // Dynamic nav items based on tenant
  const navItems = professorNavItems.map(item => ({
    ...item,
    url: tenantSlug ? `/${tenantSlug}${item.url}` : item.url,
  }))

  const navMainWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  const homeLink = tenantSlug
    ? `/${tenantSlug}${getDefaultRouteForRole(user.role)}`
    : getDefaultRouteForRole(user.role)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={homeLink}>
                <div className="flex items-center gap-3">
                  <AluminifyLogo />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Área do Professor</span>
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

