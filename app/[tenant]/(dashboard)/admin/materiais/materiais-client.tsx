'use client'

import * as React from 'react'
import { createClient } from '@/lib/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MaterialsFilters } from '../../conteudos/components/shared/materials-filters'
import { ModuleAccordion } from '../../conteudos/components/shared/module-accordion'
import RulesPanel from '@/components/shared/rules-panel'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ModuloComAtividades, Atividade } from './types'

type Disciplina = {
  id: string
  nome: string
}

type Curso = {
  id: string
  nome: string
}

type Frente = {
  id: string
  nome: string
  disciplina_id: string
  curso_id?: string | null
}

type TipoAtividade =
  | 'Nivel_1'
  | 'Nivel_2'
  | 'Nivel_3'
  | 'Nivel_4'
  | 'Conceituario'
  | 'Lista_Mista'
  | 'Simulado_Diagnostico'
  | 'Simulado_Cumulativo'
  | 'Simulado_Global'
  | 'Flashcards'
  | 'Revisao'

type RegraAtividade = {
  id: string
  cursoId: string | null
  tipoAtividade: TipoAtividade
  nomePadrao: string
  frequenciaModulos: number
  comecarNoModulo: number
  acumulativo: boolean
  acumulativoDesdeInicio?: boolean
  gerarNoUltimo: boolean
}


export default function MateriaisClientPage() {
  const supabase = createClient()

  const [cursos, setCursos] = React.useState<Curso[]>([])
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [frentes, setFrentes] = React.useState<Frente[]>([])
  const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
  const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
  const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')
  const [_frenteCursoId, setFrenteCursoId] = React.useState<string | null>(null)
  const [modulosComAtividades, setModulosComAtividades] = React.useState<ModuloComAtividades[]>([])
  const [, setIsLoading] = React.useState(false)
  const [isLoadingFrentes, setIsLoadingFrentes] = React.useState(false)
  const [isLoadingAtividades, setIsLoadingAtividades] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isUpdatingEstrutura, setIsUpdatingEstrutura] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [regras, setRegras] = React.useState<RegraAtividade[]>([])

  const fetchWithAuth = React.useCallback(
    async (input: string, init?: RequestInit) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const headers = new Headers(init?.headers || {})
      if (!(init?.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }
      headers.set('Authorization', `Bearer ${session.access_token}`)

      return fetch(input, {
        ...init,
        headers,
      })
    },
    [supabase],
  )

  // Carregar cursos
  React.useEffect(() => {
    const fetchCursos = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('cursos')
          .select('id, nome')
          .order('nome', { ascending: true })

        if (error) throw error
        setCursos(data || [])
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
        setError('Erro ao carregar cursos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCursos()
  }, [supabase])

  // Carregar disciplinas ao selecionar curso
  React.useEffect(() => {
    const fetchDisciplinas = async () => {
      setDisciplinas([])
      setDisciplinaSelecionada('')
      setFrentes([])
      setFrenteSelecionada('')
      setFrenteCursoId(null)
      setModulosComAtividades([])

      if (!cursoSelecionado) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('cursos_disciplinas')
          .select('disciplina:disciplina_id ( id, nome )')
          .eq('curso_id', cursoSelecionado)
          .order('disciplina(nome)', { ascending: true })
          .returns<Array<{ disciplina: { id: string; nome: string } | null }>>()

        if (error) throw error

        const mapped =
          data
            ?.map((row) => row.disciplina)
            .filter((d): d is { id: string; nome: string } => d !== null)
            .map((d) => ({ id: d.id, nome: d.nome })) ?? []

        const unique = Array.from(new Map(mapped.map((d) => [d.id, d])).values())
        setDisciplinas(unique)
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err)
        setError('Erro ao carregar disciplinas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDisciplinas()
  }, [supabase, cursoSelecionado])

  // Carregar frentes quando disciplina muda
  React.useEffect(() => {
    const fetchFrentes = async () => {
      if (!disciplinaSelecionada || !cursoSelecionado) {
        setFrentes([])
        setFrenteSelecionada('')
        setModulosComAtividades([])
        return
      }

      try {
        setIsLoadingFrentes(true)
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, curso_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .eq('curso_id', cursoSelecionado)
          .order('nome', { ascending: true })
          .returns<Array<{ id: string; nome: string; disciplina_id: string | null; curso_id: string | null }>>()

        if (error) throw error
        setFrentes((data || []).filter(f => f.disciplina_id !== null).map(f => ({
          ...f,
          disciplina_id: f.disciplina_id!,
          curso_id: f.curso_id ?? null
        })))
        setFrenteSelecionada('')
        setFrenteCursoId(null)
        setModulosComAtividades([])
      } catch (err) {
        console.error('Erro ao carregar frentes:', err)
        setError('Erro ao carregar frentes')
      } finally {
        setIsLoadingFrentes(false)
      }
    }

    fetchFrentes()
  }, [supabase, disciplinaSelecionada, cursoSelecionado])

  // Carregar módulos e atividades quando frente muda
  React.useEffect(() => {
    const fetchModulosEAtividades = async () => {
      if (!frenteSelecionada) {
        setModulosComAtividades([])
        setFrenteCursoId(null)
        return
      }

      try {
        setIsLoadingAtividades(true)
        setError(null)

        // Buscar módulos da frente
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id')
          .eq('frente_id', frenteSelecionada)
          .order('numero_modulo', { ascending: true })
          .returns<Array<{ id: string; nome: string; numero_modulo: number | null; frente_id: string | null }>>()

        if (modulosError) throw modulosError

        if (!modulosData || modulosData.length === 0) {
          setModulosComAtividades([])
          return
        }

        // Buscar atividades da frente
        const response = await fetch(`/api/atividade?frente_id=${frenteSelecionada}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar atividades')
        }

        const { data: atividadesData } = await response.json() as { data: unknown }

        // Agrupar atividades por módulo
        const modulosComAtividadesMap = new Map<string, ModuloComAtividades>()

        modulosData
          .filter(modulo => modulo.frente_id !== null)
          .forEach((modulo) => {
            modulosComAtividadesMap.set(modulo.id, {
              id: modulo.id,
              nome: modulo.nome,
              numero_modulo: modulo.numero_modulo,
              frente_id: modulo.frente_id!,
              atividades: [],
            })
          })

        const atividades = Array.isArray(atividadesData) ? atividadesData as Atividade[] : []
        atividades.forEach((atividade) => {
          const modulo = modulosComAtividadesMap.get(atividade.moduloId)
          if (modulo) {
            modulo.atividades.push(atividade)
          }
        })

        // Ordenar atividades dentro de cada módulo
        modulosComAtividadesMap.forEach((modulo) => {
          modulo.atividades.sort((a, b) => {
            if (a.ordemExibicao !== b.ordemExibicao) {
              return a.ordemExibicao - b.ordemExibicao
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })
        })

        setModulosComAtividades(Array.from(modulosComAtividadesMap.values()))
      } catch (err) {
        console.error('Erro ao carregar módulos e atividades:', err)
        setError('Erro ao carregar conteúdo')
      } finally {
        setIsLoadingAtividades(false)
      }
    }

    fetchModulosEAtividades()
  }, [frenteSelecionada, frentes, supabase])

  React.useEffect(() => {
    const fetchRegras = async () => {
      if (!cursoSelecionado) {
        setRegras([])
        return
      }

      try {
        const response = await fetchWithAuth(`/api/regras-atividades?curso_id=${cursoSelecionado}`)
        const body = await response.json()
        if (!response.ok) {
          throw new Error(body?.error || 'Erro ao carregar regras')
        }
        setRegras(body.data || [])
      } catch (err) {
        console.error('Erro ao carregar regras:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar regras de atividades')
      }
    }

    fetchRegras()
  }, [cursoSelecionado, fetchWithAuth])

  const handleGenerateStructure = async () => {
    if (!cursoSelecionado) {
      setError('Selecione um curso')
      return
    }

    if (!frenteSelecionada) {
      setError('Selecione uma frente primeiro')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      setSuccessMessage(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const response = await fetch('/api/atividade/gerar-estrutura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          curso_id: cursoSelecionado,
          frente_id: frenteSelecionada,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar estrutura')
      }

      setSuccessMessage('Estrutura gerada com sucesso!')

      // Recarregar atividades
      const frenteId = frenteSelecionada
      setTimeout(() => {
        setFrenteSelecionada('')
        setTimeout(() => {
          setFrenteSelecionada(frenteId)
        }, 100)
      }, 500)
    } catch (err) {
      console.error('Erro ao gerar estrutura:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar estrutura')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAtualizarEstrutura = async () => {
    if (!cursoSelecionado || !frenteSelecionada) {
      setError('Selecione curso e frente para atualizar a estrutura')
      return
    }

    try {
      setIsUpdatingEstrutura(true)
      setError(null)
      const response = await fetchWithAuth('/api/atividade/gerar-estrutura', {
        method: 'POST',
        body: JSON.stringify({
          curso_id: cursoSelecionado,
          frente_id: frenteSelecionada,
          force: true,
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao atualizar estrutura')
      }

      const frenteId = frenteSelecionada
      setFrenteSelecionada('')
      setTimeout(() => {
        setFrenteSelecionada(frenteId)
      }, 100)
      setSuccessMessage('Estrutura atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao atualizar estrutura:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estrutura de atividades')
    } finally {
      setIsUpdatingEstrutura(false)
    }
  }

  const handleCreateRegra = async (payload: {
    tipoAtividade: TipoAtividade
    nomePadrao: string
    frequenciaModulos: number
    comecarNoModulo: number
    acumulativo: boolean
    acumulativoDesdeInicio?: boolean
    gerarNoUltimo: boolean
  }) => {
    if (!cursoSelecionado) {
      setError('Selecione um curso para criar regras')
      return
    }

    try {
      const response = await fetchWithAuth('/api/regras-atividades', {
        method: 'POST',
        body: JSON.stringify({
          curso_id: cursoSelecionado,
          tipo_atividade: payload.tipoAtividade,
          nome_padrao: payload.nomePadrao,
          frequencia_modulos: payload.frequenciaModulos,
          comecar_no_modulo: payload.comecarNoModulo,
          acumulativo: payload.acumulativo,
          acumulativo_desde_inicio: payload.acumulativoDesdeInicio,
          gerar_no_ultimo: payload.gerarNoUltimo,
        }),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao criar regra')
      }

      setRegras((prev) => [...prev, body.data])
    } catch (err) {
      console.error('Erro ao criar regra:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar regra de atividade')
    }
  }

  const handleDeleteRegra = async (regraId: string) => {
    try {
      const response = await fetchWithAuth(`/api/regras-atividades/${regraId}`, {
        method: 'DELETE',
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        // Se já não existe no backend, removemos localmente para evitar bloqueio da UX
        if (response.status === 404 || `${body?.error || ''}`.toLowerCase().includes('não encontrada')) {
          setRegras((prev) => prev.filter((regra) => regra.id !== regraId))
          setSuccessMessage('Regra já estava ausente e foi removida da lista local.')
          return
        }
        throw new Error(body?.error || 'Erro ao remover regra')
      }

      setRegras((prev) => prev.filter((regra) => regra.id !== regraId))
      setSuccessMessage('Regra removida com sucesso.')
    } catch (err) {
      console.error('Erro ao remover regra:', err)
      setError(err instanceof Error ? err.message : 'Erro ao remover regra')
    }
  }

  const handleUploadSuccess = () => {
    // Recarregar atividades após upload
    const frenteId = frenteSelecionada
    setFrenteSelecionada('')
    setTimeout(() => {
      setFrenteSelecionada(frenteId)
    }, 100)
  }

  const handleFrenteChange = (frenteId: string) => {
    setFrenteSelecionada(frenteId)
    const frente = frentes.find((f) => f.id === frenteId)
    setFrenteCursoId(frente?.curso_id ?? null)
  }


  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-title">Gestão de Materiais</h1>
        <p className="page-subtitle">
          Gerencie materiais complementares (listas, simulados, conceituários) para os módulos das
          aulas
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-500">
          <CardContent className="flex items-center justify-center">
            <div className="flex items-center justify-center gap-2 text-center text-green-600 dark:text-green-400">
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <MaterialsFilters
        cursos={cursos}
        disciplinas={disciplinas}
        frentes={frentes}
        cursoSelecionado={cursoSelecionado}
        disciplinaSelecionada={disciplinaSelecionada}
        frenteSelecionada={frenteSelecionada}
        onCursoChange={setCursoSelecionado}
        onDisciplinaChange={setDisciplinaSelecionada}
        onFrenteChange={handleFrenteChange}
        onGenerateStructure={handleGenerateStructure}
        isGenerating={isGenerating}
        isLoadingFrentes={isLoadingFrentes}
      />

      {cursoSelecionado && frenteSelecionada && (
        <RulesPanel
          cursoSelecionado={cursoSelecionado}
          frenteSelecionada={frenteSelecionada}
          regras={regras}
          onCreate={handleCreateRegra}
          onDelete={handleDeleteRegra}
          onGerarEstrutura={handleGenerateStructure}
          isGenerating={isGenerating}
          onAtualizarEstrutura={handleAtualizarEstrutura}
          isUpdating={isUpdatingEstrutura}
        />
      )}

      {isLoadingAtividades && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingAtividades && frenteSelecionada && modulosComAtividades.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum conteúdo encontrado</CardTitle>
            <CardDescription>
              Clique em &quot;Gerar Estrutura&quot; para criar os slots de atividades automaticamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoadingAtividades && modulosComAtividades.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais por Módulo</CardTitle>
              <CardDescription>
                Faça upload dos PDFs para completar cada atividade. O progresso é salvo
                automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {modulosComAtividades.map((modulo) => (
                  <ModuleAccordion
                    key={modulo.id}
                    modulo={modulo}
                    onActivityUploadSuccess={handleUploadSuccess}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}



