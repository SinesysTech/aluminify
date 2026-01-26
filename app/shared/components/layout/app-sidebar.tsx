"use client"

import { SuperAdminSidebar } from "@/app/superadmin/components/superadmin-sidebar"
import { AlunoSidebar } from "@/components/layout/aluno-sidebar"
import { ProfessorSidebar } from "@/components/layout/professor-sidebar"
import { EmpresaSidebar } from "@/components/layout/empresa-sidebar"
import { useCurrentUser } from "@/components/providers/user-provider"
import type { Sidebar } from "@/components/ui/sidebar"
import { isAdminRoleTipo } from "@/app/shared/core/roles"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser()

  // Roteia para o sidebar correto baseado no role
  switch (user.role) {
    case 'aluno':
      return <AlunoSidebar {...props} />
    case 'usuario':
      // usuario = institution staff (professor, admin, staff, monitor)
      // admin and professor_admin see empresa sidebar
      if (user.roleType && isAdminRoleTipo(user.roleType)) {
        return <EmpresaSidebar {...props} />
      }
      return <ProfessorSidebar {...props} />
    case 'superadmin':
      return <SuperAdminSidebar {...props} />
    default:
      return <AlunoSidebar {...props} />
  }
}
