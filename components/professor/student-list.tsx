"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCPF } from "@/lib/br"
import { createClient } from "@/lib/client"

interface Aluno {
  id: string
  email: string
  nome_completo: string | null
  cpf?: string | null
  matriculas?: Array<{
    curso_id: string
    cursos?: {
      id: string
      nome: string
      empresa_id: string
    }
  }>
}

interface StudentListProps {
  alunos: Aluno[]
}

export function StudentList({ alunos }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredAlunos = alunos.filter((aluno) => {
    const search = searchTerm.toLowerCase()
    return (
      aluno.nome_completo?.toLowerCase().includes(search) ||
      aluno.email.toLowerCase().includes(search)
    )
  })

  const handleViewAsStudent = async (studentId: string) => {
    setLoadingId(studentId)
    try {
      // Obter token de autenticação
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        alert('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ studentId }),
      })

      const data = await response.json().catch(() => ({ error: 'Erro desconhecido' }))

      if (!response.ok) {
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          error: data,
        })
        alert(data.error || `Erro ao iniciar visualização (${response.status})`)
        return
      }

      if (data.success) {
        // Aguardar um pouco para garantir que o cookie foi definido
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/aluno/dashboard')
        router.refresh()
      } else {
        alert(data.error || 'Erro ao iniciar visualização')
      }
    } catch (error) {
      console.error('Erro ao iniciar visualização:', error)
      alert('Erro ao iniciar visualização. Verifique o console para mais detalhes.')
    } finally {
      setLoadingId(null)
    }
  }

  if (alunos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum aluno encontrado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar aluno por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlunos.map((aluno) => (
          <Card key={aluno.id} className="flex flex-col h-full">
            <CardHeader className="shrink-0 pb-3">
              <CardTitle className="text-lg line-clamp-2 wrap-break-word" title={aluno.nome_completo || aluno.email}>
                {aluno.nome_completo || aluno.email}
              </CardTitle>
              <CardDescription className="space-y-1">
                <div className="line-clamp-1 break-all" title={aluno.email}>
                  {aluno.email}
                </div>
                {aluno.cpf && (
                  <div className="text-xs text-muted-foreground/80 line-clamp-1" title={aluno.cpf}>
                    CPF: {formatCPF(aluno.cpf)}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 gap-4">
              {aluno.matriculas && aluno.matriculas.length > 0 && (
                <div className="shrink-0 min-h-0">
                  <p className="text-sm font-medium mb-2">Cursos:</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {aluno.matriculas.map((matricula, idx) => (
                      <li 
                        key={idx} 
                        className="line-clamp-2 wrap-break-word" 
                        title={matricula.cursos?.nome || 'Curso não encontrado'}
                      >
                        {matricula.cursos?.nome || 'Curso não encontrado'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-auto pt-2">
                <Button
                  onClick={() => handleViewAsStudent(aluno.id)}
                  disabled={loadingId === aluno.id}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {loadingId === aluno.id ? 'Carregando...' : 'Visualizar como Aluno'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlunos.length === 0 && searchTerm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhum aluno encontrado com &quot;{searchTerm}&quot;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


