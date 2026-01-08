import { ProfessorSignUpForm } from '@/components/auth/professor-sign-up-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantLogo } from '@/components/shared/tenant-logo';
import { Suspense } from 'react';

function ProfessorCadastroContent() {
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
