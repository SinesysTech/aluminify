'use client'

import React from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, RefreshCcw, BrainCircuit, Target, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  { id: 'mais_cobrados', title: '🔥 Mais Cobrados', desc: 'Foco no que cai na prova' },
  { id: 'revisao_geral', title: '🧠 Revisão Geral', desc: 'Conteúdo misto' },
  { id: 'mais_errados', title: '🚑 UTI dos Erros', desc: 'Foco nas dificuldades' },
  { id: 'personalizado', title: '🎯 Personalizado', desc: 'Escolha curso, frente e módulo' },
]

export default function FlashcardsClient() {
  const supabase = createClient()
  const [modo, setModo] = React.useState<string | null>(null)
  const [cards, setCards] = React.useState<Flashcard[]>([])
  const [idx, setIdx] = React.useState(0)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
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
  
  const current = cards[idx]
  const progresso = cards.length > 0 ? ((idx + 1) / cards.length) * 100 : 0

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
    async (modoSelecionado: string, cursoId?: string, frenteId?: string, moduloId?: string) => {
      try {
        setLoading(true)
        setError(null)
        setShowAnswer(false)
        setIdx(0)
        
        let url = `/api/flashcards/revisao?modo=${modoSelecionado}`
        if (cursoId) url += `&cursoId=${cursoId}`
        if (frenteId) url += `&frenteId=${frenteId}`
        if (moduloId) url += `&moduloId=${moduloId}`
        
        const res = await fetchWithAuth(url)
        const body = await res.json()
        if (!res.ok) {
          throw new Error(body?.error || 'Não foi possível carregar os flashcards')
        }
        setCards(body.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar flashcards')
      } finally {
        setLoading(false)
      }
    },
    [fetchWithAuth],
  )

  // Carregar cursos (diferente para alunos e professores)
  React.useEffect(() => {
    const loadCursos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Verificar se é professor
        const { data: professorData } = await supabase
          .from('professores')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        const isProfessor = !!professorData
        const role = (user.user_metadata?.role as string) || 'aluno'
        const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true

        let cursosData: Curso[] = []

        if (isProfessor || isSuperAdmin) {
          // Professores: buscar cursos criados por eles (ou todos se superadmin)
          let query = supabase
            .from('cursos')
            .select('id, nome')
            .order('nome', { ascending: true })

          if (!isSuperAdmin) {
            query = query.eq('created_by', user.id)
          }

          const { data: cursos, error } = await query

          if (error) throw error

          cursosData = (cursos || []).map((c) => ({ id: c.id, nome: c.nome }))
        } else {
          // Alunos: buscar cursos através de alunos_cursos
          const { data: alunosCursos, error } = await supabase
            .from('alunos_cursos')
            .select('curso_id, cursos(id, nome)')
            .eq('aluno_id', user.id)

          if (error) throw error

          if (alunosCursos) {
            cursosData = alunosCursos
              .map((ac: any) => ac.cursos)
              .filter(Boolean)
              .map((c: any) => ({ id: c.id, nome: c.nome }))
          }
        }

        setCursos(cursosData)
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
        setError('Erro ao carregar cursos. Tente recarregar a página.')
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

            if (error) throw error

            if (cursosDisciplinas) {
              const disciplinasData = cursosDisciplinas
                .map((cd: any) => cd.disciplina)
                .filter(Boolean)
                .map((d: any) => ({ id: d.id, nome: d.nome }))
              
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

        if (error) {
          console.error('Erro na query de frentes:', error)
          throw error
        }

        console.log('Frentes carregadas:', frentesData?.length || 0, frentesData)
        setFrentes((frentesData || []).map((f) => ({ id: f.id, nome: f.nome, disciplina_id: f.disciplina_id })))
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

        if (error) throw error

        setModulos(modulosData || [])
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
      fetchCards(id)
    } else {
      // Resetar cards quando selecionar modo personalizado
      setCards([])
      setIdx(0)
    }
  }

  const handleBuscarPersonalizado = () => {
    if (!cursoSelecionado || !disciplinaSelecionada || !frenteSelecionada || !moduloSelecionado) {
      setError('Selecione curso, disciplina, frente e módulo para buscar flashcards')
      return
    }
    fetchCards('personalizado', cursoSelecionado, frenteSelecionada, moduloSelecionado)
  }

  const handleFeedback = async (feedback: number) => {
    if (!current) return
    try {
      await fetchWithAuth('/api/flashcards/feedback', {
        method: 'POST',
        body: JSON.stringify({ cardId: current.id, feedback }),
      })
    } catch (err) {
      console.error('Erro ao enviar feedback', err)
    } finally {
      // Avançar para próximo
      if (idx + 1 < cards.length) {
        setIdx(idx + 1)
        setShowAnswer(false)
      } else {
        setCards([])
      }
    }
  }

  const handleReload = () => {
    if (modo) fetchCards(modo)
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

      {/* Modo de seleção */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MODOS.map((m) => (
          <Card
            key={m.id}
            className={`cursor-pointer transition hover:border-primary ${modo === m.id ? 'border-primary shadow-md' : ''}`}
            onClick={() => handleSelectModo(m.id)}
          >
            <CardHeader>
              <CardTitle>{m.title}</CardTitle>
              <CardDescription>{m.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

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
                  value={cursoSelecionado}
                  onValueChange={setCursoSelecionado}
                  disabled={loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disciplina *</Label>
                <Select
                  value={disciplinaSelecionada}
                  onValueChange={setDisciplinaSelecionada}
                  disabled={!cursoSelecionado || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frente *</Label>
                <Select
                  value={frenteSelecionada}
                  onValueChange={setFrenteSelecionada}
                  disabled={!disciplinaSelecionada || !cursoSelecionado || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma frente" />
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
                  value={moduloSelecionado}
                  onValueChange={setModuloSelecionado}
                  disabled={!frenteSelecionada || loadingFiltros}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um módulo" />
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando flashcards...
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

      {current && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrainCircuit className="h-4 w-4" />
              {modo === 'mais_cobrados' && 'Foco: importância Alta'}
              {modo === 'mais_errados' && 'Foco: dificuldades e baixo aproveitamento'}
              {modo === 'revisao_geral' && 'Foco: revisão mista'}
              {modo === 'personalizado' && 'Foco: módulo selecionado'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {idx + 1} / {cards.length}
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
                      O modo "Mais Cobrados" prioriza flashcards de módulos com importância <strong>Alta</strong>.
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
            <CardContent className="p-8 text-center space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              variant="destructive" 
              onClick={() => handleFeedback(1)}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-2xl">🔴</span>
              <span className="text-sm font-medium">Errei o item</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleFeedback(2)}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-2xl">🟠</span>
              <span className="text-sm font-medium">Acertei parcialmente</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleFeedback(3)}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-2xl">🔵</span>
              <span className="text-sm font-medium">Acertei com dificuldade</span>
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleFeedback(4)}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-2xl">🟢</span>
              <span className="text-sm font-medium">Acertei com facilidade</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
