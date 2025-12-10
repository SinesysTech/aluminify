import { ProfessorLoginForm } from '@/components/professor-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfessorLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login - Professor</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar sua área de trabalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfessorLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
