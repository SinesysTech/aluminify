"use client"

import dynamic from "next/dynamic"
import type { AppUser } from "@/app/shared/types"

const SettingsTabs = dynamic(
    () => import("@/app/[tenant]/(modules)/agendamentos/configuracoes/components/settings-tabs").then((mod) => mod.SettingsTabs),
    { ssr: false }
)

interface SettingsTabsWrapperProps {
    user: AppUser
}

export function SettingsTabsWrapper({ user }: SettingsTabsWrapperProps) {
    return <SettingsTabs user={user} />
}
