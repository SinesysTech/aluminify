"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  GraduationCap,
  Layers,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMainData = [
    {
      title: "TobIAs",
      url: "/tobias",
      icon: MessageSquare,
      isActive: false,
    },
    {
      title: "Professores",
      url: "/professor",
      icon: GraduationCap,
      isActive: false,
    },
    {
      title: "Alunos",
      url: "/aluno",
      icon: Users,
      isActive: false,
    },
    {
      title: "Cursos",
      url: "/curso",
      icon: BookOpen,
      isActive: false,
    },
    {
      title: "Disciplinas",
      url: "/disciplina",
      icon: FileText,
      isActive: false,
    },
    {
      title: "Segmentos",
      url: "/segmento",
      icon: Layers,
      isActive: false,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  // Update active state based on current pathname
  const navMainWithActive = navMainData.map((item) => ({
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
