"use client"

import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Command,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
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
import { hasRequiredRole } from "@/lib/roles"
import type { AppUserRole } from "@/types/user"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  roles: AppUserRole[]
}

const ALL_ROLES: AppUserRole[] = ["aluno", "professor", "superadmin"]
const PROFESSOR_ONLY: AppUserRole[] = ["professor", "superadmin"]

const navMainData: NavItem[] = [
  {
    title: "Calendário",
    url: "/aluno/cronograma/calendario",
    icon: Calendar,
    roles: ALL_ROLES,
  },
  {
    title: "TobIAs",
    url: "/tobias",
    icon: MessageSquare,
    roles: ALL_ROLES,
  },
  {
    title: "Professores",
    url: "/professor",
    icon: GraduationCap,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Alunos",
    url: "/aluno",
    icon: Users,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Cursos",
    url: "/curso",
    icon: BookOpen,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Disciplinas",
    url: "/disciplina",
    icon: FileText,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Segmentos",
    url: "/segmento",
    icon: Layers,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Conteúdo Programático",
    url: "/conteudos",
    icon: Calendar,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Meu Cronograma",
    url: "/aluno/cronograma",
    icon: CalendarCheck,
    roles: ALL_ROLES,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const filteredNav = navMainData.filter((item) =>
    hasRequiredRole(user.role, item.roles)
  )

  const navMainWithActive = filteredNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Área do Aluno</span>
                  <span className="truncate text-xs">Sistema de Gestão</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
