import { AppSidebar } from '@/components/app-sidebar'
import { UserProvider } from '@/components/providers/user-provider'
import { BottomNavigation } from '@/components/bottom-navigation'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
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
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-2 md:gap-4 p-2 md:p-4 pt-0 pb-16 md:pb-0">{children}</div>
          <BottomNavigation />
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}
