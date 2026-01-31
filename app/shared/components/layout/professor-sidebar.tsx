"use client"

import {
  BookOpen,
  Calendar,
  FolderOpen,
  Users,
  LayoutDashboard,
  UserCog,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname, useParams } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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

const professorNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Alunos",
    url: "/usuario/alunos",
    icon: Users,
  },
  {
    title: "Usuarios",
    url: "/settings/equipe",
    icon: UserCog,
  },
  {
    title: "Cursos",
    url: "/curso",
    icon: BookOpen,
    items: [
      { title: "Meus Cursos", url: "/curso" },
      { title: "Disciplinas", url: "/curso/disciplinas" },
      { title: "Segmentos", url: "/curso/segmentos" },
      { title: "Conteúdo Programático", url: "/curso/conteudos" },
      { title: "Materiais", url: "/curso/conteudos/materiais" },
    ],
  },
  {
    title: "Biblioteca",
    url: "/biblioteca",
    icon: FolderOpen,
    items: [
      { title: "Materiais", url: "/biblioteca/materiais" },
      { title: "Flashcards", url: "/flashcards" },
    ],
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
    items: [
      { title: "Meus Agendamentos", url: "/agendamentos/meus" },
      { title: "Disponibilidade", url: "/agendamentos/disponibilidade" },
      { title: "Bloqueios", url: "/agendamentos/bloqueios" },
      { title: "Estatísticas", url: "/agendamentos/stats" },
    ],
  },
]

export function ProfessorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params?.tenant as string

  // Dynamic nav items based on tenant
  const navItems = professorNavItems.map(item => ({
    ...item,
    url: tenantSlug ? `/${tenantSlug}${item.url}` : item.url,
    items: item.items?.map(subItem => ({
      ...subItem,
      url: tenantSlug ? `/${tenantSlug}${subItem.url}` : subItem.url,
    })),
  }))

  const navMainWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
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

