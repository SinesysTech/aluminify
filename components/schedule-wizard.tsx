'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, X, AlertCircle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const wizardSchema = z.object({
  data_inicio: z.date({ message: 'Data de início é obrigatória' }),
  data_fim: z.date({ message: 'Data de término é obrigatória' }),
  dias_semana: z.number().min(1).max(7),
  horas_dia: z.number().min(1),
  ferias: z.array(z.object({
    inicio: z.date().optional(),
    fim: z.date().optional(),
  })).default([]),
  curso_alvo_id: z.string().optional(),
  disciplinas_ids: z.array(z.string()).min(1, 'Selecione pelo menos uma disciplina'),
  prioridade_minima: z.number().min(1).max(5),
  modalidade: z.enum(['paralelo', 'sequencial']),
  ordem_frentes_preferencia: z.array(z.string()).optional(),
  modulos_ids: z.array(z.string()).optional(),
  excluir_aulas_concluidas: z.boolean().optional(),
  nome: z.string().min(1, 'Nome do cronograma é obrigatório'),
  velocidade_reproducao: z.number().min(1.0).max(2.0).default(1.0),
}).refine((data) => data.data_fim > data.data_inicio, {
  message: 'Data de término deve ser posterior à data de início',
  path: ['data_fim'],
})

type WizardFormData = z.infer<typeof wizardSchema>

const STEPS = [
  { id: 1, title: 'Definições de Tempo' },
  { id: 2, title: 'Disciplinas e Módulos' },
  { id: 3, title: 'Modalidade' },
  { id: 4, title: 'Estratégia de Estudo' },
  { id: 5, title: 'Revisão e Geração' },
]

const MODALIDADES = [
  {
    nivel: 1,
    label: 'Super Extensivo',
    descricao: 'Aprofundamento Total',
    texto: 'Domine a física de ponta a ponta. Do zero ao nível mais avançado, com todos os aprofundamentos possíveis. Perfeito para cursos de alta concorrência e provas específicas que exigem o máximo de detalhe.',
    tempo: '⏱️ Recomendado para: +12 meses de estudo.'
  },
  {
    nivel: 2,
    label: 'Extensivo',
    descricao: 'O Mais Popular',
    texto: 'A preparação completa para 99% dos vestibulares. Cobre todo o edital do ENEM, FUVEST, UNICAMP e UERJ, filtrando apenas excessos desnecessários. É a rota segura para a aprovação.',
    tempo: '⏱️ Recomendado para: 9 a 12 meses de estudo.'
  },
  {
    nivel: 3,
    label: 'Semi Extensivo',
    descricao: 'Otimizado',
    texto: 'Todo o conteúdo, sem enrolação. Mantemos a jornada do básico ao avançado, mas focamos nos aprofundamentos e exercícios que realmente fazem a diferença na nota. Eficiência máxima.',
    tempo: '⏱️ Recomendado para: 6 a 9 meses de estudo.'
  },
  {
    nivel: 4,
    label: 'Intensivo',
    descricao: 'Foco no que Cai',
    texto: 'Não perca tempo. Priorizamos os assuntos com maior recorrência histórica nas provas. Você verá do básico ao avançado apenas no que tem alta probabilidade de cair.',
    tempo: '⏱️ Recomendado para: 3 a 6 meses de estudo.'
  },
  {
    nivel: 5,
    label: 'Superintensivo',
    descricao: 'Reta Final',
    texto: 'A base sólida para salvar seu ano. O mínimo conteúdo viável (MCV) e essencial condensado para dar segurança nas questões fáceis e médias. É o "kit de sobrevivência" para quem tem pouco tempo.',
    tempo: '⏱️ Recomendado para: 1 a 3 meses de estudo.'
  },
]

const TEMPO_PADRAO_MINUTOS = 10
const FATOR_MULTIPLICADOR = 1.5

type ModalidadeStats = {
  tempoAulaMinutos: number
  tempoEstudoMinutos: number
  totalAulas: number
}

type ModuloResumo = {
  id: string
  nome: string
  numero_modulo: number | null
  totalAulas: number
  tempoTotal: number
  concluidas: number
  importancia?: 'Alta' | 'Media' | 'Baixa' | 'Base' | null
}

type FrenteResumo = {
  id: string
  nome: string
  modulos: ModuloResumo[]
}

// Types for state data
interface CursoData {
  id: string
  nome: string
  [key: string]: unknown
}

interface DisciplinaData {
  id: string
  nome: string
  [key: string]: unknown
}

interface FrenteData {
  id: string
  nome: string
  disciplina_id: string
  [key: string]: unknown
}

const formatHorasFromMinutes = (minutos?: number) => {
  if (!minutos || minutos <= 0) {
    return '--'
  }

  const horas = minutos / 60
  const isInt = Number.isInteger(horas)

  return `${horas.toLocaleString('pt-BR', {
    minimumFractionDigits: isInt ? 0 : 1,
    maximumFractionDigits: 1,
  })}h`
}

// Função para calcular semanas disponibilizadas (período entre data início e fim, descontando férias)
const calcularSemanasDisponibilizadas = (
  dataInicio: Date | undefined,
  dataFim: Date | undefined,
  ferias: Array<{ inicio?: Date; fim?: Date }>,
): number => {
  if (!dataInicio || !dataFim) return 0

  const inicio = new Date(dataInicio)
  let semanas = 0

  while (inicio <= dataFim) {
    const fimSemana = new Date(inicio)
    fimSemana.setDate(fimSemana.getDate() + 6) // 7 dias (0-6)

    // Verificar se a semana cai em período de férias
    let isFerias = false
    for (const periodo of ferias || []) {
      if (!periodo.inicio || !periodo.fim) continue
      const inicioFerias = new Date(periodo.inicio)
      const fimFerias = new Date(periodo.fim)
      if (
        (inicio >= inicioFerias && inicio <= fimFerias) ||
        (fimSemana >= inicioFerias && fimSemana <= fimFerias) ||
        (inicio <= inicioFerias && fimSemana >= fimFerias)
      ) {
        isFerias = true
        break
      }
    }

    if (!isFerias) {
      semanas++
    }

    inicio.setDate(inicio.getDate() + 7)
  }

  return semanas
}

// Função para calcular semanas necessárias do cronograma (baseado no conteúdo selecionado e tempo necessário)
const calcularSemanasCronograma = (
  modalidadeStats: Record<number, ModalidadeStats>,
  prioridadeMinima: number,
  velocidadeReproducao: number,
  horasDia: number,
  diasSemana: number,
): number => {
  const stats = modalidadeStats[prioridadeMinima]
  if (!stats) return 0

  // Tempo de aula ajustado pela velocidade
  const tempoAulaAjustadoMinutos = stats.tempoAulaMinutos / velocidadeReproducao
  // Tempo de estudo = tempo de aula ajustado * (FATOR_MULTIPLICADOR - 1)
  const tempoEstudoAjustadoMinutos = tempoAulaAjustadoMinutos * (FATOR_MULTIPLICADOR - 1)
  // Tempo total necessário em minutos
  const tempoTotalMinutos = tempoAulaAjustadoMinutos + tempoEstudoAjustadoMinutos

  // Capacidade por semana em minutos
  const capacidadeSemanaMinutos = horasDia * diasSemana * 60

  if (capacidadeSemanaMinutos <= 0) return 0

  // Calcular semanas necessárias (arredondar para cima)
  const semanasNecessarias = Math.ceil(tempoTotalMinutos / capacidadeSemanaMinutos)

  return semanasNecessarias
}

export function ScheduleWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursos, setCursos] = useState<CursoData[]>([])
  const [disciplinasDoCurso, setDisciplinasDoCurso] = useState<DisciplinaData[]>([]) // Disciplinas do curso selecionado
  const [frentes, setFrentes] = useState<FrenteData[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showTempoInsuficienteDialog, setShowTempoInsuficienteDialog] = useState(false)
  const [tempoInsuficienteDetalhes, setTempoInsuficienteDetalhes] = useState<{
    horasNecessarias: number
    horasDisponiveis: number
    horasDiaNecessarias: number
  } | null>(null)
  const [modalidadeStats, setModalidadeStats] = useState<Record<number, ModalidadeStats>>({})
  const [modalidadeStatsLoading, setModalidadeStatsLoading] = useState(false)
  const [modalidadeStatsError, setModalidadeStatsError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [modulosCurso, setModulosCurso] = useState<FrenteResumo[]>([])
  const [modulosCursoAgrupadosPorDisciplina, setModulosCursoAgrupadosPorDisciplina] = useState<Record<string, { disciplinaNome: string; frentes: FrenteResumo[] }>>({})
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([])
  const [modulosLoading, setModulosLoading] = useState(false)
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0)

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      dias_semana: 3,
      horas_dia: 2,
      prioridade_minima: 2, // Extensivo
      modalidade: 'paralelo',
      disciplinas_ids: [],
      ferias: [],
      modulos_ids: [],
      excluir_aulas_concluidas: true,
      velocidade_reproducao: 1.0,
    },
  })

  const cursoSelecionado = form.watch('curso_alvo_id')
  const cursoAtual = React.useMemo(
    () => cursos.find((curso) => curso.id === cursoSelecionado) ?? null,
    [cursos, cursoSelecionado],
  )

  // Carregar cursos e disciplinas
  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/professor/login')
        return
      }
      setUserId(user.id)

      // Verificar se o usuário é professor
      const { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (professorError) {
        console.error('Erro ao verificar se é professor:', professorError)
      }

      const isProfessor = !!professorData
      console.log(`Usuário ${user.id} é professor: ${isProfessor}`)

      // Buscar cursos: se for professor, buscar cursos que ele criou; se for aluno, buscar através de matrículas
      let cursosData: CursoData[] = []

      if (isProfessor) {
        // Professor vê todos os cursos disponíveis (os que ele criou + cursos sem created_by para testes)
        // Buscar cursos em duas queries para evitar problemas com RLS
        const [cursosDoProfessor, cursosSemCriador] = await Promise.all([
          supabase
            .from('cursos')
            .select('*')
            .eq('created_by', user.id)
            .order('nome', { ascending: true }),
          supabase
            .from('cursos')
            .select('*')
            .is('created_by', null)
            .order('nome', { ascending: true }),
        ])

        if (cursosDoProfessor.error) {
          console.error('Erro ao carregar cursos do professor:', cursosDoProfessor.error)
        }
        if (cursosSemCriador.error) {
          console.error('Erro ao carregar cursos sem criador:', cursosSemCriador.error)
        }

        // Combinar resultados e remover duplicatas
        const todosCursos = [
          ...(cursosDoProfessor.data || []),
          ...(cursosSemCriador.data || []),
        ]

        // Remover duplicatas por ID
        const cursosUnicos = Array.from(
          new Map(todosCursos.map((curso) => [curso.id, curso])).values()
        ).sort((a, b) => (a.nome as string).localeCompare(b.nome as string)) as CursoData[]

        cursosData = cursosUnicos
        console.log(`Professor ${user.id} encontrou ${cursosUnicos.length} curso(s):`, cursosUnicos.map((c) => c.nome))
      } else {
        // Aluno vê cursos através da tabela alunos_cursos
        const { data: alunosCursos, error: alunosCursosError } = await supabase
          .from('alunos_cursos')
          .select('curso_id, cursos(*)')
          .eq('aluno_id', user.id)

        if (alunosCursosError) {
          console.error('Erro ao carregar cursos do aluno:', alunosCursosError)
        }

        if (alunosCursos) {
          cursosData = alunosCursos.map((ac: { cursos: CursoData | null }) => ac.cursos).filter(Boolean) as CursoData[]
          console.log(`Aluno ${user.id} encontrou ${cursosData.length} curso(s):`, cursosData.map((c) => c?.nome))
        }
      }

      setCursos(cursosData)

      // Buscar todas as disciplinas
      const { data: disciplinasData } = await supabase
        .from('disciplinas')
        .select('*')
        .order('nome')

      if (disciplinasData) {
        setDisciplinas(disciplinasData)
      }

      setLoadingData(false)
    }

    loadData()
  }, [router])

  // Carregar disciplinas do curso selecionado
  React.useEffect(() => {
    async function loadDisciplinasDoCurso() {
      if (!cursoSelecionado) {
        setDisciplinasDoCurso([])
        form.setValue('disciplinas_ids', [])
        return
      }

      const supabase = createClient()
      try {
        // Buscar disciplinas do curso através da tabela cursos_disciplinas
        const { data: cursosDisciplinas, error: cdError } = await supabase
          .from('cursos_disciplinas')
          .select('disciplina_id')
          .eq('curso_id', cursoSelecionado)

        if (cdError) {
          console.error('Erro ao carregar disciplinas do curso:', cdError)
          setDisciplinasDoCurso([])
          form.setValue('disciplinas_ids', [])
          return
        }

        if (!cursosDisciplinas || cursosDisciplinas.length === 0) {
          setDisciplinasDoCurso([])
          form.setValue('disciplinas_ids', [])
          return
        }

        // Buscar detalhes das disciplinas
        const disciplinaIds = cursosDisciplinas.map((cd) => cd.disciplina_id)
        const { data: disciplinasData, error: discError } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .in('id', disciplinaIds)
          .order('nome', { ascending: true })

        if (discError) {
          console.error('Erro ao carregar detalhes das disciplinas:', discError)
          setDisciplinasDoCurso([])
          form.setValue('disciplinas_ids', [])
          return
        }

        setDisciplinasDoCurso(disciplinasData || [])

        // Se houver apenas uma disciplina, selecionar automaticamente
        if (disciplinasData && disciplinasData.length === 1) {
          form.setValue('disciplinas_ids', [disciplinasData[0].id])
        } else {
          // Se houver múltiplas, deixar o usuário escolher
          form.setValue('disciplinas_ids', [])
        }
      } catch (err) {
        console.error('Erro ao carregar disciplinas do curso:', err)
        setDisciplinasDoCurso([])
        form.setValue('disciplinas_ids', [])
      }
    }

    loadDisciplinasDoCurso()
  }, [cursoSelecionado, form])

  // Carregar frentes quando disciplinas são selecionadas (filtradas pelo curso também)
  const disciplinasIds = form.watch('disciplinas_ids');
  React.useEffect(() => {
    async function loadFrentes() {
      if (!disciplinasIds || disciplinasIds.length === 0 || !cursoSelecionado) {
        setFrentes([])
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('frentes')
        .select('*')
        .eq('curso_id', cursoSelecionado)
        .in('disciplina_id', disciplinasIds)
        .order('nome')

      if (data) {
        setFrentes(data.filter((f): f is typeof f & { disciplina_id: string } => !!f.disciplina_id))
      }
    }

    loadFrentes()
  }, [disciplinasIds, cursoSelecionado])

  const disciplinasIdsModulos = form.watch('disciplinas_ids');
  useEffect(() => {
    if (!cursoSelecionado || !userId) {
      setModulosCurso([])
      setModulosSelecionados([])
      setCompletedLessonsCount(0)
      return
    }

    if (!disciplinasIdsModulos || disciplinasIdsModulos.length === 0) {
      setModulosCurso([])
      setModulosSelecionados([])
      setCompletedLessonsCount(0)
      return
    }

    let cancelled = false

    const loadModulosDoCurso = async () => {
      setModulosLoading(true)
      const supabase = createClient()

      try {
        // Buscar frentes com informações da disciplina
        const { data: frentesData, error: frentesError } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, disciplinas(nome)')
          .eq('curso_id', cursoSelecionado)
          .in('disciplina_id', disciplinasIds)
          .order('nome', { ascending: true })

        if (frentesError) {
          console.error('Erro ao buscar frentes:', {
            message: frentesError.message,
            details: frentesError.details,
            hint: frentesError.hint,
            code: frentesError.code,
            cursoSelecionado,
            disciplinasIds,
          })
          throw frentesError
        }

        if (!frentesData || frentesData.length === 0) {
          console.log('Nenhuma frente encontrada para o curso e disciplinas selecionadas')
          setModulosCurso([])
          setModulosCursoAgrupadosPorDisciplina({})
          setModulosSelecionados([])
          setCompletedLessonsCount(0)
          setError(null)
          return
        }

        const frenteIds = frentesData.map((f: FrenteData) => f.id)

        // Buscar módulos das frentes
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id, importancia')
          .in('frente_id', frenteIds)
          .order('numero_modulo', { ascending: true })

        if (modulosError) {
          console.error('Erro ao buscar módulos:', {
            message: modulosError.message,
            details: modulosError.details,
            code: modulosError.code,
          })
          throw modulosError
        }

        if (!modulosData || modulosData.length === 0) {
          console.log('Nenhum módulo encontrado para as frentes')
          // Criar estrutura vazia com as frentes
          const arvore = frentesData.map((frente: FrenteData) => ({
            id: frente.id,
            nome: frente.nome,
            modulos: [],
          }))
          if (cancelled) {
            return
          }
          setModulosCurso(arvore)
          setModulosCursoAgrupadosPorDisciplina({})
          setModulosSelecionados([])
          setCompletedLessonsCount(0)
          setError(null)
          setModulosLoading(false)
          return
        }

        interface ModuloData {
          id: string;
          nome: string;
          numero_modulo: number | null;
          frente_id: string;
          importancia?: string | null;
          [key: string]: unknown;
        }
        const moduloIds = modulosData.map((m: ModuloData) => m.id)

        if (moduloIds.length === 0) {
          console.log('Nenhum ID de módulo válido encontrado')
          if (cancelled) {
            return
          }
          setModulosCurso([])
          setModulosCursoAgrupadosPorDisciplina({})
          setModulosSelecionados([])
          setCompletedLessonsCount(0)
          setError(null)
          setModulosLoading(false)
          return
        }

        // Buscar aulas dos módulos
        const { data: aulasData, error: aulasError } = await supabase
          .from('aulas')
          .select('id, modulo_id, tempo_estimado_minutos')
          .in('modulo_id', moduloIds)

        if (aulasError) {
          console.error('Erro ao buscar aulas:', {
            message: aulasError.message,
            details: aulasError.details,
            code: aulasError.code,
          })
          // Não falhar se não conseguir buscar aulas, apenas logar
          console.warn('Continuando sem dados de aulas')
        }

        // Buscar aulas concluídas (pode não existir a tabela, então tratar erro separadamente)
        let concluidasSet = new Set<string>()
        try {
          const { data: concluidasData, error: concluidasError } = await supabase
            .from('aulas_concluidas')
            .select('aula_id')
            .eq('aluno_id', userId)
            .eq('curso_id', cursoSelecionado)

          if (concluidasError) {
            // Se a tabela não existir ou houver erro, apenas logar e continuar
            console.warn('Aviso ao buscar aulas concluídas (pode não existir a tabela):', {
              message: concluidasError.message,
              details: concluidasError.details,
              code: concluidasError.code,
            })
          } else if (concluidasData) {
            concluidasSet = new Set(concluidasData.map((row) => row.aula_id as string))
          }
        } catch (concluidasErr: unknown) {
          // Se houver erro na tabela aulas_concluidas, apenas logar e continuar
          const error = concluidasErr as { message?: string; details?: string; code?: string };
          console.warn('Aviso: não foi possível buscar aulas concluídas:', {
            message: error?.message,
            details: error?.details,
            code: error?.code,
          })
        }

        // Agrupar módulos por frente
        const modulosPorFrente = new Map<string, ModuloData[]>()
        modulosData.forEach((modulo: ModuloData) => {
          if (!modulosPorFrente.has(modulo.frente_id)) {
            modulosPorFrente.set(modulo.frente_id, [])
          }
          modulosPorFrente.get(modulo.frente_id)!.push(modulo)
        })

        interface AulaData {
          id: string;
          nome: string;
          numero_aula: number | null;
          tempo_estimado_minutos: number | null;
          modulo_id: string;
          [key: string]: unknown;
        }
        // Agrupar aulas por módulo
        const aulasPorModulo = new Map<string, AulaData[]>()
        if (aulasData) {
          aulasData.forEach((aula: AulaData) => {
            if (!aulasPorModulo.has(aula.modulo_id)) {
              aulasPorModulo.set(aula.modulo_id, [])
            }
            aulasPorModulo.get(aula.modulo_id)!.push(aula)
          })
        }

        // Construir árvore de frentes > módulos > aulas
        const arvore = frentesData.map((frente: FrenteData) => {
          const modulos = (modulosPorFrente.get(frente.id) || []).map((modulo: ModuloData) => {
            const aulas = aulasPorModulo.get(modulo.id) || []
            const totalAulas = aulas.length
            const tempoTotal = aulas.reduce(
              (acc: number, aula: AulaData) => acc + (aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS),
              0,
            )
            const concluidas = aulas.filter((aula: AulaData) => concluidasSet.has(aula.id)).length

            return {
              id: modulo.id,
              nome: modulo.nome,
              numero_modulo: modulo.numero_modulo,
              totalAulas,
              tempoTotal,
              concluidas,
              importancia: modulo.importancia || null,
            }
          })

          return {
            id: frente.id,
            nome: frente.nome,
            modulos,
          }
        })

        if (cancelled) {
          return
        }

        // Log detalhado antes de filtrar
        console.log('[ScheduleWizard] Frentes ANTES do filtro de módulos:', arvore.map(f => ({
          frente_id: f.id,
          frente_nome: f.nome,
          total_modulos: f.modulos.length,
          modulo_ids: f.modulos.map((m) => m.id)
        })))

        // Filtrar frentes que têm pelo menos um módulo
        const arvoreComModulos = arvore.filter((frente) => frente.modulos.length > 0)

        // Log de frentes excluídas
        const frentesExcluidas = arvore.filter((frente) => frente.modulos.length === 0)
        if (frentesExcluidas.length > 0) {
          console.warn('[ScheduleWizard] ⚠️⚠️⚠️ Frentes EXCLUÍDAS por não terem módulos:', frentesExcluidas.map(f => ({
            frente_id: f.id,
            frente_nome: f.nome
          })))
        }

        console.log('[ScheduleWizard] Frentes DEPOIS do filtro de módulos:', arvoreComModulos.map(f => ({
          frente_id: f.id,
          frente_nome: f.nome,
          total_modulos: f.modulos.length
        })))

        // Agrupar por disciplina
        const agrupadosPorDisciplina: Record<string, { disciplinaNome: string; frentes: FrenteResumo[] }> = {}
        arvoreComModulos.forEach((frente) => {
          const frenteData = frentesData.find((f: FrenteData) => f.id === frente.id)
          const disciplinaId = frenteData?.disciplina_id
          const disciplinaNome = (frenteData as { disciplinas?: { nome?: string } })?.disciplinas?.nome || 'Sem disciplina'

          if (!agrupadosPorDisciplina[disciplinaId || 'sem-id']) {
            agrupadosPorDisciplina[disciplinaId || 'sem-id'] = {
              disciplinaNome,
              frentes: [],
            }
          }
          agrupadosPorDisciplina[disciplinaId || 'sem-id'].frentes.push(frente)
        })

        setModulosCurso(arvoreComModulos)
        setModulosCursoAgrupadosPorDisciplina(agrupadosPorDisciplina)
        const todosModulos = arvoreComModulos.flatMap((frente) => frente.modulos.map((modulo) => modulo.id))

        console.log('[ScheduleWizard] Total de módulos selecionados:', todosModulos.length)
        console.log('[ScheduleWizard] Módulos selecionados por frente:',
          arvoreComModulos.map(f => ({
            frente_id: f.id,
            frente_nome: f.nome,
            total_modulos: f.modulos.length,
            modulo_ids: f.modulos.map((m) => m.id)
          }))
        )

        setModulosSelecionados(todosModulos)
        setCompletedLessonsCount(concluidasSet.size)
        setError(null)
      } catch (err: unknown) {
        const error = err as { message?: string; details?: string; hint?: string; code?: string };
        console.error('Erro ao carregar módulos do curso:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          error: err,
          cursoSelecionado,
          disciplinasIds,
          userId,
          errorString: String(err),
          errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          errorType: typeof err,
          errorKeys: err && typeof err === 'object' ? Object.keys(err) : [],
        })
        if (!cancelled) {
          setError(`Não foi possível carregar os módulos deste curso. ${err?.message || 'Erro desconhecido'}`)
        }
      } finally {
        if (!cancelled) {
          setModulosLoading(false)
        }
      }
    }

    loadModulosDoCurso()

    return () => {
      cancelled = true
    }
  }, [cursoSelecionado, userId, disciplinasIds, disciplinasIdsModulos])

  useEffect(() => {
    form.setValue('modulos_ids', modulosSelecionados)
  }, [modulosSelecionados, form])

  React.useEffect(() => {
    const disciplinasSelecionadas = disciplinasIds

    if (!disciplinasSelecionadas || disciplinasSelecionadas.length === 0) {
      setModalidadeStats({})
      setModalidadeStatsError(null)
      setModalidadeStatsLoading(false)
      return
    }

    let cancelled = false

    const calcularEstimativas = async () => {
      setModalidadeStatsLoading(true)
      setModalidadeStatsError(null)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('aulas')
          .select(`
            id,
            tempo_estimado_minutos,
            prioridade,
            modulos!inner(
              id,
              frentes!inner(
                disciplina_id
              )
            )
          `)
          .in('modulos.frentes.disciplina_id', disciplinasSelecionadas)

        if (error) {
          throw error
        }

        const stats = MODALIDADES.reduce<Record<number, ModalidadeStats>>((acc, modalidade) => {
          acc[modalidade.nivel] = {
            tempoAulaMinutos: 0,
            tempoEstudoMinutos: 0,
            totalAulas: 0,
          }
          return acc
        }, {})

        data?.forEach((aula) => {
          const tempoAula = Math.max(aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS, 0)
          const prioridade = Number(aula.prioridade ?? 0)

          MODALIDADES.forEach(({ nivel }) => {
            if (prioridade >= nivel) {
              stats[nivel].tempoAulaMinutos += tempoAula
              stats[nivel].tempoEstudoMinutos += tempoAula * FATOR_MULTIPLICADOR
              stats[nivel].totalAulas += 1
            }
          })
        })

        if (!cancelled) {
          setModalidadeStats(stats)
        }
      } catch (err) {
        console.error('Erro ao calcular estimativas por modalidade:', err)
        if (!cancelled) {
          setModalidadeStats({})
          setModalidadeStatsError('Não foi possível calcular as estimativas no momento.')
        }
      } finally {
        if (!cancelled) {
          setModalidadeStatsLoading(false)
        }
      }
    }

    calcularEstimativas()

    return () => {
      cancelled = true
    }
  }, [disciplinasIds])

  const onSubmit = async (data: WizardFormData) => {
    // Validar que estamos no último step
    if (currentStep !== STEPS.length) {
      return
    }

    // Validar que o nome foi preenchido
    if (!data.nome || data.nome.trim().length === 0) {
      setError('Por favor, informe um nome para o cronograma')
      return
    }

    if (cursos.length > 0 && !data.curso_alvo_id) {
      setError('Selecione um curso antes de gerar o cronograma.')
      setCurrentStep(2)
      return
    }

    if (data.curso_alvo_id && modulosCurso.length > 0 && modulosSelecionados.length === 0) {
      setError('Selecione pelo menos um módulo do curso escolhido.')
      setCurrentStep(2)
      return
    }

    if (data.disciplinas_ids.length === 0) {
      setError('Selecione pelo menos uma disciplina antes de gerar o cronograma.')
      setCurrentStep(2)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const requestBody = {
        aluno_id: user.id,
        data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
        data_fim: format(data.data_fim, 'yyyy-MM-dd'),
        ferias: data.ferias.map((periodo) => ({
          inicio: periodo.inicio ? format(periodo.inicio, 'yyyy-MM-dd') : '',
          fim: periodo.fim ? format(periodo.fim, 'yyyy-MM-dd') : '',
        })),
        horas_dia: data.horas_dia,
        dias_semana: data.dias_semana,
        prioridade_minima: data.prioridade_minima,
        disciplinas_ids: data.disciplinas_ids,
        modalidade: data.modalidade,
        curso_alvo_id: data.curso_alvo_id,
        nome: data.nome.trim(), // Garantir que não há espaços extras
        ordem_frentes_preferencia: data.ordem_frentes_preferencia,
        modulos_ids: data.modulos_ids && data.modulos_ids.length > 0 ? data.modulos_ids : undefined,
        excluir_aulas_concluidas: data.excluir_aulas_concluidas ?? true,
        velocidade_reproducao: data.velocidade_reproducao ?? 1.0,
      }

      // Log detalhado dos módulos sendo enviados
      console.log('[ScheduleWizard] ========== ENVIANDO PARA API ==========')
      console.log('[ScheduleWizard] Disciplinas selecionadas:', data.disciplinas_ids)
      console.log('[ScheduleWizard] Total de módulos selecionados:', data.modulos_ids?.length || 0)
      console.log('[ScheduleWizard] Módulos selecionados (primeiros 20):', data.modulos_ids?.slice(0, 20))

      // Verificar módulos por frente
      if (modulosCurso.length > 0 && data.modulos_ids) {
        const modulosPorFrenteEnvio = modulosCurso.map(frente => ({
          frente_id: frente.id,
          frente_nome: frente.nome,
          total_modulos_frente: frente.modulos.length,
          modulos_selecionados: frente.modulos.filter((m) => data.modulos_ids?.includes(m.id)).length,
          todos_selecionados: frente.modulos.every((m) => data.modulos_ids?.includes(m.id))
        }))
        console.log('[ScheduleWizard] Status de módulos por frente:', modulosPorFrenteEnvio)

        const frentesIncompletas = modulosPorFrenteEnvio.filter(f => !f.todos_selecionados || f.modulos_selecionados === 0)
        if (frentesIncompletas.length > 0) {
          console.warn('[ScheduleWizard] ⚠️⚠️⚠️ Frentes com módulos NÃO selecionados:', frentesIncompletas)
        }
      }
      console.log('[ScheduleWizard] =======================================')

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Sessão não encontrada')
      }

      // Chamar API local
      console.log('Invocando API local com body:', requestBody)

      let response: Response
      try {
        response = await fetch('/api/cronograma', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        })
      } catch (fetchError) {
        console.error('Erro ao fazer fetch:', fetchError)
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
        setLoading(false)
        return
      }

      console.log('Status da resposta:', response.status, response.statusText)
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()))

      interface ApiResponse {
        id?: string;
        error?: string;
        message?: string;
        [key: string]: unknown;
      }
      let result: ApiResponse = {}
      const contentType = response.headers.get('content-type')

      try {
        const responseText = await response.text()
        console.log('Texto bruto da resposta:', responseText)

        if (contentType?.includes('application/json') && responseText) {
          try {
            result = JSON.parse(responseText)
            console.log('JSON parseado:', result)
          } catch (jsonError) {
            console.error('Erro ao fazer parse do JSON:', jsonError)
            result = { error: `Resposta inválida do servidor: ${responseText.substring(0, 100)}` }
          }
        } else if (responseText) {
          console.error('Resposta não é JSON:', responseText)
          result = { error: responseText || `Erro ${response.status}: ${response.statusText}` }
        } else {
          result = { error: `Erro ${response.status}: ${response.statusText || 'Resposta vazia do servidor'}` }
        }
      } catch (parseError) {
        console.error('Erro ao processar resposta:', parseError)
        result = { error: `Erro ao processar resposta do servidor (${response.status})` }
      }

      console.log('Resultado final da API:', { result, status: response.status, ok: response.ok })

      if (!response.ok) {
        // Log apenas em desenvolvimento para reduzir ruído no console
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro na API - Status:', response.status)
          console.error('Erro na API - Result:', result)
          console.error('Erro na API - Keys:', result ? Object.keys(result) : 'result é null/undefined')
        }

        // Verificar se é erro de tempo insuficiente (comparação mais flexível)
        const errorText = result?.error ? String(result.error).toLowerCase() : ''
        const isTempoInsuficiente = errorText.includes('tempo insuficiente') && result?.detalhes

        // Se o erro contém detalhes, mostrar mensagem mais específica
        if (isTempoInsuficiente) {
          const detalhes = result?.detalhes || {}
          const horasNecessarias = Number(detalhes.horas_necessarias) || 0
          const horasDisponiveis = Number(detalhes.horas_disponiveis) || 0
          const horasDiaNecessarias = Number(detalhes.horas_dia_necessarias) || 0

          console.log('Erro de tempo insuficiente detectado:', {
            horasNecessarias,
            horasDisponiveis,
            horasDiaNecessarias,
            detalhesCompletos: detalhes,
          })

          // Só mostrar o diálogo se tivermos detalhes válidos
          if (horasNecessarias > 0 || horasDisponiveis > 0) {
            setTempoInsuficienteDetalhes({
              horasNecessarias,
              horasDisponiveis,
              horasDiaNecessarias,
            })
            setShowTempoInsuficienteDialog(true)
            setError(
              `Tempo insuficiente! Necessário ${horasNecessarias}h, disponível ${horasDisponiveis}h. ` +
              (horasDiaNecessarias > 0 ? `Sugestão: ${horasDiaNecessarias}h por dia.` : '')
            )
          } else {
            // Se não temos detalhes, mostrar apenas a mensagem de erro
            const errorMessage = result?.error || 'Tempo insuficiente para gerar o cronograma'
            console.warn('Erro de tempo insuficiente sem detalhes completos')
            setError(errorMessage)
          }
        } else {
          // Extrair mensagem de erro de forma mais robusta
          const errorMessage =
            result?.error ||
            result?.message ||
            result?.details ||
            (typeof result === 'string' ? result : null) ||
            `Erro ${response.status}: ${response.statusText || 'Erro ao gerar cronograma'}`

          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error('Mensagem de erro final:', errorMessage)
            console.error('Result completo para debug:', JSON.stringify(result, null, 2))
          }
          setError(errorMessage)
        }
        setLoading(false)
        return
      }

      if (result?.success) {
        router.push('/aluno/cronograma')
      } else {
        setError('Erro desconhecido ao gerar cronograma')
        setLoading(false)
      }
    } catch (err: unknown) {
      console.error('Erro na requisição:', err)
      const error = err as { message?: string; name?: string };
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setError('Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, verifique se a Edge Function está configurada corretamente.')
      } else {
        setError(error.message || 'Erro ao gerar cronograma')
      }
      setLoading(false)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate)

    if (isValid) {
      if (currentStep === 2) {
        if (cursos.length > 0 && !form.getValues('curso_alvo_id')) {
          setError('Selecione um curso antes de continuar.')
          return
        }
        if (cursoSelecionado && modulosCurso.length > 0 && modulosSelecionados.length === 0) {
          setError('Selecione pelo menos um módulo do curso escolhido.')
          return
        }
      }
      if (currentStep === 3) {
        if (form.getValues('disciplinas_ids').length === 0) {
          setError('Selecione pelo menos uma disciplina antes de continuar.')
          return
        }
      }
      setError(null)
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step: number): (keyof WizardFormData)[] => {
    switch (step) {
      case 1:
        return ['data_inicio', 'data_fim', 'dias_semana', 'horas_dia']
      case 2:
        return ['disciplinas_ids']
      case 3:
        return ['prioridade_minima']
      case 4:
        return ['modalidade']
      default:
        return []
    }
  }

  const addFerias = () => {
    const ferias = form.getValues('ferias')
    form.setValue('ferias', [
      ...ferias,
      { inicio: undefined, fim: undefined },
    ])
  }

  const removeFerias = (index: number) => {
    const ferias = form.getValues('ferias')
    form.setValue('ferias', ferias.filter((_, i) => i !== index))
  }

  const handleToggleModulo = (moduloId: string, checked: boolean) => {
    setModulosSelecionados((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, moduloId]))
      }
      return prev.filter((id) => id !== moduloId)
    })
  }

  const handleToggleFrente = (frenteId: string, checked: boolean) => {
    const frente = modulosCurso.find((item) => item.id === frenteId)
    if (!frente) return
    const moduloIds = frente.modulos.map((modulo) => modulo.id)
    setModulosSelecionados((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...moduloIds]))
      }
      return prev.filter((id) => !moduloIds.includes(id))
    })
  }

  const selecionarTodosModulos = (checked: boolean) => {
    if (checked) {
      setModulosSelecionados(modulosCurso.flatMap((frente) => frente.modulos.map((modulo) => modulo.id)))
    } else {
      setModulosSelecionados([])
    }
  }

  const resetAfterSuggestion = (step: number) => {
    setShowTempoInsuficienteDialog(false)
    setCurrentStep(step)
    setError(null)
  }

  const handleAjustarDiasSemana = () => {
    if (!tempoInsuficienteDetalhes) return
    const horasDiaAtual = form.getValues('horas_dia') || 1
    const diasSemanaAtual = form.getValues('dias_semana') || 1
    const fator = horasDiaAtual > 0 ? tempoInsuficienteDetalhes.horasDiaNecessarias / horasDiaAtual : 1
    const novaQuantidade = Math.min(7, Math.max(diasSemanaAtual + 1, Math.ceil(diasSemanaAtual * fator)))
    form.setValue('dias_semana', Math.max(1, Math.min(7, novaQuantidade)))
    resetAfterSuggestion(1)
  }

  const handleAjustarHorasDia = () => {
    if (!tempoInsuficienteDetalhes) return
    const sugestao = Math.max(tempoInsuficienteDetalhes.horasDiaNecessarias, form.getValues('horas_dia'))
    form.setValue('horas_dia', Math.ceil(Math.max(1, sugestao)))
    resetAfterSuggestion(1)
  }

  const handleAjustarPrioridade = () => {
    const prioridadeAtual = form.getValues('prioridade_minima')
    if (prioridadeAtual > 1) {
      form.setValue('prioridade_minima', prioridadeAtual - 1)
    }
    resetAfterSuggestion(3)
  }

  const diasSemanaAtual = form.watch('dias_semana')
  const horasDiaAtual = form.watch('horas_dia')
  const prioridadeAtual = form.watch('prioridade_minima')
  const sugestaoDiasSemana = tempoInsuficienteDetalhes
    ? Math.min(
      7,
      Math.max(
        diasSemanaAtual + 1,
        Math.ceil(
          (tempoInsuficienteDetalhes.horasDiaNecessarias / Math.max(1, horasDiaAtual)) * Math.max(1, diasSemanaAtual),
        ),
      ),
    )
    : diasSemanaAtual
  const sugestaoHorasDia = tempoInsuficienteDetalhes
    ? Math.ceil(Math.max(horasDiaAtual, tempoInsuficienteDetalhes.horasDiaNecessarias))
    : horasDiaAtual
  const prioridadeSugerida = Math.max(1, prioridadeAtual - 1)

  if (loadingData) {
    return <div className="container mx-auto py-6">Carregando...</div>
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Criar Cronograma de Estudos</CardTitle>
            <CardDescription>
              Configure seu plano de estudos personalizado em {STEPS.length} passos
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step) => {
              const completed = currentStep > step.id
              const active = currentStep === step.id
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-sm transition',
                    completed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100'
                      : active
                        ? 'border-primary bg-primary/5'
                        : 'border-border',
                  )}
                >
                  <Checkbox
                    checked={completed}
                    disabled
                    className={cn(
                      'pointer-events-none',
                      active && !completed && 'data-[state=unchecked]:border-primary',
                    )}
                  />
                  <div className="space-y-1">
                    <p className={cn('text-xs', completed ? 'text-foreground' : 'text-muted-foreground')}>Passo {step.id}</p>
                    <p className={cn('font-medium', active && 'text-primary', completed && 'text-foreground')}>{step.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Só submete se estiver no último step e o nome estiver preenchido
              if (currentStep === STEPS.length && form.watch('nome')?.trim()) {
                form.handleSubmit(onSubmit)(e)
              }
            }}
            className="space-y-6"
          >
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Algo deu errado</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Step 1: Definições de Tempo */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <DatePicker
                      value={form.watch('data_inicio') || null}
                      onChange={(date) => {
                        if (date) {
                          form.setValue('data_inicio', date)
                        }
                      }}
                      placeholder="dd/mm/yyyy"
                      error={form.formState.errors.data_inicio?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <DatePicker
                      value={form.watch('data_fim') || null}
                      onChange={(date) => {
                        if (date) {
                          form.setValue('data_fim', date)
                        }
                      }}
                      placeholder="dd/mm/yyyy"
                      error={form.formState.errors.data_fim?.message}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias de estudo por semana: {form.watch('dias_semana')}</Label>
                  <Slider
                    value={[form.watch('dias_semana')]}
                    onValueChange={([value]) => form.setValue('dias_semana', value)}
                    min={1}
                    max={7}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horas de estudo por dia</Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register('horas_dia', { valueAsNumber: true })}
                  />
                  {form.formState.errors.horas_dia && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.horas_dia.message}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Períodos de Férias/Folgas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFerias}>
                      Adicionar Período
                    </Button>
                  </div>
                  {form.watch('ferias').map((periodo, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Início</Label>
                        <DatePicker
                          value={periodo.inicio || null}
                          onChange={(date) => {
                            const ferias = form.getValues('ferias')
                            ferias[index].inicio = date || undefined
                            form.setValue('ferias', ferias)
                          }}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Fim</Label>
                        <DatePicker
                          value={periodo.fim || null}
                          onChange={(date) => {
                            const ferias = form.getValues('ferias')
                            ferias[index].fim = date || undefined
                            form.setValue('ferias', ferias)
                          }}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFerias(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Disciplinas e Módulos */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Seleção de Curso */}
                <div className="space-y-2">
                  <Label>Curso *</Label>
                  {cursos.length === 0 ? (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Você não possui cursos cadastrados. Entre em contato com o administrador.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={cursoSelecionado || undefined}
                      onValueChange={(value) => form.setValue('curso_alvo_id', value)}
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
                  )}
                  {!cursoSelecionado && cursos.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Escolha o curso para carregar as disciplinas e módulos disponíveis.
                    </p>
                  )}
                </div>

                {/* Seleção de Disciplinas - DEVE VIR ANTES DOS MÓDULOS */}
                {cursoSelecionado && (
                  <div className="space-y-2">
                    <Label>Disciplinas do Curso *</Label>
                    {disciplinasDoCurso.length === 0 ? (
                      <div className="p-4 border rounded-md bg-muted/50">
                        <p className="text-xs text-muted-foreground">
                          Este curso não possui disciplinas cadastradas.
                        </p>
                      </div>
                    ) : disciplinasDoCurso.length === 1 ? (
                      <div className="p-4 border rounded-md bg-muted">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={disciplinasDoCurso[0].id}
                            checked={form.watch('disciplinas_ids').includes(disciplinasDoCurso[0].id)}
                            disabled={true}
                          />
                          <Label htmlFor={disciplinasDoCurso[0].id} className="font-normal">
                            {disciplinasDoCurso[0].nome}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Este curso possui apenas uma disciplina e será incluída automaticamente.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Selecione quais disciplinas deste curso você deseja incluir no cronograma:
                        </p>
                        <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 border rounded-md">
                          {disciplinasDoCurso.map((disciplina) => (
                            <div key={disciplina.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={disciplina.id}
                                checked={form.watch('disciplinas_ids').includes(disciplina.id)}
                                onCheckedChange={(checked) => {
                                  const ids = form.getValues('disciplinas_ids')
                                  if (checked) {
                                    form.setValue('disciplinas_ids', [...ids, disciplina.id])
                                  } else {
                                    form.setValue('disciplinas_ids', ids.filter((id) => id !== disciplina.id))
                                  }
                                }}
                              />
                              <Label htmlFor={disciplina.id} className="font-normal cursor-pointer">
                                {disciplina.nome}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {form.formState.errors.disciplinas_ids && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.disciplinas_ids.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Seleção de Módulos - APÓS AS DISCIPLINAS */}
                {cursoSelecionado && form.watch('disciplinas_ids').length > 0 && (
                  <div className="space-y-3 rounded-md border p-4">
                    {cursoAtual?.nome && (
                      <p className="text-xs text-muted-foreground">
                        Conteúdos vinculados ao curso <span className="font-semibold">{cursoAtual.nome}</span>
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label className="text-sm font-medium">Módulos deste curso</Label>
                        {modulosCurso.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {modulosSelecionados.length} módulo(s) selecionados de{' '}
                            {modulosCurso.reduce((acc, frente) => acc + frente.modulos.length, 0)} disponíveis.
                          </p>
                        )}
                        {modulosCurso.length === 0 && !modulosLoading && (
                          <p className="text-xs text-muted-foreground">
                            Ainda não há módulos vinculados a este curso para as disciplinas selecionadas.
                          </p>
                        )}
                      </div>
                      {modulosCurso.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Button size="sm" variant="outline" onClick={() => selecionarTodosModulos(true)}>
                            Selecionar todos
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => selecionarTodosModulos(false)}>
                            Limpar seleção
                          </Button>
                        </div>
                      )}
                    </div>
                    {modulosLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando módulos...</p>
                    ) : modulosCurso.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Não encontramos módulos vinculados a este curso para as disciplinas selecionadas.
                      </p>
                    ) : Object.keys(modulosCursoAgrupadosPorDisciplina).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(modulosCursoAgrupadosPorDisciplina).map(([disciplinaId, grupo]) => (
                          <div key={disciplinaId} className="rounded-md border p-4 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="font-semibold text-sm">{grupo.disciplinaNome}</h4>
                              <span className="text-xs text-muted-foreground">
                                {grupo.frentes.length} frente(s)
                              </span>
                            </div>
                            <Accordion type="multiple" className="space-y-2">
                              {grupo.frentes.map((frente) => {
                                const selecionadosNaFrente = frente.modulos.filter((modulo) =>
                                  modulosSelecionados.includes(modulo.id),
                                ).length
                                const frenteChecked =
                                  frente.modulos.length > 0 && selecionadosNaFrente === frente.modulos.length
                                    ? true
                                    : selecionadosNaFrente > 0
                                      ? 'indeterminate'
                                      : false
                                return (
                                  <AccordionItem key={frente.id} value={frente.id} className="rounded-md border">
                                    <div className="flex items-center gap-3 px-4">
                                      <Checkbox
                                        id={`frente-${frente.id}`}
                                        checked={frenteChecked}
                                        onCheckedChange={(checked) =>
                                          handleToggleFrente(frente.id, Boolean(checked))
                                        }
                                      />
                                      <AccordionPrimitive.Header className="flex flex-1">
                                        <AccordionPrimitive.Trigger
                                          className={cn(
                                            'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
                                          )}
                                        >
                                          <div className="text-left">
                                            <p className="font-medium">{frente.nome}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {frente.modulos.length} módulo(s)
                                            </p>
                                          </div>
                                          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
                                        </AccordionPrimitive.Trigger>
                                      </AccordionPrimitive.Header>
                                    </div>
                                    <AccordionContent>
                                      <div className="space-y-2 border-t px-4 py-3">
                                        {frente.modulos.map((modulo) => (
                                          <div
                                            key={modulo.id}
                                            className="flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id={`modulo-${modulo.id}`}
                                                checked={modulosSelecionados.includes(modulo.id)}
                                                onCheckedChange={(checked) =>
                                                  handleToggleModulo(modulo.id, Boolean(checked))
                                                }
                                                onClick={(event) => event.stopPropagation()}
                                              />
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <p className="font-medium">{modulo.nome}</p>
                                                  {modulo.importancia && (
                                                    <div className="flex items-center gap-1">
                                                      <Badge
                                                        variant={
                                                          modulo.importancia === 'Alta'
                                                            ? 'destructive'
                                                            : modulo.importancia === 'Media'
                                                              ? 'default'
                                                              : modulo.importancia === 'Baixa'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className="text-xs"
                                                      >
                                                        {modulo.importancia === 'Alta'
                                                          ? 'Alta'
                                                          : modulo.importancia === 'Media'
                                                            ? 'Média'
                                                            : modulo.importancia === 'Baixa'
                                                              ? 'Baixa'
                                                              : 'Base'}
                                                      </Badge>
                                                      <TooltipProvider>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                                          </TooltipTrigger>
                                                          <TooltipContent side="right" className="max-w-xs">
                                                            <div className="space-y-2">
                                                              <p className="font-semibold">Importância do Módulo</p>
                                                              <p className="text-xs leading-relaxed">
                                                                Este indicador mostra a <strong>importância e recorrência</strong> deste módulo nas provas mais tradicionais do país (ENEM, FUVEST, UNICAMP, UERJ, entre outras).
                                                              </p>
                                                              <p className="text-xs leading-relaxed">
                                                                A classificação foi definida pelo seu professor com base na análise histórica de questões e na relevância dos conteúdos.
                                                              </p>
                                                              <div className="pt-1 border-t border-background/20">
                                                                <p className="text-xs font-semibold mb-1">O que significa cada nível?</p>
                                                                <ul className="text-xs space-y-1 list-disc list-inside">
                                                                  <li><strong>Alta:</strong> Aparece frequentemente e é essencial para a aprovação</li>
                                                                  <li><strong>Média:</strong> Importante, mas com recorrência moderada</li>
                                                                  <li><strong>Baixa:</strong> Menos frequente, mas ainda relevante</li>
                                                                  <li><strong>Base:</strong> Conhecimento fundamental que serve de alicerce para outros conteúdos</li>
                                                                </ul>
                                                              </div>
                                                            </div>
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                    </div>
                                                  )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                  {modulo.totalAulas} aula(s) • {formatHorasFromMinutes(modulo.tempoTotal)}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {modulo.concluidas > 0 ? (
                                                <span className="text-green-600 dark:text-green-400">
                                                  {modulo.concluidas} aula(s) já concluídas
                                                </span>
                                              ) : (
                                                <span>Nenhuma aula concluída</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )
                              })}
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não há módulos agrupados por disciplina.
                      </p>
                    )}

                    {cursoSelecionado && modulosCurso.length > 0 && modulosSelecionados.length === 0 && (
                      <p className="text-xs text-destructive">
                        Selecione pelo menos um módulo para gerar o cronograma.
                      </p>
                    )}
                  </div>
                )}

                {/* Box separado para Excluir aulas já concluídas */}
                {cursoSelecionado && modulosCurso.length > 0 && (
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="excluir-concluidas"
                        checked={form.watch('excluir_aulas_concluidas') ?? true}
                        onCheckedChange={(checked) =>
                          form.setValue('excluir_aulas_concluidas', Boolean(checked))
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="excluir-concluidas" className="text-sm font-medium">
                          Excluir aulas já concluídas
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Detectamos {completedLessonsCount} aula(s) concluídas neste curso.
                          Ao manter essa opção marcada, elas serão removidas do novo cronograma.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Modalidade */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Modalidade</Label>
                  {/* Primeiros 3 cards em grid de 3 colunas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODALIDADES.slice(0, 3).map(({ nivel, label, descricao, texto, tempo }) => (
                      <Card
                        key={nivel}
                        className={cn(
                          "cursor-pointer transition-colors h-full",
                          form.watch('prioridade_minima') === nivel
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                        onClick={() => form.setValue('prioridade_minima', nivel)}
                      >
                        <CardContent className="p-5 space-y-3">
                          <div className="text-center space-y-1.5 border-b border-border pb-3">
                            <div className="font-bold text-lg text-foreground">{label}</div>
                            <div className="text-sm font-semibold text-primary">({descricao})</div>
                          </div>
                          <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                            <p>{texto}</p>
                            <p className="font-semibold text-primary">{tempo}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Últimos 2 cards centralizados */}
                  <div className="flex justify-center gap-4 flex-wrap items-stretch">
                    {MODALIDADES.slice(3).map(({ nivel, label, descricao, texto, tempo }) => (
                      <Card
                        key={nivel}
                        className={cn(
                          "cursor-pointer transition-colors w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] flex flex-col",
                          form.watch('prioridade_minima') === nivel
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                        onClick={() => form.setValue('prioridade_minima', nivel)}
                      >
                        <CardContent className="p-5 flex flex-col flex-1">
                          <div className="text-center space-y-1.5 border-b border-border pb-3 shrink-0">
                            <div className="font-bold text-lg text-foreground">{label}</div>
                            <div className="text-sm font-semibold text-primary">({descricao})</div>
                          </div>
                          <div className="flex flex-col flex-1 space-y-2.5 text-sm text-muted-foreground leading-relaxed pt-3">
                            <p className="flex-1">{texto}</p>
                            <p className="font-semibold text-primary mt-auto pt-2">{tempo}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Estratégia de Estudo */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Tipo de Estudo</Label>
                  <RadioGroup
                    value={form.watch('modalidade')}
                    onValueChange={(value) => form.setValue('modalidade', value as 'paralelo' | 'sequencial')}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paralelo" id="paralelo" />
                        <Label htmlFor="paralelo" className="font-semibold cursor-pointer">
                          Frentes em Paralelo
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        Toda semana você estuda um pouquinho de cada uma das frentes do curso, para distribuir melhor os conteúdos.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sequencial" id="sequencial" />
                        <Label htmlFor="sequencial" className="font-semibold cursor-pointer">
                          Estudo Sequencial (Para os mais tradicionais)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        Você estudará uma frente completa e, ao finalizar, passará para a próxima até finalizar o curso.
                      </p>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Em qual velocidade você assiste as aulas?</Label>
                  <RadioGroup
                    value={(form.watch('velocidade_reproducao') ?? 1.0).toFixed(2)}
                    onValueChange={(value) => form.setValue('velocidade_reproducao', Number(value))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1.00" id="velocidade-1.00" />
                      <Label htmlFor="velocidade-1.00" className="font-normal cursor-pointer">
                        1,00 x (ideal)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1.25" id="velocidade-1.25" />
                      <Label htmlFor="velocidade-1.25" className="font-normal cursor-pointer">
                        1,25 x (até que vai...)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1.50" id="velocidade-1.50" />
                      <Label htmlFor="velocidade-1.50" className="font-normal cursor-pointer">
                        1,50 x (não recomendo, mas você que sabe...)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2.00" id="velocidade-2.00" />
                      <Label htmlFor="velocidade-2.00" className="font-normal cursor-pointer">
                        2,00 x (ver rápido pra ver duas vezes, né?)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Exibir tempos recalculados baseados na velocidade */}
                {form.watch('disciplinas_ids').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tempos Recalculados</CardTitle>
                      <CardDescription className="text-xs">
                        Valores ajustados considerando a velocidade de reprodução selecionada e o tempo de estudo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {modalidadeStatsLoading ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculando...
                        </div>
                      ) : modalidadeStatsError ? (
                        <p className="text-destructive text-sm py-4">{modalidadeStatsError}</p>
                      ) : (
                        <div className="grid grid-cols-5 gap-2">
                          {MODALIDADES.map(({ nivel, label }) => {
                            const stats = modalidadeStats[nivel]
                            if (!stats) return null

                            const velocidade = form.watch('velocidade_reproducao') || 1.0
                            // Tempo de aula ajustado pela velocidade
                            const tempoAulaAjustado = stats.tempoAulaMinutos / velocidade
                            // Tempo de estudo = tempo de aula ajustado * (FATOR_MULTIPLICADOR - 1)
                            const tempoEstudoAjustado = tempoAulaAjustado * (FATOR_MULTIPLICADOR - 1)

                            return (
                              <Card key={nivel} className="p-3">
                                <div className="text-center space-y-2">
                                  <div className="font-bold text-xs">{label}</div>
                                  <div className="space-y-1 text-xs">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                        Tempo de aula
                                      </p>
                                      <p className="text-sm font-semibold">
                                        {formatHorasFromMinutes(tempoAulaAjustado)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                        Tempo de estudo
                                      </p>
                                      <p className="text-sm font-semibold">
                                        {formatHorasFromMinutes(Math.round(tempoEstudoAjustado))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {form.watch('modalidade') === 'sequencial' && frentes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Ordem de Prioridade das Frentes (Arraste para reordenar)</Label>
                    <div className="space-y-2 p-4 border rounded-md">
                      {frentes.map((frente) => (
                        <div key={frente.id} className="flex items-center p-2 bg-muted rounded">
                          {frente.nome}
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground">
                        Nota: A funcionalidade de drag-and-drop será implementada em breve.
                        Por enquanto, as frentes serão processadas na ordem padrão.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Revisão e Geração */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Nome do Cronograma *</Label>
                  <Input
                    placeholder="Ex: Meu Cronograma de Estudos 2024"
                    {...form.register('nome')}
                  />
                  {form.formState.errors.nome && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Configuração</CardTitle>
                    <Separator className="mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período:</span>
                      <span>
                        {form.watch('data_inicio') ? format(form.watch('data_inicio')!, "dd/MM/yyyy", { locale: ptBR }) : '--'} - {' '}
                        {form.watch('data_fim') ? format(form.watch('data_fim')!, "dd/MM/yyyy", { locale: ptBR }) : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dias por semana:</span>
                      <span>{form.watch('dias_semana')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horas por dia:</span>
                      <span>{form.watch('horas_dia')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de semanas disponibilizadas:</span>
                      <span>
                        {calcularSemanasDisponibilizadas(
                          form.watch('data_inicio'),
                          form.watch('data_fim'),
                          form.watch('ferias')
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de semanas do cronograma:</span>
                      <span>
                        {calcularSemanasCronograma(
                          modalidadeStats,
                          form.watch('prioridade_minima'),
                          form.watch('velocidade_reproducao') ?? 1.0,
                          form.watch('horas_dia'),
                          form.watch('dias_semana')
                        )}
                      </span>
                    </div>
                    <Separator />
                    {cursoAtual?.nome && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Curso:</span>
                          <span className="font-medium">{cursoAtual.nome}</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    {form.watch('disciplinas_ids').length === 0 ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disciplinas:</span>
                        <span className="text-muted-foreground">Nenhuma disciplina selecionada</span>
                      </div>
                    ) : (
                      disciplinasDoCurso
                        .filter((d) => form.watch('disciplinas_ids').includes(d.id))
                        .map((disciplina) => {
                          // Calcular horas totais da disciplina baseado nos módulos selecionados
                          const grupoDisciplina = modulosCursoAgrupadosPorDisciplina[disciplina.id]
                          let horasTotais = 0
                          if (grupoDisciplina) {
                            grupoDisciplina.frentes.forEach((frente) => {
                              frente.modulos.forEach((modulo) => {
                                if (modulosSelecionados.includes(modulo.id)) {
                                  horasTotais += modulo.tempoTotal || 0
                                }
                              })
                            })
                          }
                          return (
                            <div key={disciplina.id} className="flex justify-between">
                              <span className="text-muted-foreground">{disciplina.nome}:</span>
                              <span>{horasTotais > 0 ? formatHorasFromMinutes(horasTotais) : '--'}</span>
                            </div>
                          )
                        })
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modalidade:</span>
                      <span>
                        {{
                          1: 'Super Extensivo',
                          2: 'Extensivo',
                          3: 'Semi Extensivo',
                          4: 'Intensivo',
                          5: 'Superintensivo',
                        }[form.watch('prioridade_minima')] || 'Não definida'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo de Estudo:</span>
                      <span className="capitalize">{form.watch('modalidade')}</span>
                    </div>
                    <Separator />
                    {form.watch('ferias').length > 0 && (
                      <div className="space-y-1 pt-2">
                        <span className="text-muted-foreground">Pausas e Recessos:</span>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {form.watch('ferias').map((periodo, index) => {
                            if (!periodo.inicio || !periodo.fim) return null
                            return (
                              <li key={index}>
                                {format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} -{' '}
                                {format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !form.watch('nome') || form.watch('nome')?.trim().length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Cronograma...
                    </>
                  ) : (
                    'Gerar Cronograma Inteligente'
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <AlertDialog
        open={showTempoInsuficienteDialog}
        onOpenChange={(open) => {
          setShowTempoInsuficienteDialog(open)
          if (!open) {
            setCurrentStep(1)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vamos ajustar seu cronograma</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 *:block">
              <span>
                Detectamos tempo insuficiente para cobrir todo o conteúdo ({tempoInsuficienteDetalhes?.horasDisponiveis ?? 0}h
                disponíveis contra {tempoInsuficienteDetalhes?.horasNecessarias ?? 0}h necessárias).
              </span>
              <span>Escolha uma das sugestões abaixo para voltar e ajustar suas preferências:</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            <div className="border rounded-md p-4 space-y-2">
              <p className="font-medium">1. Aumentar dias de estudo na semana</p>
              <p className="text-muted-foreground">
                Mantenha as {horasDiaAtual}h/dia e tente estudar cerca de {sugestaoDiasSemana} dias por semana (máximo 7).
              </p>
              <Button variant="outline" onClick={handleAjustarDiasSemana}>
                Ajustar dias e voltar para o passo 1
              </Button>
            </div>
            <div className="border rounded-md p-4 space-y-2">
              <p className="font-medium">2. Aumentar horas por dia</p>
              <p className="text-muted-foreground">
                Considere elevar sua carga diária para aproximadamente {sugestaoHorasDia}h/dia mantendo {diasSemanaAtual} dias.
              </p>
              <Button variant="outline" onClick={handleAjustarHorasDia}>
                Ajustar horas e voltar para o passo 1
              </Button>
            </div>
            <div className="border rounded-md p-4 space-y-2">
              <p className="font-medium">3. Reduzir prioridade mínima</p>
              <p className="text-muted-foreground">
                Ao diminuir a prioridade para {prioridadeSugerida}, menos conteúdos obrigatórios serão incluídos.
              </p>
              <Button variant="outline" onClick={handleAjustarPrioridade}>
                Ajustar prioridade e voltar para o passo 3
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowTempoInsuficienteDialog(false)
                setCurrentStep(1)
              }}
            >
              Ajustarei manualmente
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowTempoInsuficienteDialog(false)
                setCurrentStep(1)
              }}
            >
              Voltar para configurações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

