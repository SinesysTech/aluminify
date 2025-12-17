"use client"

import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Command,
  FileText,
  Layers,
  MessageSquare,
  FolderOpen,
  School,
  BrainCircuit,
  LayoutDashboard,
  Users,
  GraduationCap,
  Settings,
  UserCog,
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
import { hasRequiredRole, getDefaultRouteForRole } from "@/lib/roles"
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
  // Estudante
  {
    title: "Dashboard",
    url: "/aluno/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    title: "Calendário",
    url: "/aluno/cronograma/calendario",
    icon: Calendar,
    roles: ALL_ROLES,
  },
  {
    title: "Sala de Estudos",
    url: "/aluno/sala-de-estudos",
    icon: School,
    roles: ALL_ROLES,
  },
  {
    title: "TobIAs",
    url: "/tobias",
    icon: MessageSquare,
    roles: ALL_ROLES,
  },
  {
    title: "Meu Cronograma",
    url: "/aluno/cronograma",
    icon: CalendarCheck,
    roles: ALL_ROLES,
  },
  {
    title: "Flashcards",
    url: "/aluno/flashcards",
    icon: BrainCircuit,
    roles: ALL_ROLES,
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
    roles: ALL_ROLES,
  },
  // Professor
  {
    title: "Alunos",
    url: "/aluno",
    icon: Users,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Professores",
    url: "/professor",
    icon: GraduationCap,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Segmentos",
    url: "/segmento",
    icon: Layers,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Disciplinas",
    url: "/disciplina",
    icon: FileText,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Cursos",
    url: "/curso",
    icon: BookOpen,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Conteúdo Programático",
    url: "/conteudos",
    icon: Calendar,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Gestão de Materiais",
    url: "/admin/materiais",
    icon: FolderOpen,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Gestão de Flashcards",
    url: "/admin/flashcards",
    icon: FolderOpen,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Disponibilidade",
    url: "/professor/disponibilidade",
    icon: CalendarCheck,
    roles: PROFESSOR_ONLY,
  },
  // Gestão da Empresa (apenas admins)
  {
    title: "Configurações da Empresa",
    url: "/admin/empresa",
    icon: Settings,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Administradores",
    url: "/admin/empresa/admins",
    icon: UserCog,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Professores",
    url: "/admin/empresa/professores",
    icon: GraduationCap,
    roles: PROFESSOR_ONLY,
  },
  {
    title: "Alunos da Empresa",
    url: "/admin/empresa/alunos",
    icon: Users,
    roles: PROFESSOR_ONLY,
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

  const studentItems = navMainWithActive.filter((item) => hasRequiredRole("aluno", item.roles))
  const professorItems = navMainWithActive.filter((item) => hasRequiredRole("professor", item.roles) && !hasRequiredRole("aluno", item.roles) && !item.url.startsWith("/admin/empresa"))
  const empresaItems = navMainWithActive.filter((item) => item.url.startsWith("/admin/empresa"))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={getDefaultRouteForRole(user.role)}>
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
        {studentItems.length > 0 && <NavMain items={studentItems} label="Menu Estudante" />}
        {studentItems.length > 0 && professorItems.length > 0 && (
          <div className="h-px bg-border/60 mx-3 my-0" aria-hidden="true" />
        )}
        {professorItems.length > 0 && <NavMain items={professorItems} label="Menu Professor" />}
        {empresaItems.length > 0 && (
          <>
            <div className="h-px bg-border/60 mx-3 my-2" aria-hidden="true" />
            <NavMain items={empresaItems} label="Gestão da Empresa" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
