'use client'

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandingSettings } from "@/components/perfil/branding-settings"
import { CompanySettings } from "@/components/perfil/company-settings"
import { UserManagement } from "./user-management"
import type { AppUser } from "@/types/user"

interface SettingsTabsProps {
    user: AppUser
    initialTab?: string
}

const VALID_TABS = ['branding', 'empresa', 'usuarios']

export function SettingsTabs({ user, initialTab }: SettingsTabsProps) {
    const defaultTab = initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'branding'
    const [activeTab, setActiveTab] = useState(defaultTab)
    if (!user.empresaId) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    VocÃª nÃ£o estÃ¡ associado a nenhuma empresa.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 h-full">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
                <div>
                    <h1 className="page-title">Configuracoes da Empresa</h1>
                    <p className="page-subtitle">
                        Gerencie as configuracoes, personalizacao e usuarios da sua empresa.
                    </p>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="branding">CustomizaÃ§Ãµes de Marca</TabsTrigger>
                    <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
                    <TabsTrigger value="usuarios">GestÃ£o de UsuÃ¡rios</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6">
                    <BrandingSettings empresaId={user.empresaId} />
                </TabsContent>

                <TabsContent value="empresa" className="space-y-6">
                    <CompanySettings empresaId={user.empresaId} />
                </TabsContent>

                <TabsContent value="usuarios" className="space-y-6">
                    <UserManagement empresaId={user.empresaId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
