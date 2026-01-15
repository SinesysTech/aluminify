"use client"

import {
  Settings,
  UserCog,
  Users,
  GraduationCap,
  LayoutDashboard,
  FileText,
  Palette,
  BookOpen,
  Calendar,
  CalendarCheck,
  Layers,
  FolderOpen,
  Eye,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

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
    title: "Personalização da Marca",
    url: "/admin/empresa/branding",
    icon: Palette,
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
  // Funcionalidades do Professor (Superset)
  {
    title: "Visualizar como Aluno",
    url: "/professor/view-as-student",
    icon: Eye,
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
    title: "Conteúdo Programático",
    url: "/conteudos",
    icon: Calendar,
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
                  <AluminifyLogo />
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



