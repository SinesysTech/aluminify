'use client'

import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    // Best-effort: limpar modo impersonação (cookie httpOnly) antes de sair.
    // Se não estiver impersonando, a API pode retornar 400/401 e tudo bem.
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
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return <Button onClick={logout}>Logout</Button>
}
