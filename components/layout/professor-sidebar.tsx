"use client"

import {
  BookOpen,
  Calendar,
  CalendarCheck,
  FileText,
  Layers,
  FolderOpen,
  Users,
  GraduationCap,
  Eye,
  LayoutDashboard,
  User,
  Building2,
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

const professorNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/professor/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Visualizar como Aluno",
    url: "/professor/view-as-student",
    icon: Eye,
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
  {
    title: "Perfil",
    url: "/perfil",
    icon: User,
  },
  {
    title: "Empresa",
    url: "/admin/empresa",
    icon: Building2,
  },
]

export function ProfessorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = professorNavItems.map((item) => ({
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

