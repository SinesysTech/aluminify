import React from 'react'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserProvider } from '@/components/providers/user-provider'
import { TenantBrandingProvider } from '@/components/providers/tenant-branding-provider'
import { StudentOrganizationsProvider } from '@/components/providers/student-organizations-provider'
import { CopilotProvider } from '@/components/providers/copilot-provider'
import { CopilotChatButton } from '@/components/copilot'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import {
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { requireUser } from '@/app/shared/core/auth'
import { StudentBrandingCoordinator } from '@/components/layout/student-branding-coordinator'

// 1. Importação das fontes do Design System (Aluminify)
import { Inter, JetBrains_Mono } from "next/font/google"
import { cn } from "@/app/shared/library/utils"

// 2. Configuração das fontes
const fontSans = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
})

const fontMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const user = await requireUser()

    // Determina o agente baseado no role do usuário
    // aluno -> student-agent, usuario/superadmin -> institution-agent
    const copilotAgentId = user.role === 'aluno' ? 'student-agent' : 'institution-agent'

    return (
        <UserProvider user={user}>
            <TenantBrandingProvider user={user}>
                <StudentOrganizationsProvider user={user}>
                    <CopilotProvider agentId={copilotAgentId}>
                    <StudentBrandingCoordinator />
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
                            {/* Main content - scroll nativo do body */}
                            <div className="p-4 md:px-8 md:py-6 pb-20 md:pb-8 bg-background">
                                {children}
                            </div>
                            <BottomNavigation />
                        </SidebarInset>
                    </SidebarProvider>
                    <CopilotChatButton context={user.role === 'aluno' ? 'student' : 'institution'} />
                    </CopilotProvider>
                </StudentOrganizationsProvider>
            </TenantBrandingProvider>
        </UserProvider>
    )
}
