import { ProfessorSignUpForm } from '@/components/professor-sign-up-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

function ProfessorCadastroContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Cadastro - Professor</CardTitle>
          <CardDescription>
            Crie sua conta para começar a ensinar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfessorSignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfessorCadastroPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProfessorCadastroContent />
    </Suspense>
  );
}
