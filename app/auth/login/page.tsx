import { LoginPageClient } from '@/components/auth/login-page-client'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient variant="generic" />
    </Suspense>
  )
}
