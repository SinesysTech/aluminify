'use client'

import { ProfileSettings } from "./profile-settings"
import type { AppUser } from "@/types/user"

interface ProfileTabsProps {
    user: AppUser
}

export function ProfileTabs({ user }: ProfileTabsProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-muted-foreground">
                    Gerencie suas informaÃ§Ãµes pessoais e preferÃªncias.
                </p>
            </div>
            <ProfileSettings user={user} />
        </div>
    )
}
