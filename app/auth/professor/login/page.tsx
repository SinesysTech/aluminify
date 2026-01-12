import { LoginPageClient } from '@/components/auth/login-page-client'
import { Suspense } from 'react'

export default function ProfessorLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient variant="professor" />
    </Suspense>
  )
}
