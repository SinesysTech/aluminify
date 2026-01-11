import { redirect } from 'next/navigation';

export default function AuthPage() {
  redirect('/auth/aluno/login');
}
