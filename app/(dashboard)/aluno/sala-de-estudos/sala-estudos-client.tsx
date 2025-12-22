'use client'

import * as React from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, School } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SalaEstudosFilters } from '@/components/aluno/sala-estudos-filters'
import { ModuloActivitiesAccordion } from '@/components/aluno/modulo-activities-accordion'
import { ProgressoStatsCard } from '@/components/aluno/progresso-stats-card'
import {
  AtividadeComProgresso,
  ModuloComAtividades,
  FrenteComModulos,
  DisciplinaComFrentes,
  CursoComDisciplinas,
} from './types'
import { StatusAtividade, DificuldadePercebida } from '@/backend/services/progresso-atividade'

// Helper para formatar erros do Supabase
function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'object' && error !== null) {
    // Erro do Supabase geralmente tem propriedades: message, details, hint, code
    const supabaseError = error as Record<string, unknown>
    const message = supabaseError.message
    const details = supabaseError.details
    const hint = supabaseError.hint
    const code = supabaseError.code
    
    const parts: string[] = []
    if (code) parts.push(`[${code}]`)
    if (message) parts.push(String(message))
    if (details) parts.push(`Detalhes: ${String(details)}`)
    if (hint) parts.push(`Hint: ${String(hint)}`)
    
    return parts.length > 0 ? parts.join(' - ') : JSON.stringify(error)
  }
  
  return String(error)
}

type SalaEstudosClientProps = {
  title?: string
  description?: string
}

export default function SalaEstudosClientPage({
  title = 'Sala de Estudos',
  description = 'Checklist e acompanhamento do seu progresso nas atividades',
}: SalaEstudosClientProps) {
  const supabase = createClient()

  const [atividades, setAtividades] = React.useState<AtividadeComProgresso[]>([])
  const [cursos, setCursos] = React.useState<Array<{ id: string; nome: string }>>([])
  const [disciplinas, setDisciplinas] = React.useState<Array<{ id: string; nome: string }>>([])
  const [frentes, setFrentes] = React.useState<Array<{ id: string; nome: string; disciplina_id: string }>>([])
  const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
  const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
  const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')
  const [alunoId, setAlunoId] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = React.useState<boolean>(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingAtividades, setIsLoadingAtividades] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Estrutura hierárquica agrupada
  const [estruturaHierarquica, setEstruturaHierarquica] = React.useState<CursoComDisciplinas[]>([])

  // Buscar usuário autenticado e detectar role
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Erro ao buscar usuário:', userError)
          const errorMsg = formatSupabaseError(userError)
          setError(`Erro de autenticação: ${errorMsg}`)
          return
        }

        if (!user) {
          setError('Usuário não autenticado')
          return
        }

        // Detectar role do usuário
        const role = (user.user_metadata?.role as string) || 'aluno'
        setUserRole(role)
        setIsSuperAdmin(role === 'superadmin' || user.user_metadata?.is_superadmin === true)

        // Usar o ID do usuário como aluno_id (mesmo para professores, para buscar progresso se necessário)
        setAlunoId(user.id)
      } catch (err) {
        console.error('Erro ao buscar usuário:', err)
        const errorMessage = formatSupabaseError(err)
        setError(`Erro ao carregar dados do usuário: ${errorMessage}`)
      }
    }

    fetchUser()
  }, [supabase])

  // Carregar cursos (diferente para alunos e professores)
  React.useEffect(() => {
    const fetchCursos = async () => {
      if (!alunoId || !userRole) return

      try {
        setIsLoading(true)
        setError(null)

        // Verificar se há sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError)
          const errorMsg = formatSupabaseError(sessionError)
          throw new Error(`Erro de autenticação: ${errorMsg}`)
        }

        if (!session) {
          throw new Error('Sessão não encontrada. Faça login novamente.')
        }

        let cursoIds: string[] = []

        // Se for professor, buscar cursos criados por ele; se superadmin, todos
        if (userRole === 'professor' || isSuperAdmin) {
          let query = supabase.from('cursos').select('id, created_by').order('nome', { ascending: true })
          if (!isSuperAdmin) {
            query = query.eq('created_by', alunoId)
          }

          const { data: cursosData, error: cursosError } = await query

          if (cursosError) {
            console.error('Erro ao buscar cursos (professor):', cursosError)
            const errorMsg = formatSupabaseError(cursosError)
            throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
          }

          cursoIds = cursosData?.map((c) => c.id) || []
        } else {
          // Se for aluno, buscar cursos através da tabela alunos_cursos (mesmo método do cronograma)
          const { data: alunosCursos, error: alunosCursosError } = await supabase
            .from('alunos_cursos')
            .select('curso_id, cursos(*)')
            .eq('aluno_id', alunoId)

          if (alunosCursosError) {
            console.error('Erro ao buscar cursos do aluno:', alunosCursosError)
            const errorMsg = formatSupabaseError(alunosCursosError)
            throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
          }

          if (!alunosCursos || alunosCursos.length === 0) {
            setCursos([])
            setIsLoading(false)
            return
          }

          // Extrair os cursos do resultado (mesmo método do cronograma)
          const cursosData = alunosCursos
            .map((ac: { cursos: { id: string } | null }) => ac.cursos)
            .filter((c): c is { id: string } => c !== null)
          cursoIds = cursosData.map((c) => c.id)
        }

        if (cursoIds.length === 0) {
          setCursos([])
          setIsLoading(false)
          return
        }

        // Buscar cursos
        const { data: cursosData, error: cursosError } = await supabase
          .from('cursos')
          .select('id, nome')
          .in('id', cursoIds)
          .order('nome', { ascending: true })

        if (cursosError) {
          console.error('Erro na query de cursos:', cursosError)
          const errorMsg = formatSupabaseError(cursosError)
          throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
        }

        setCursos(cursosData || [])

        // Se houver apenas um curso, selecionar automaticamente
        if (cursosData && cursosData.length === 1) {
          setCursoSelecionado(cursosData[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
        const errorMessage = formatSupabaseError(err)
        console.error('Detalhes do erro:', {
          message: errorMessage,
          error: err,
          alunoId,
          userRole,
        })
        setError(`Erro ao carregar cursos: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCursos()
  }, [alunoId, userRole, isSuperAdmin, supabase])

  // Carregar disciplinas e frentes dos cursos
  React.useEffect(() => {
    const fetchDisciplinasEFrentes = async () => {
      if (!cursoSelecionado) {
        setDisciplinas([])
        setFrentes([])
        return
      }

      try {
        // Buscar disciplinas do curso através de cursos_disciplinas
        const { data: cursosDisciplinas, error: cdError } = await supabase
          .from('cursos_disciplinas')
          .select('disciplina_id')
          .eq('curso_id', cursoSelecionado)

        if (cdError) {
          console.error('Erro na query de cursos_disciplinas (filtros):', cdError)
          const errorMsg = formatSupabaseError(cdError)
          throw new Error(`Erro ao buscar cursos_disciplinas: ${errorMsg}`)
        }

        if (!cursosDisciplinas || cursosDisciplinas.length === 0) {
          setDisciplinas([])
          setFrentes([])
          return
        }

        const disciplinaIds = cursosDisciplinas.map((cd) => cd.disciplina_id)

        // Buscar disciplinas
        const { data: disciplinasData, error: discError } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .in('id', disciplinaIds)
          .order('nome', { ascending: true })

        if (discError) {
          console.error('Erro na query de disciplinas (filtros):', discError)
          const errorMsg = formatSupabaseError(discError)
          throw new Error(`Erro ao buscar disciplinas: ${errorMsg}`)
        }

        setDisciplinas(disciplinasData || [])

        // Buscar frentes dessas disciplinas
        const { data: frentesData, error: frentesError } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id')
          .in('disciplina_id', disciplinaIds)
          .order('nome', { ascending: true })

        if (frentesError) {
          console.error('Erro na query de frentes (filtros):', frentesError)
          const errorMsg = formatSupabaseError(frentesError)
          throw new Error(`Erro ao buscar frentes: ${errorMsg}`)
        }

        setFrentes((frentesData || [])
          .filter(f => f.disciplina_id !== null)
          .map(f => ({ id: f.id, nome: f.nome, disciplina_id: f.disciplina_id! })))
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err)
        const errorMessage = formatSupabaseError(err)
        setError(`Erro ao carregar disciplinas: ${errorMessage}`)
      }
    }

    fetchDisciplinasEFrentes()
  }, [cursoSelecionado, supabase])

  // Carregar atividades (diferente para alunos e professores)
  React.useEffect(() => {
    const fetchAtividades = async () => {
      if (!alunoId || !userRole) return

      try {
        setIsLoadingAtividades(true)
        setError(null)

        // Verificar se há sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao verificar sessão (atividades):', sessionError)
          const errorMsg = formatSupabaseError(sessionError)
          throw new Error(`Erro de autenticação: ${errorMsg}`)
        }

        if (!session) {
          throw new Error('Sessão não encontrada. Faça login novamente.')
        }

        let cursoIds: string[] = []

        // Se for professor, buscar todos os cursos
        if (userRole === 'professor' || userRole === 'superadmin') {
          const { data: cursosData, error: cursosError } = await supabase
            .from('cursos')
            .select('id')
            .order('nome', { ascending: true })

          if (cursosError) {
            console.error('Erro ao buscar cursos (atividades - professor):', cursosError)
            const errorMsg = formatSupabaseError(cursosError)
            throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
          }

          cursoIds = cursosData?.map((c) => c.id) || []
        } else {
          // Se for aluno, buscar cursos através da tabela alunos_cursos (mesmo método do cronograma)
          const { data: alunosCursos, error: alunosCursosError } = await supabase
            .from('alunos_cursos')
            .select('curso_id, cursos(*)')
            .eq('aluno_id', alunoId)

          if (alunosCursosError) {
            console.error('Erro ao buscar cursos do aluno (atividades):', alunosCursosError)
            const errorMsg = formatSupabaseError(alunosCursosError)
            throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
          }

          if (!alunosCursos || alunosCursos.length === 0) {
            console.log('Aluno não possui cursos cadastrados')
            setAtividades([])
            setEstruturaHierarquica([])
            return
          }

          // Extrair os cursos do resultado (mesmo método do cronograma)
          const cursosData = alunosCursos
            .map((ac: { cursos: { id: string } | null }) => ac.cursos)
            .filter((c): c is { id: string } => c !== null)
          cursoIds = cursosData.map((c) => c.id)
        }

        if (cursoIds.length === 0) {
          setAtividades([])
          setEstruturaHierarquica([])
          return
        }

        // 2. Buscar cursos_disciplinas
        const { data: cursosDisciplinas, error: cdError } = await supabase
          .from('cursos_disciplinas')
          .select('disciplina_id, curso_id')
          .in('curso_id', cursoIds)

        if (cdError) {
          console.error('Erro na query de cursos_disciplinas:', cdError)
          const errorMsg = formatSupabaseError(cdError)
          throw new Error(`Erro ao buscar cursos_disciplinas: ${errorMsg}`)
        }
        if (!cursosDisciplinas || cursosDisciplinas.length === 0) {
          setAtividades([])
          setEstruturaHierarquica([])
          return
        }

        const disciplinaIds = [...new Set(cursosDisciplinas.map((cd) => cd.disciplina_id))]

        // 3. Buscar frentes
        const { data: frentesData, error: frentesError } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, curso_id')
          .in('disciplina_id', disciplinaIds)

        if (frentesError) throw frentesError
        if (!frentesData || frentesData.length === 0) {
          setAtividades([])
          setEstruturaHierarquica([])
          return
        }

        // Filtrar frentes que pertencem aos cursos
        const frentesFiltradas = frentesData.filter(
          (f) => !f.curso_id || cursoIds.includes(f.curso_id),
        )
        const frenteIds = frentesFiltradas.map((f) => f.id)

        // 4. Buscar módulos
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id')
          .in('frente_id', frenteIds)
          .order('numero_modulo', { ascending: true, nullsFirst: false })

        if (modulosError) {
          console.error('Erro na query de módulos:', modulosError)
          const errorMsg = formatSupabaseError(modulosError)
          throw new Error(`Erro ao buscar módulos: ${errorMsg}`)
        }
        if (!modulosData || modulosData.length === 0) {
          setAtividades([])
          setEstruturaHierarquica([])
          return
        }

        // Deduplicar módulos para evitar nomes repetidos no dropdown
        const uniqueModulosMap = new Map<string, typeof modulosData[number]>()
        ;(modulosData || []).forEach((m) => {
          if (!uniqueModulosMap.has(m.id)) {
            uniqueModulosMap.set(m.id, m)
          }
        })
        const uniqueModulos = Array.from(uniqueModulosMap.values())
        const moduloIds = uniqueModulos.map((m) => m.id)

        // 5. Buscar atividades
        const { data: atividadesData, error: atividadesError } = await supabase
          .from('atividades')
          .select('*')
          .in('modulo_id', moduloIds)
          .order('ordem_exibicao', { ascending: true, nullsFirst: false })

        if (atividadesError) {
          console.error('Erro na query de atividades:', atividadesError)
          const errorMsg = formatSupabaseError(atividadesError)
          throw new Error(`Erro ao buscar atividades: ${errorMsg}`)
        }
        if (!atividadesData) {
          setAtividades([])
          setEstruturaHierarquica([])
          return
        }

        // 6. Buscar progresso do aluno (incluindo campos de desempenho)
        const atividadeIds = atividadesData.map((a) => a.id)
        
        // Dividir em lotes para evitar URLs muito longas (limite de ~2000 caracteres)
        // Usar lotes de 100 IDs por vez (cada UUID tem ~36 caracteres + separadores)
        const BATCH_SIZE = 100
        const progressosData: {
          atividade_id: string
          status: string | null
          data_inicio: string | null
          data_conclusao: string | null
          questoes_totais: number | null
          questoes_acertos: number | null
          dificuldade_percebida: string | null
          anotacoes_pessoais: string | null
        }[] = []
        
        // Só buscar progressos se houver atividades
        if (atividadeIds.length > 0) {
          for (let i = 0; i < atividadeIds.length; i += BATCH_SIZE) {
            const batch = atividadeIds.slice(i, i + BATCH_SIZE)
            
            const { data: batchData, error: progressosError } = await supabase
              .from('progresso_atividades')
              .select('atividade_id, status, data_inicio, data_conclusao, questoes_totais, questoes_acertos, dificuldade_percebida, anotacoes_pessoais')
              .eq('aluno_id', alunoId)
              .in('atividade_id', batch)

            if (progressosError) {
              console.error('Erro na query de progressos (lote):', progressosError)
              const errorMsg = formatSupabaseError(progressosError)
              throw new Error(`Erro ao buscar progressos: ${errorMsg}`)
            }
            
            if (batchData) {
              // Filtrar apenas registros com atividade_id não nulo
              const validBatchData = batchData.filter(
                (p): p is typeof p & { atividade_id: string } => p.atividade_id !== null
              )
              progressosData.push(...validBatchData)
            }
          }
        }

        const progressosMap = new Map(
          (progressosData || []).map((p) => [
            p.atividade_id,
            {
              status: p.status,
              dataInicio: p.data_inicio,
              dataConclusao: p.data_conclusao,
              questoesTotais: p.questoes_totais ?? null,
              questoesAcertos: p.questoes_acertos ?? null,
              dificuldadePercebida: p.dificuldade_percebida ?? null,
              anotacoesPessoais: p.anotacoes_pessoais ?? null,
            },
          ]),
        )

        // 7. Buscar informações adicionais
        const { data: disciplinasData, error: disciplinasError } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .in('id', disciplinaIds)

        if (disciplinasError) {
          console.error('Erro na query de disciplinas:', disciplinasError)
          const errorMsg = formatSupabaseError(disciplinasError)
          throw new Error(`Erro ao buscar disciplinas: ${errorMsg}`)
        }

        const disciplinasMap = new Map(
          (disciplinasData || []).map((d) => [d.id, d]),
        )

        const { data: cursosDataInfo, error: cursosInfoError } = await supabase
          .from('cursos')
          .select('id, nome')
          .in('id', cursoIds)

        if (cursosInfoError) {
          console.error('Erro na query de cursos (info):', cursosInfoError)
          const errorMsg = formatSupabaseError(cursosInfoError)
          throw new Error(`Erro ao buscar cursos: ${errorMsg}`)
        }

        const cursosMap = new Map(
          (cursosDataInfo || []).map((c) => [c.id, c]),
        )

        const modulosMap = new Map(uniqueModulos.map((m) => [m.id, m]))
        const frentesMap = new Map(frentesFiltradas.map((f) => [f.id, f]))

        // Criar mapa curso-disciplina
        const cursoDisciplinaMap = new Map<string, string[]>()
        cursosDisciplinas.forEach((cd) => {
          const key = cd.curso_id
          if (!cursoDisciplinaMap.has(key)) {
            cursoDisciplinaMap.set(key, [])
          }
          cursoDisciplinaMap.get(key)!.push(cd.disciplina_id)
        })

        // 8. Montar atividades com progresso e hierarquia
        const atividadesComProgresso: AtividadeComProgresso[] = []

        for (const atividade of atividadesData) {
          if (!atividade.modulo_id) continue
          const modulo = modulosMap.get(atividade.modulo_id)
          if (!modulo || !modulo.frente_id) continue

          const frente = frentesMap.get(modulo.frente_id)
          if (!frente || !frente.disciplina_id) continue

          const disciplina = disciplinasMap.get(frente.disciplina_id)
          if (!disciplina) continue

          // Encontrar curso
          let cursoId: string | null = null
          let cursoNome: string | null = null

          for (const [cid, discIds] of cursoDisciplinaMap.entries()) {
            if (discIds.includes(frente.disciplina_id)) {
              cursoId = cid
              const curso = cursosMap.get(cid)
              if (curso) {
                cursoNome = curso.nome
              }
              break
            }
          }

          if (!cursoId || !cursoNome) {
            // Tentar pelo curso_id da frente
            if (frente.curso_id) {
              cursoId = frente.curso_id
              const curso = cursosMap.get(frente.curso_id)
              if (curso) {
                cursoNome = curso.nome
              }
            }
          }

          if (!cursoId || !cursoNome) continue

          const progresso = progressosMap.get(atividade.id)

          atividadesComProgresso.push({
            id: atividade.id,
            moduloId: atividade.modulo_id,
            tipo: atividade.tipo,
            titulo: atividade.titulo,
            arquivoUrl: atividade.arquivo_url,
            gabaritoUrl: atividade.gabarito_url,
            linkExterno: atividade.link_externo,
            obrigatorio: atividade.obrigatorio ?? false,
            ordemExibicao: atividade.ordem_exibicao ?? 0,
            createdBy: atividade.created_by || null,
            createdAt: atividade.created_at || '1970-01-01T00:00:00.000Z',
            updatedAt: atividade.updated_at || '1970-01-01T00:00:00.000Z',
            moduloNome: modulo.nome,
            moduloNumero: modulo.numero_modulo,
            frenteNome: frente.nome,
            frenteId: frente.id,
            disciplinaNome: disciplina.nome,
            disciplinaId: disciplina.id,
            cursoNome,
            cursoId,
            progressoStatus: (progresso?.status as StatusAtividade) || null,
            progressoDataInicio: progresso?.dataInicio || null,
            progressoDataConclusao: progresso?.dataConclusao || null,
            // Campos de desempenho
            questoesTotais: progresso?.questoesTotais ?? null,
            questoesAcertos: progresso?.questoesAcertos ?? null,
            dificuldadePercebida: (progresso?.dificuldadePercebida as DificuldadePercebida) ?? null,
            anotacoesPessoais: progresso?.anotacoesPessoais ?? null,
          })
        }

        // Ordenar
        atividadesComProgresso.sort((a, b) => {
          if (a.cursoNome !== b.cursoNome) {
            return a.cursoNome.localeCompare(b.cursoNome)
          }
          if (a.disciplinaNome !== b.disciplinaNome) {
            return a.disciplinaNome.localeCompare(b.disciplinaNome)
          }
          if (a.frenteNome !== b.frenteNome) {
            return a.frenteNome.localeCompare(b.frenteNome)
          }
          const numA = a.moduloNumero ?? 0
          const numB = b.moduloNumero ?? 0
          if (numA !== numB) {
            return numA - numB
          }
          return (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0)
        })

        setAtividades(atividadesComProgresso)

        // Agrupar em estrutura hierárquica
        const estrutura: CursoComDisciplinas[] = []
        const cursosMapEstrutura = new Map<string, CursoComDisciplinas>()
        const disciplinasMapEstrutura = new Map<string, DisciplinaComFrentes>()
        const frentesMapEstrutura = new Map<string, FrenteComModulos>()
        const modulosMapEstrutura = new Map<string, ModuloComAtividades>()

        atividadesComProgresso.forEach((atividade) => {
          // Curso
          if (!cursosMapEstrutura.has(atividade.cursoId)) {
            const curso: CursoComDisciplinas = {
              id: atividade.cursoId,
              nome: atividade.cursoNome,
              disciplinas: [],
            }
            cursosMapEstrutura.set(atividade.cursoId, curso)
            estrutura.push(curso)
          }

          const curso = cursosMapEstrutura.get(atividade.cursoId)!

          // Disciplina
          const discKey = `${atividade.cursoId}-${atividade.disciplinaId}`
          if (!disciplinasMapEstrutura.has(discKey)) {
            const disciplina: DisciplinaComFrentes = {
              id: atividade.disciplinaId,
              nome: atividade.disciplinaNome,
              frentes: [],
            }
            disciplinasMapEstrutura.set(discKey, disciplina)
            curso.disciplinas.push(disciplina)
          }

          const disciplina = disciplinasMapEstrutura.get(discKey)!

          // Frente
          const frenteKey = `${atividade.disciplinaId}-${atividade.frenteId}`
          if (!frentesMapEstrutura.has(frenteKey)) {
            const frente: FrenteComModulos = {
              id: atividade.frenteId,
              nome: atividade.frenteNome,
              disciplinaId: atividade.disciplinaId,
              modulos: [],
            }
            frentesMapEstrutura.set(frenteKey, frente)
            disciplina.frentes.push(frente)
          }

          const frente = frentesMapEstrutura.get(frenteKey)!

          // Módulo
          if (!modulosMapEstrutura.has(atividade.moduloId)) {
            const modulo: ModuloComAtividades = {
              id: atividade.moduloId,
              nome: atividade.moduloNome,
              numeroModulo: atividade.moduloNumero,
              frenteId: atividade.frenteId,
              atividades: [],
            }
            modulosMapEstrutura.set(atividade.moduloId, modulo)
            frente.modulos.push(modulo)
          }

          const modulo = modulosMapEstrutura.get(atividade.moduloId)!
          modulo.atividades.push(atividade)
        })

        setEstruturaHierarquica(estrutura)
      } catch (err) {
        console.error('Erro ao carregar atividades:', err)
        const errorMessage = formatSupabaseError(err)
        console.error('Detalhes do erro:', {
          message: errorMessage,
          error: err,
          alunoId,
        })
        setError(`Erro ao carregar atividades: ${errorMessage}`)
      } finally {
        setIsLoadingAtividades(false)
      }
    }

    fetchAtividades()
  }, [alunoId, userRole, supabase])

  // Filtrar atividades baseado nos filtros
  const atividadesFiltradas = React.useMemo(() => {
    let filtradas = atividades

    if (cursoSelecionado) {
      filtradas = filtradas.filter((a) => a.cursoId === cursoSelecionado)
    }

    if (disciplinaSelecionada) {
      filtradas = filtradas.filter((a) => a.disciplinaId === disciplinaSelecionada)
    }

    if (frenteSelecionada) {
      filtradas = filtradas.filter((a) => a.frenteId === frenteSelecionada)
    }

    return filtradas
  }, [atividades, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])

  // Reagrupar estrutura filtrada
  const estruturaFiltrada = React.useMemo(() => {
    if (!cursoSelecionado && !disciplinaSelecionada && !frenteSelecionada) {
      return estruturaHierarquica
    }

    // Reagrupar apenas as atividades filtradas
    const estrutura: CursoComDisciplinas[] = []
    const cursosMap = new Map<string, CursoComDisciplinas>()
    const disciplinasMap = new Map<string, DisciplinaComFrentes>()
    const frentesMap = new Map<string, FrenteComModulos>()
    const modulosMap = new Map<string, ModuloComAtividades>()

    atividadesFiltradas.forEach((atividade) => {
      // Curso
      if (!cursosMap.has(atividade.cursoId)) {
        const curso: CursoComDisciplinas = {
          id: atividade.cursoId,
          nome: atividade.cursoNome,
          disciplinas: [],
        }
        cursosMap.set(atividade.cursoId, curso)
        estrutura.push(curso)
      }

      const curso = cursosMap.get(atividade.cursoId)!

      // Disciplina
      const discKey = `${atividade.cursoId}-${atividade.disciplinaId}`
      if (!disciplinasMap.has(discKey)) {
        const disciplina: DisciplinaComFrentes = {
          id: atividade.disciplinaId,
          nome: atividade.disciplinaNome,
          frentes: [],
        }
        disciplinasMap.set(discKey, disciplina)
        curso.disciplinas.push(disciplina)
      }

      const disciplina = disciplinasMap.get(discKey)!

      // Frente
      const frenteKey = `${atividade.disciplinaId}-${atividade.frenteId}`
      if (!frentesMap.has(frenteKey)) {
        const frente: FrenteComModulos = {
          id: atividade.frenteId,
          nome: atividade.frenteNome,
          disciplinaId: atividade.disciplinaId,
          modulos: [],
        }
        frentesMap.set(frenteKey, frente)
        disciplina.frentes.push(frente)
      }

      const frente = frentesMap.get(frenteKey)!

      // Módulo
      if (!modulosMap.has(atividade.moduloId)) {
        const modulo: ModuloComAtividades = {
          id: atividade.moduloId,
          nome: atividade.moduloNome,
          numeroModulo: atividade.moduloNumero,
          frenteId: atividade.frenteId,
          atividades: [],
        }
        modulosMap.set(atividade.moduloId, modulo)
        frente.modulos.push(modulo)
      }

      const modulo = modulosMap.get(atividade.moduloId)!
      modulo.atividades.push(atividade)
    })

    return estrutura
  }, [atividadesFiltradas, estruturaHierarquica, cursoSelecionado, disciplinaSelecionada, frenteSelecionada])

  const cursoSelecionadoNome = React.useMemo(
    () => cursos.find((c) => c.id === cursoSelecionado)?.nome ?? null,
    [cursos, cursoSelecionado],
  )
  const disciplinaSelecionadaNome = React.useMemo(
    () => disciplinas.find((d) => d.id === disciplinaSelecionada)?.nome ?? null,
    [disciplinas, disciplinaSelecionada],
  )
  const frenteSelecionadaNome = React.useMemo(
    () => frentes.find((f) => f.id === frenteSelecionada)?.nome ?? null,
    [frentes, frenteSelecionada],
  )

  // Handler para atualizar status do progresso (check simples)
  const handleStatusChange = async (atividadeId: string, status: StatusAtividade) => {
    if (!alunoId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada')
      }

      // Usar API para manter validações no backend
      const response = await fetch(`/api/progresso-atividade/atividade/${atividadeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar progresso')
      }

      const { data: progressoAtualizado } = await response.json()

      // Atualizar estado local com dados atualizados
      setAtividades((prev) =>
        prev.map((a) => {
          if (a.id === atividadeId) {
            return {
              ...a,
              progressoStatus: status,
              progressoDataInicio: progressoAtualizado.dataInicio || a.progressoDataInicio,
              progressoDataConclusao: progressoAtualizado.dataConclusao || a.progressoDataConclusao,
              // Limpar campos de desempenho se voltar para Pendente
              ...(status === 'Pendente' && {
                questoesTotais: null,
                questoesAcertos: null,
                dificuldadePercebida: null,
                anotacoesPessoais: null,
              }),
            }
          }
          return a
        }),
      )
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err)
      throw err
    }
  }

  // Handler para atualizar status com desempenho (check qualificado)
  const handleStatusChangeWithDesempenho = React.useCallback(
    async (
      atividadeId: string,
      status: StatusAtividade,
      desempenho: {
        questoesTotais: number
        questoesAcertos: number
        dificuldadePercebida: 'Muito Facil' | 'Facil' | 'Medio' | 'Dificil' | 'Muito Dificil'
        anotacoesPessoais?: string | null
      },
    ) => {
      if (!alunoId) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Sessão expirada')
        }

        // Chamar API para concluir com desempenho
        const response = await fetch(`/api/progresso-atividade/atividade/${atividadeId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status,
            desempenho,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao salvar desempenho')
        }

        const { data: progressoAtualizado } = await response.json()

        // Atualizar estado local com dados completos de desempenho
        setAtividades((prev) =>
          prev.map((a) => {
            if (a.id === atividadeId) {
              return {
                ...a,
                progressoStatus: status,
                progressoDataInicio: progressoAtualizado.dataInicio || a.progressoDataInicio,
                progressoDataConclusao: progressoAtualizado.dataConclusao || a.progressoDataConclusao,
                questoesTotais: progressoAtualizado.questoesTotais ?? null,
                questoesAcertos: progressoAtualizado.questoesAcertos ?? null,
                dificuldadePercebida: progressoAtualizado.dificuldadePercebida ?? null,
                anotacoesPessoais: progressoAtualizado.anotacoesPessoais ?? null,
              }
            }
            return a
          }),
        )
      } catch (err) {
        console.error('Erro ao salvar desempenho:', err)
        throw err
      }
    },
    [alunoId, supabase],
  )

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error && !atividades.length) {
    return (
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sala de Estudos</h1>
          <p className="text-muted-foreground">
            Checklist e acompanhamento do seu progresso nas atividades
          </p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Erro</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasFilters = !!(cursoSelecionado || disciplinaSelecionada || frenteSelecionada)

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Erro</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <ProgressoStatsCard
        atividades={atividadesFiltradas}
        totalGeral={atividades.length}
        hasFilters={hasFilters}
        contexto={{
          curso: cursoSelecionadoNome,
          disciplina: disciplinaSelecionadaNome,
          frente: frenteSelecionadaNome,
        }}
      />

      <SalaEstudosFilters
        cursos={cursos}
        disciplinas={disciplinas}
        frentes={frentes}
        cursoSelecionado={cursoSelecionado}
        disciplinaSelecionada={disciplinaSelecionada}
        frenteSelecionada={frenteSelecionada}
        onCursoChange={(id) => {
          setCursoSelecionado(id)
          setDisciplinaSelecionada('')
          setFrenteSelecionada('')
        }}
        onDisciplinaChange={(id) => {
          setDisciplinaSelecionada(id)
          setFrenteSelecionada('')
        }}
        onFrenteChange={setFrenteSelecionada}
      />

      {isLoadingAtividades ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : estruturaFiltrada.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <School className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardDescription>
              {atividades.length === 0
                ? 'Você ainda não possui atividades disponíveis. Entre em contato com seu professor.'
                : 'Nenhuma atividade encontrada com os filtros selecionados.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {estruturaFiltrada.map((curso) => (
            <div key={curso.id} className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">{curso.nome}</h2>
              </div>
              {curso.disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="space-y-3 ml-4">
                  <h3 className="text-xl font-medium text-muted-foreground">{disciplina.nome}</h3>
                  {disciplina.frentes.map((frente) => (
                    <div key={frente.id} className="space-y-2 ml-4">
                      <h4 className="text-lg font-medium text-muted-foreground">{frente.nome}</h4>
                      {frente.modulos.map((modulo) => (
                        <ModuloActivitiesAccordion
                          key={modulo.id}
                          modulo={modulo}
                          onStatusChange={handleStatusChange}
                          onStatusChangeWithDesempenho={handleStatusChangeWithDesempenho}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

