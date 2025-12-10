import { redirect } from 'next/navigation'

export default function Page() {
  // Redirecionar para a página de seleção de tipo de usuário
  redirect('/auth')
}
