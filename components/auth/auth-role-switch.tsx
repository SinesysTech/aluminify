'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AuthRoleSwitchProps = {
  className?: string
}

export function AuthRoleSwitch({ className }: AuthRoleSwitchProps) {
  const pathname = usePathname() ?? ''

  const isProfessor = pathname.startsWith('/auth/professor')
  const isAluno = pathname.startsWith('/auth/aluno')

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Button asChild size="sm" variant={isAluno ? 'default' : 'outline'}>
        <Link href="/auth/aluno/login">Aluno</Link>
      </Button>
      <Button asChild size="sm" variant={isProfessor ? 'default' : 'outline'}>
        <Link href="/auth/professor/login">Professor</Link>
      </Button>
    </div>
  )
}
