import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import { TenantLogo } from '@/components/shared/tenant-logo';

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Tenant Logo */}
        <div className="flex justify-center">
          <TenantLogo
            logoType="login"
            fallbackText="Sistema de GestÃ£o"
            width={160}
            height={50}
          />
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
