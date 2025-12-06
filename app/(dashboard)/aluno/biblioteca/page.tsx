import { requireUser } from '@/lib/auth'
import SalaEstudosClientPage from '../sala-de-estudos/sala-estudos-client'

export default async function BibliotecaPage() {
  await requireUser()
  return <SalaEstudosClientPage title="Biblioteca" description="Preview da experiência do aluno" />
}
