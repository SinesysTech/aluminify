import { AppSidebar } from '@/components/app-sidebar'
import { UserProvider } from '@/components/providers/user-provider'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { DashboardHeaderAlt } from '@/components/dashboard-header-alt'
import { requireUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireUser()

  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeaderAlt />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}

