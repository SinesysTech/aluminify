'use client'

import React from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle,
  Loader2,
  RefreshCcw,
  BrainCircuit,
  Target,
  Info,
  XCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import { FlashcardSessionSummary } from '@/components/aluno/flashcard-session-summary'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CardSkeleton } from '@/components/ui/card-skeleton'

type Flashcard = {
  id: string
  pergunta: string
  resposta: string
  importancia?: string | null
}

type Curso = {
  id: string
  nome: string
}

type Disciplina = {
  id: string
  nome: string
}

type Frente = {
  id: string
  nome: string
  disciplina_id: string
}

type Modulo = {
  id: string
  nome: string
  numero_modulo: number | null
  frente_id: string
}

const MODOS = [
  {
    id: 'mais_cobrados',
    title: '🔥 Mais Cobrados',
    desc: 'Foco no que mais cai nas provas',
    tooltip: [
      'Gera flashcards a partir dos conteúdos/tópicos com maior recorrência em provas.',
      'Ideal para priorizar estudo com maior retorno.',
    ],
  },
  {
    id: 'conteudos_basicos',
    title: '📚 Conteúdos Básicos',
    desc: 'Revisão do essencial',
    tooltip: [
      'Gera flashcards sortidos a partir de módulos marcados como "Base".',
      'Ideal para revisar fundamentos e pontos recorrentes da prova.',
    ],
  },
  {
    id: 'revisao_geral',
    title: '🧠 Revisão Geral',
    desc: 'Conteúdo misto',
    tooltip: [
      'Gera flashcards variados para uma revisão ampla.',
      'Bom para manter o conteúdo “em dia” e reforçar memória de longo prazo.',
    ],
  },
  {
    id: 'mais_errados',
    title: '🚑 UTI dos Erros',
    desc: 'Foco nas dificuldades',
    tooltip: [
      'Gera flashcards priorizando os pontos onde você costuma ter mais dificuldade (ex.: erros e baixo desempenho).',
      'Ideal para corrigir fraquezas.',
    ],
  },
  {
    id: 'personalizado',
    title: '🎯 Personalizado',
    desc: 'Escolha curso, frente e módulo',
    tooltip: [
      'Você escolhe exatamente o recorte (curso, disciplina, frente e módulo).',
      'Assim você revisa flashcards específicos daquele conteúdo.',
    ],
  },
]

export default function FlashcardsClient() {
  const supabase = createClient()
  const [modo, setModo] = React.useState<string | null>(null)
  const [scope, setScope] = React.useState<'all' | 'completed'>('all')
  const [cards, setCards] = React.useState<Flashcard[]>([])
  const [idx, setIdx] = React.useState(0)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const didMountRef = React.useRef(false)
  
  // Estados para modo personalizado
  const [cursos, setCursos] = React.useState<Curso[]>([])
  const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
  const [frentes, setFrentes] = React.useState<Frente[]>([])
  const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')
  const [modulos, setModulos] = React.useState<Modulo[]>([])
  const [moduloSelecionado, setModuloSelecionado] = React.useState<string>('')
  const [loadingFiltros, setLoadingFiltros] = React.useState(false)
  const [loadingCursos, setLoadingCursos] = React.useState(true)
  
  // Estados para rastreamento de sessão
  const [cardsVistos, setCardsVistos] = React.useState<Set<string>>(new Set())
  const [feedbacks, setFeedbacks] = React.useState<number[]>([])
  const [sessaoCompleta, setSessaoCompleta] = React.useState(false)
  
  const current = cards[idx]
  const SESSION_SIZE = 10
  const progresso = cards.length > 0 ? ((idx + 1) / SESSION_SIZE) * 100 : 0

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

  const fetchCards = React.useCallback(
    async (modoSelecionado: string, cursoId?: string, frenteId?: string, moduloId?: string, resetSession = false) => {
      try {
        setLoading(true)
        setError(null)
        setShowAnswer(false)
        
        if (resetSession) {
          setIdx(0)
          setCardsVistos(new Set())
          setFeedbacks([])
          setSessaoCompleta(false)
        }
        
        // Construir URL com excludeIds
        let url = `/api/flashcards/revisao?modo=${modoSelecionado}&scope=${scope}`
        if (cursoId) url += `&cursoId=${cursoId}`
        if (frenteId) url += `&frenteId=${frenteId}`
        if (moduloId) url += `&moduloId=${moduloId}`
        
        // Adicionar IDs já vistos na sessão
        if (cardsVistos.size > 0 && !resetSession) {
          const excludeIds = Array.from(cardsVistos).join(',')
          url += `&excludeIds=${excludeIds}`
        }
        
        const res = await fetchWithAuth(url)
        const body = await res.json()
        if (!res.ok) {
          throw new Error(body?.error || 'Não foi possível carregar os flashcards')
        }
        
        const newCards = body.data || []
        setCards(newCards)
        
        // Se resetou, garantir que idx está em 0
        if (resetSession) {
          setIdx(0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar flashcards')
      } finally {
        setLoading(false)
      }
    },
    [fetchWithAuth, cardsVistos, scope],
  )

  // Auto-refresh ao trocar escopo (usa o scope atualizado, evitando corrida com setState)
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    if (!modo || modo === 'personalizado') return
    fetchCards(modo, undefined, undefined, undefined, true)
  }, [scope, modo, fetchCards])

  // Carregar cursos (diferente para alunos e professores)
  React.useEffect(() => {
    console.log('[flashcards] useEffect executado - iniciando loadCursos')
    const loadCursos = async () => {
      try {
        console.log('[flashcards] loadCursos iniciado')
        setLoadingCursos(true)
        const { data: { user } } = await supabase.auth.getUser()
        console.log('[flashcards] Usuário obtido:', user?.id || 'null')
        if (!user) {
          console.warn('[flashcards] Usuário não encontrado')
          setLoadingCursos(false)
          return
        }

        // Verificar se é professor
        const { data: professorData } = await supabase
          .from('professores')
          .select('id')
          .eq('id', user.id)
          .maybeSingle<{ id: string }>()

        const isProfessor = !!professorData
        const role = (user.user_metadata?.role as string) || 'aluno'
        const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true

        console.log('[flashcards] Verificação de role - isProfessor:', isProfessor, 'role:', role, 'isSuperAdmin:', isSuperAdmin)

        let cursosData: Curso[] = []

        if (isProfessor || isSuperAdmin) {
          // Professores: buscar TODOS os cursos (mesmo padrão da sala de estudos e backend)
          console.log('[flashcards] Usuário é professor/superadmin. Buscando TODOS os cursos.')
          const { data: cursos, error } = await supabase
            .from('cursos')
            .select('id, nome')
            .order('nome', { ascending: true })
            .returns<Curso[]>()

          if (error) {
            console.error('[flashcards] Erro ao buscar cursos (professor):', error)
            throw error
          }

          console.log('[flashcards] Cursos encontrados (professor):', cursos?.length || 0)
          cursosData = (cursos || []).map((c) => ({ id: c.id, nome: c.nome }))
        } else {
          // Alunos: buscar cursos através de alunos_cursos
          console.log('[flashcards] Carregando cursos para aluno:', user.id)
          console.log('[flashcards] Role detectado:', role)
          
          try {
            // Primeiro, buscar os curso_ids de alunos_cursos (sem relacionamento para evitar problemas de RLS)
            const { data: alunosCursos, error: alunosCursosError } = await supabase
              .from('alunos_cursos')
              .select('curso_id')
              .eq('aluno_id', user.id)
              .returns<Array<{ curso_id: string }>>()

            if (alunosCursosError) {
              console.error('[flashcards] Erro ao buscar alunos_cursos:', {
                message: alunosCursosError.message,
                details: alunosCursosError.details,
                hint: alunosCursosError.hint,
                code: alunosCursosError.code,
              })
              throw alunosCursosError
            }

            console.log('[flashcards] alunosCursos retornado:', alunosCursos)
            console.log('[flashcards] Número de registros:', alunosCursos?.length || 0)

            if (alunosCursos && alunosCursos.length > 0) {
              // Extrair os curso_ids
              const cursoIds = alunosCursos.map((ac: { curso_id: string }) => ac.curso_id)
              console.log('[flashcards] cursoIds extraídos:', cursoIds)

              // Agora buscar os cursos separadamente (a política de cursos é pública para leitura)
              const { data: cursos, error: cursosError } = await supabase
                .from('cursos')
                .select('id, nome')
                .in('id', cursoIds)
                .order('nome', { ascending: true })
                .returns<Curso[]>()

              if (cursosError) {
                console.error('[flashcards] Erro ao buscar cursos:', {
                  message: cursosError.message,
                  details: cursosError.details,
                  hint: cursosError.hint,
                  code: cursosError.code,
                })
                throw cursosError
              }

              console.log('[flashcards] Cursos encontrados:', cursos?.length || 0)
              cursosData = (cursos || []).map((c) => ({ id: c.id, nome: c.nome }))
              console.log('[flashcards] cursosData processado:', cursosData)
            } else {
              console.warn('[flashcards] Nenhum registro em alunos_cursos encontrado')
            }
          } catch (queryError: unknown) {
            const error = queryError as { message?: string; details?: string; hint?: string; code?: string; stack?: string }
            console.error('[flashcards] Erro detalhado na query:', {
              message: error?.message,
              details: error?.details,
              hint: error?.hint,
              code: error?.code,
              stack: error?.stack,
            })
            throw queryError
          }
        }

        console.log('[flashcards] Total de cursos carregados:', cursosData.length)
        setCursos(cursosData)
      } catch (err: unknown) {
        const error = err as { message?: string; details?: string; hint?: string; code?: string; stack?: string }
        console.error('Erro ao carregar cursos:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          stack: error?.stack,
        })
        const errorMessage = error?.message || error?.details || 'Erro ao carregar cursos. Tente recarregar a página.'
        setError(errorMessage)
      } finally {
        setLoadingCursos(false)
      }
    }

    loadCursos()
  }, [supabase])

  // Carregar disciplinas quando curso é selecionado
  React.useEffect(() => {
    if (!cursoSelecionado) {
      setDisciplinas([])
      setDisciplinaSelecionada('')
      return
    }

        const loadDisciplinas = async () => {
          try {
            setLoadingFiltros(true)
            const { data: cursosDisciplinas, error } = await supabase
              .from('cursos_disciplinas')
              .select('disciplina:disciplina_id ( id, nome )')
              .eq('curso_id', cursoSelecionado)
              .returns<Array<{ disciplina: { id: string; nome: string } | null }>>()

            if (error) throw error

            if (cursosDisciplinas) {
              const disciplinasData = cursosDisciplinas
                .map((cd) => cd.disciplina)
                .filter((d): d is { id: string; nome: string } => d !== null)
                .map((d) => ({ id: d.id, nome: d.nome }))
              
              // Remover duplicatas
              const unique = Array.from(new Map(disciplinasData.map((d) => [d.id, d])).values())
              setDisciplinas(unique)
            }
          } catch (err) {
            console.error('Erro ao carregar disciplinas:', err)
            setError('Erro ao carregar disciplinas. Tente novamente.')
          } finally {
            setLoadingFiltros(false)
          }
        }

    loadDisciplinas()
    setDisciplinaSelecionada('')
    setFrenteSelecionada('')
    setModuloSelecionado('')
  }, [cursoSelecionado, supabase])

  // Carregar frentes quando disciplina é selecionada
  React.useEffect(() => {
    if (!disciplinaSelecionada || !cursoSelecionado) {
      setFrentes([])
      setFrenteSelecionada('')
      return
    }

    const loadFrentes = async () => {
      try {
        setLoadingFiltros(true)
        // Buscar frentes da disciplina que pertencem ao curso selecionado
        const { data: frentesData, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, curso_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .eq('curso_id', cursoSelecionado)
          .order('nome', { ascending: true })
          .returns<Array<{ id: string; nome: string; disciplina_id: string | null; curso_id: string | null }>>()

        if (error) {
          console.error('Erro na query de frentes:', error)
          throw error
        }

        console.log('Frentes carregadas:', frentesData?.length || 0, frentesData)
        setFrentes(
          (frentesData ?? [])
            .filter(
              (f): f is { id: string; nome: string; disciplina_id: string; curso_id: string | null } =>
                f.disciplina_id !== null
            )
            .map((f) => ({ id: f.id, nome: f.nome, disciplina_id: f.disciplina_id }))
        )
      } catch (err) {
        console.error('Erro ao carregar frentes:', err)
        setError('Erro ao carregar frentes. Verifique se a disciplina e o curso estão corretos.')
      } finally {
        setLoadingFiltros(false)
      }
    }

    loadFrentes()
    setFrenteSelecionada('')
    setModuloSelecionado('')
  }, [disciplinaSelecionada, cursoSelecionado, supabase])

  // Carregar módulos quando frente é selecionada
  React.useEffect(() => {
    if (!frenteSelecionada || !cursoSelecionado) {
      setModulos([])
      setModuloSelecionado('')
      return
    }

    const loadModulos = async () => {
      try {
        setLoadingFiltros(true)
        const { data: modulosData, error } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id')
          .eq('frente_id', frenteSelecionada)
          .or(`curso_id.eq.${cursoSelecionado},curso_id.is.null`)
          .order('numero_modulo', { ascending: true, nullsFirst: false })
          .returns<Array<{ id: string; nome: string; numero_modulo: number | null; frente_id: string | null }>>()

        if (error) throw error

        setModulos(
          (modulosData ?? [])
            .filter(
              (m): m is { id: string; nome: string; numero_modulo: number | null; frente_id: string } =>
                m.frente_id !== null
            )
            .map((m) => ({ id: m.id, nome: m.nome, numero_modulo: m.numero_modulo, frente_id: m.frente_id }))
        )
      } catch (err) {
        console.error('Erro ao carregar módulos:', err)
      } finally {
        setLoadingFiltros(false)
      }
    }

    loadModulos()
    setModuloSelecionado('')
  }, [frenteSelecionada, cursoSelecionado, supabase])

  const handleSelectModo = (id: string) => {
    setModo(id)
    if (id !== 'personalizado') {
      fetchCards(id, undefined, undefined, undefined, true)
    } else {
      // Resetar cards quando selecionar modo personalizado
      setCards([])
      setIdx(0)
      setCardsVistos(new Set())
      setFeedbacks([])
      setSessaoCompleta(false)
    }
  }

  const handleBuscarPersonalizado = () => {
    if (!cursoSelecionado || !disciplinaSelecionada || !frenteSelecionada || !moduloSelecionado) {
      setError('Selecione curso, disciplina, frente e módulo para buscar flashcards')
      return
    }
    fetchCards('personalizado', cursoSelecionado, frenteSelecionada, moduloSelecionado, true)
  }

  const handleFeedback = async (feedback: number) => {
    if (!current) return
    
    // Adicionar card aos vistos e feedback à lista
    setCardsVistos((prev) => new Set([...prev, current.id]))
    setFeedbacks((prev) => [...prev, feedback])
    
    try {
      await fetchWithAuth('/api/flashcards/feedback', {
        method: 'POST',
        body: JSON.stringify({ cardId: current.id, feedback }),
      })
    } catch (err) {
      console.error('Erro ao enviar feedback', err)
    }
    
    // Verificar se completou a sessão (10 cards)
    const nextIdx = idx + 1
    if (nextIdx >= SESSION_SIZE || nextIdx >= cards.length) {
      // Sessão completa
      setSessaoCompleta(true)
    } else {
      // Avançar para próximo card
      setIdx(nextIdx)
      setShowAnswer(false)
    }
  }
  
  const handleFinishSession = () => {
    // Resetar tudo e voltar ao menu
    setModo(null)
    setCards([])
    setIdx(0)
    setCardsVistos(new Set())
    setFeedbacks([])
    setSessaoCompleta(false)
    setShowAnswer(false)
  }
  
  const handleStudyMore = () => {
    // Manter modo e filtros, mas resetar sessão
    if (modo === 'personalizado') {
      fetchCards('personalizado', cursoSelecionado, frenteSelecionada, moduloSelecionado, true)
    } else if (modo) {
      fetchCards(modo, undefined, undefined, undefined, true)
    }
  }

  const handleReload = () => {
    if (modo === 'personalizado') {
      fetchCards('personalizado', cursoSelecionado, frenteSelecionada, moduloSelecionado, true)
    } else if (modo) {
      fetchCards(modo, undefined, undefined, undefined, true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Flashcards
          <Badge variant="secondary">SRS</Badge>
        </h1>
        <p className="text-muted-foreground">Selecione o modo e revise com espaçamento inteligente.</p>
      </div>

      {/* Escopo da revisão */}
      <Card className="border-primary/70 bg-muted/25 shadow-lg">
        <CardContent className="px-4 md:px-6 py-0">
          <div className="grid gap-3 md:grid-cols-2 md:items-start">
            {/* Coluna esquerda: título + descrição */}
            <div className="space-y-1">
              <CardTitle>Fonte dos flashcards</CardTitle>
              <CardDescription>
                Escolha se a revisão considera todos os módulos do seu curso ou apenas os módulos concluídos.
              </CardDescription>
            </div>

            {/* Coluna direita: seletor */}
            <div className="space-y-2 md:justify-self-end md:w-full md:max-w-md">
              <Label>Gerar flashcards a partir de</Label>
              <div className="flex flex-col gap-2 rounded-md border bg-background/50 p-2">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={scope === 'all'}
                      onCheckedChange={(checked) => {
                        if (!checked) return
                        setScope('all')
                      }}
                      disabled={loading || modo === 'personalizado'}
                      aria-label="Todos os módulos do meu curso"
                    />
                    <span>Todos os módulos do meu curso</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={scope === 'completed'}
                      onCheckedChange={(checked) => {
                        if (!checked) return
                        setScope('completed')
                      }}
                      disabled={loading || modo === 'personalizado'}
                      aria-label="Apenas módulos concluídos"
                    />
                    <span>Apenas módulos concluídos</span>
                  </label>
                </div>
                {modo === 'personalizado' && (
                  <p className="text-xs text-muted-foreground">
                    No modo <strong>Personalizado</strong>, o escopo não se aplica (você escolhe um módulo específico).
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modo de seleção */}
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-4 md:grid-cols-2">
          {(() => {
            const byId = new Map(MODOS.map((m) => [m.id, m] as const))
            const renderCard = (modeId: string, className?: string) => {
              const m = byId.get(modeId)
              if (!m) return null

              return (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <Card
                      role="button"
                      tabIndex={0}
                      className={`cursor-pointer transition hover:border-primary ${className ?? ''} ${
                        modo === m.id ? 'border-primary shadow-md' : ''
                      }`}
                      onClick={() => handleSelectModo(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectModo(m.id)
                        }
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-center">
                          <span>{m.title}</span>
                          <span className="text-muted-foreground">
                            <Info className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </CardTitle>
                        <CardDescription className="text-center">{m.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs">
                    <div className="space-y-2 text-sm">
                      {m.tooltip.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <>
                {/* Linha 1 (destaque): UTI dos erros ocupa as 2 colunas */}
                {renderCard('mais_errados', 'md:col-span-2')}

                {/* Linha 2: Mais Cobrados + Conteúdos Básicos */}
                {renderCard('mais_cobrados')}
                {renderCard('conteudos_basicos')}

                {/* Linha 3: Personalizado + Revisão Geral */}
                {renderCard('personalizado')}
                {renderCard('revisao_geral')}
              </>
            )
          })()}
        </div>
      </TooltipProvider>

      {/* Filtros para modo personalizado */}
      {modo === 'personalizado' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Selecionar Flashcards
            </CardTitle>
            <CardDescription>
              Escolha o curso, disciplina, frente e módulo para revisar flashcards específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select
                  value={cursoSelecionado || undefined}
                  onValueChange={setCursoSelecionado}
                  disabled={loadingFiltros || loadingCursos}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        loadingCursos
                          ? 'Carregando cursos...'
                          : cursos.length === 0
                            ? 'Nenhum curso disponível'
                            : 'Selecione um curso'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCursos ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : cursos.length === 0 ? (
                      <SelectItem value="no-cursos" disabled>
                        Nenhum curso disponível
                      </SelectItem>
                    ) : (
                      cursos.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disciplina *</Label>
                <Select
                  value={disciplinaSelecionada || undefined}
                  onValueChange={setDisciplinaSelecionada}
                  disabled={!cursoSelecionado || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        loadingFiltros
                          ? 'Carregando...'
                          : !cursoSelecionado
                            ? 'Selecione um curso primeiro'
                            : 'Selecione uma disciplina'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.length === 0 && cursoSelecionado ? (
                      <SelectItem value="no-disciplinas" disabled>
                        Nenhuma disciplina encontrada
                      </SelectItem>
                    ) : (
                      disciplinas.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frente *</Label>
                <Select
                  value={frenteSelecionada || undefined}
                  onValueChange={setFrenteSelecionada}
                  disabled={!disciplinaSelecionada || !cursoSelecionado || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        loadingFiltros
                          ? 'Carregando...'
                          : !disciplinaSelecionada
                            ? 'Selecione uma disciplina primeiro'
                            : 'Selecione uma frente'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {frentes.length === 0 && disciplinaSelecionada ? (
                      <SelectItem value="no-frentes" disabled>
                        Nenhuma frente encontrada
                      </SelectItem>
                    ) : (
                      frentes.map((frente) => (
                        <SelectItem key={frente.id} value={frente.id}>
                          {frente.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Módulo *</Label>
                <Select
                  value={moduloSelecionado || undefined}
                  onValueChange={setModuloSelecionado}
                  disabled={!frenteSelecionada || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        loadingFiltros
                          ? 'Carregando...'
                          : !frenteSelecionada
                            ? 'Selecione uma frente primeiro'
                            : 'Selecione um módulo'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {modulos.length === 0 && frenteSelecionada ? (
                      <SelectItem value="no-modulos" disabled>
                        Nenhum módulo encontrado
                      </SelectItem>
                    ) : (
                      modulos.map((modulo) => (
                        <SelectItem key={modulo.id} value={modulo.id}>
                          {modulo.numero_modulo
                            ? `M${modulo.numero_modulo}: ${modulo.nome}`
                            : modulo.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleBuscarPersonalizado}
              disabled={!cursoSelecionado || !disciplinaSelecionada || !frenteSelecionada || !moduloSelecionado || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Buscar Flashcards
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado de carregamento/erro */}
      {loading && (
        <div className="space-y-4">
          <CardSkeleton count={3} />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Sessão de estudo */}
      {!loading && modo && cards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold">Nenhum card disponível agora.</p>
              <p className="text-sm text-muted-foreground">
                Tente outro modo ou volte mais tarde.
              </p>
            </div>
            <Button variant="outline" onClick={handleReload}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tela de Resumo da Sessão */}
      {sessaoCompleta && (
        <FlashcardSessionSummary
          feedbacks={feedbacks}
          onFinish={handleFinishSession}
          onStudyMore={handleStudyMore}
        />
      )}

      {/* Sessão de Estudo Ativa */}
      {current && !sessaoCompleta && (
        <div className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrainCircuit className="h-4 w-4" />
              {modo === 'mais_cobrados' && 'Foco: importância Alta'}
              {modo === 'conteudos_basicos' && 'Foco: módulos Base'}
              {modo === 'mais_errados' && 'Foco: dificuldades e baixo aproveitamento'}
              {modo === 'revisao_geral' && 'Foco: revisão mista'}
              {modo === 'personalizado' && 'Foco: módulo selecionado'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {idx + 1} / {SESSION_SIZE}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {current.importancia ? (
                        <>
                          Importância: {current.importancia}
                          <Info className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        'Importância: -'
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>Importância do Módulo:</strong> Indica a relevância do conteúdo.
                      <br />
                      <br />
                      <strong>Alta:</strong> Conteúdo mais cobrado nas provas
                      <br />
                      <strong>Média:</strong> Conteúdo de importância intermediária
                      <br />
                      <strong>Baixa:</strong> Conteúdo complementar
                      <br />
                      <strong>Base:</strong> Conteúdo fundamental (padrão)
                      <br />
                      <br />
                      O modo &quot;Mais Cobrados&quot; prioriza flashcards de módulos com importância <strong>Alta</strong>.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="sm" variant="outline" onClick={handleReload}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>
          </div>

          <Progress value={progresso} className="h-2" />

          <Card className="cursor-pointer border-primary/50" onClick={() => setShowAnswer(!showAnswer)}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Pergunta</div>
              <div className="text-xl font-semibold leading-relaxed whitespace-pre-line">{current.pergunta}</div>
              {showAnswer && (
                <>
                  <div className="border-t pt-4 text-xs uppercase tracking-wide text-muted-foreground">Resposta</div>
                  <div className="text-lg leading-relaxed whitespace-pre-line">{current.resposta}</div>
                </>
              )}
              {!showAnswer && (
                <div className="text-sm text-muted-foreground">Clique para ver a resposta</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-semibold text-foreground">Indique aqui o seu desempenho:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <Button 
                onClick={() => handleFeedback(1)}
                className="flex flex-col items-center gap-1 h-auto py-2 bg-status-error text-status-error-foreground shadow-lg transition hover:bg-status-error/90 hover:shadow-xl active:bg-status-error/80 active:shadow-md"
              >
                <XCircle className="h-6 w-6 drop-shadow-sm" />
                <span className="text-xs font-semibold">Errei o item</span>
              </Button>
              <Button 
                onClick={() => handleFeedback(2)}
                className="flex flex-col items-center gap-1 h-auto py-2 bg-status-warning text-status-warning-foreground shadow-lg transition hover:bg-status-warning/90 hover:shadow-xl active:bg-status-warning/80 active:shadow-md"
              >
                <AlertTriangle className="h-6 w-6 drop-shadow-sm" />
                <span className="text-xs font-semibold">Acertei parcialmente</span>
              </Button>
              <Button 
                onClick={() => handleFeedback(3)}
                className="flex flex-col items-center gap-1 h-auto py-2 bg-status-info text-status-info-foreground shadow-lg transition hover:bg-status-info/90 hover:shadow-xl active:bg-status-info/80 active:shadow-md"
              >
                <Lightbulb className="h-6 w-6 drop-shadow-sm" />
                <span className="text-xs font-semibold">Acertei com dificuldade</span>
              </Button>
              <Button 
                onClick={() => handleFeedback(4)}
                className="flex flex-col items-center gap-1 h-auto py-2 bg-status-success text-status-success-foreground shadow-lg transition hover:bg-status-success/90 hover:shadow-xl active:bg-status-success/80 active:shadow-md"
              >
                <CheckCircle2 className="h-6 w-6 drop-shadow-sm" />
                <span className="text-xs font-semibold">Acertei com facilidade</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
