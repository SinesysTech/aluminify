"use client"

import {
  Calendar,
  CalendarCheck,
  MessageSquare,
  School,
  BrainCircuit,
  LayoutDashboard,
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

const alunoNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/aluno/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calendário",
    url: "/aluno/cronograma/calendario",
    icon: Calendar,
  },
  {
    title: "Sala de Estudos",
    url: "/aluno/sala-de-estudos",
    icon: School,
  },
  {
    title: "TobIAs",
    url: "/tobias",
    icon: MessageSquare,
  },
  {
    title: "Meu Cronograma",
    url: "/aluno/cronograma",
    icon: CalendarCheck,
  },
  {
    title: "Flashcards",
    url: "/aluno/flashcards",
    icon: BrainCircuit,
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
  },

]

export function AlunoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = alunoNavItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  // Get organization name and first letter for fallback
  const organizationName = user.empresaNome || 'Área do Aluno'
  const fallbackLetter = organizationName.charAt(0).toUpperCase()

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
                    width={32}
                    height={32}
                    fallbackText={fallbackLetter}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{organizationName}</span>
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




