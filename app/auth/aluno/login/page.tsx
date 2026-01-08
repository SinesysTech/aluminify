import { AlunoLoginForm } from '@/components/auth/aluno-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantLogo } from '@/components/shared/tenant-logo';

export default function AlunoLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {/* Tenant Logo */}
          <div className="flex justify-center mb-4">
            <TenantLogo 
              logoType="login"
              className="mb-2"
              fallbackText="Sistema de Gestão"
              width={160}
              height={50}
            />
          </div>
          <CardTitle className="text-2xl font-bold">Login - Aluno</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar sua área de estudos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlunoLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
