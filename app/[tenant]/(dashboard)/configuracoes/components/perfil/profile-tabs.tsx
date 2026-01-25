'use client'

import { User, Lock, Camera } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from './profile-settings'
import type { AppUser } from '@/types/user'

interface ProfileTabsProps {
    user: AppUser
}

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U'
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function getRoleLabel(role: string): string {
    const roleMap: Record<string, string> = {
        aluno: 'Aluno',
        professor: 'Professor',
        admin: 'Administrador',
        superadmin: 'Super Admin',
    }
    return roleMap[role] || role
}

export function ProfileTabs({ user }: ProfileTabsProps) {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header com Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-card rounded-lg border">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Avatar'} />
                    <AvatarFallback className="text-xl font-medium">
                        {getInitials(user.fullName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center sm:items-start gap-1">
                    <h1 className="page-title">
                        {user.fullName || 'Usuario'}
                    </h1>
                    <p className="page-subtitle">{user.email}</p>
                    <Badge variant="secondary" className="mt-1">
                        {getRoleLabel(user.role)}
                    </Badge>
                </div>
            </div>

            {/* Tabs de Configurações */}
            <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dados" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Dados Pessoais</span>
                        <span className="sm:hidden">Dados</span>
                    </TabsTrigger>
                    <TabsTrigger value="seguranca" className="gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Segurança</span>
                        <span className="sm:hidden">Senha</span>
                    </TabsTrigger>
                    <TabsTrigger value="avatar" className="gap-2">
                        <Camera className="h-4 w-4" />
                        <span className="hidden sm:inline">Foto de Perfil</span>
                        <span className="sm:hidden">Foto</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="mt-6">
                    <ProfileSettings user={user} section="dados" />
                </TabsContent>

                <TabsContent value="seguranca" className="mt-6">
                    <ProfileSettings user={user} section="seguranca" />
                </TabsContent>

                <TabsContent value="avatar" className="mt-6">
                    <ProfileSettings user={user} section="avatar" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
