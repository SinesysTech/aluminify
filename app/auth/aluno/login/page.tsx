import { redirect } from 'next/navigation'

// Esta rota será reativada quando o sistema de multi-tenant baseado em domínio for implementado
// Por enquanto, redireciona para a rota de login genérica
export default function AlunoLoginPage() {
  redirect('/auth/login')
}
