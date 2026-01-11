import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserProvider } from '@/components/providers/user-provider'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { requireUser } from '@/lib/auth'

// 1. Importação das fontes do Design System (Aluminify)
import { Inter, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"

// 2. Configuração das fontes
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireUser()

  return (
    <UserProvider user={user}>
      <SidebarProvider 
        // 3. Aplicação das variáveis de fonte e classes base no Provider
        className={cn(
          "font-sans antialiased", 
          fontSans.variable, 
          fontMono.variable
        )}
      >
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <ImpersonationBanner />
          {/* Mantido o layout original, apenas garantindo bg-background para consistência do tema */}
          <div className="flex flex-1 flex-col gap-2 md:gap-4 p-2 md:p-4 pt-0 pb-16 md:pb-0 overflow-hidden min-h-0 bg-background">
            {children}
          </div>
          <BottomNavigation />
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}