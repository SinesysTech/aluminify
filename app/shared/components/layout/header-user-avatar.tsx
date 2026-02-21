"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  BadgeCheck,
  LogOut,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/components/overlay/dropdown-menu"
import { createClient, enableAuthCookieDeletion } from "@/app/shared/core/client"
import { clearAuthTokenCache } from "@/app/shared/library/api-client"

export function HeaderUserAvatar() {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params?.tenant as string | undefined
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar?: string
  } | null>(null)

  const loadUser = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const email = session.user.email || ''
        let name = session.user.user_metadata?.full_name ||
                   session.user.user_metadata?.name ||
                   email.split('@')[0] ||
                   'Usuário'

        try {
          const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('nome_completo')
            .eq('id', session.user.id)
            .maybeSingle()

          if (!userError && usuario?.nome_completo) {
            name = usuario.nome_completo
          }
        } catch {
          // Se não encontrar, usar o nome do metadata
        }

        const avatarUrl = session.user.user_metadata?.avatar_url || null

        setUser({
          name,
          email,
          avatar: avatarUrl,
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    const handleAvatarUpdate = () => {
      loadUser()
    }
    window.addEventListener('avatar-updated', handleAvatarUpdate)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await fetch('/api/auth/stop-impersonate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }).catch(() => null)
        }
      } catch {
        // noop
      }
      clearAuthTokenCache()
      enableAuthCookieDeletion()
      await supabase.auth.signOut()
      router.push(tenantSlug ? `/${tenantSlug}/auth/login` : '/auth')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  if (!user) {
    return (
      <Avatar className="size-8 rounded-full">
        <AvatarFallback className="rounded-full text-xs">...</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="size-8 rounded-full cursor-pointer">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-xs font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-full text-xs">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={tenantSlug ? `/${tenantSlug}/perfil` : "/perfil"}>
              <BadgeCheck />
              Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={tenantSlug ? `/${tenantSlug}/settings` : "/settings"}>
              <Settings />
              Configurações
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
