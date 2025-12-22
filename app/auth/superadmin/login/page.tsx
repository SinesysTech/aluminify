import { SuperAdminLoginForm } from '@/components/superadmin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login - Super Admin</CardTitle>
          <CardDescription>
            Acesso exclusivo para administradores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

