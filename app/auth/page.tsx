import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Bem-vindo!</h1>
          <p className="text-lg text-muted-foreground">
            Selecione como deseja acessar o sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Login do Aluno */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sou Aluno</CardTitle>
              <CardDescription>
                Acesse sua área de estudos, cronogramas e materiais didáticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/aluno/login">
                <Button className="w-full" size="lg">
                  Entrar como Aluno
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card de Login do Professor */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sou Professor</CardTitle>
              <CardDescription>
                Gerencie turmas, alunos, conteúdos e acompanhe o desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/professor/login">
                <Button className="w-full" size="lg">
                  Entrar como Professor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
