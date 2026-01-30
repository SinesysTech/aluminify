import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/app/[tenant]/auth/components/forgot-password-form'
import { TenantLogo } from '@/components/ui/tenant-logo'

export const metadata: Metadata = {
    title: 'Esqueci Minha Senha'
}

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm space-y-6">
                {/* Tenant Logo */}
                <div className="flex justify-center">
                    <TenantLogo
                        logoType="login"
                        fallbackText="Sistema de Gestão"
                        width={160}
                        height={50}
                    />
                </div>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}
