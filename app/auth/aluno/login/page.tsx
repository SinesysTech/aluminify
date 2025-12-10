import { AlunoLoginForm } from '@/components/aluno-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AlunoLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
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
