import { LoginPageClient } from '@/components/auth/login-page-client'
import { Suspense } from 'react'

export default function AlunoLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient variant="aluno" />
    </Suspense>
  )
}
