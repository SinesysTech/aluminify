'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'

export function AuthRoleSwitch() {
  const pathname = usePathname()

  const activeRole: 'aluno' | 'professor' | null = React.useMemo(() => {
    if (!pathname) return null
    if (pathname.includes('/auth/professor')) return 'professor'
    if (pathname.includes('/auth/aluno')) return 'aluno'
    return null
  }, [pathname])

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant={activeRole === 'aluno' ? 'default' : 'outline'}
        size="sm"
      >
        <Link href="/auth/aluno/login">Aluno</Link>
      </Button>
      <Button
        asChild
        variant={activeRole === 'professor' ? 'default' : 'outline'}
        size="sm"
      >
        <Link href="/auth/professor/login">Professor</Link>
      </Button>
    </div>
  )
}
