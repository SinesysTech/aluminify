import { redirect } from 'next/navigation'

export default function Page() {
  // Redirecionar para a página de cadastro de professor
  redirect('/auth/professor/cadastro')
}
