'use client'

import * as React from 'react'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { ChevronDown, Upload, FileText, AlertCircle, CheckCircle2, Trash2, Plus } from 'lucide-react'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { useRouter } from 'next/navigation'
import AddActivityModal from '../../../components/conteudos/add-activity-modal'
import InlineEditableTitle from '@/components/shared/inline-editable-title'

type Disciplina = {
  id: string
  nome: string
}

type CursoOption = {
  id: string
  nome: string
  disciplina_id: string | null // deprecated, manter para compatibilidade
  disciplina_nome: string | null // deprecated, manter para compatibilidade
  disciplinaIds: string[] // IDs das disciplinas do curso
}

type Frente = {
  id: string
  nome: string
  disciplina_id: string
  curso_id: string | null
}

type Modulo = {
  id: string
  nome: string
  numero_modulo: number | null
  frente_id: string
  importancia?: 'Alta' | 'Media' | 'Baixa' | 'Base' | null
  aulas: Aula[]
}

type Aula = {
  id: string
  nome: string
  numero_aula: number | null
  tempo_estimado_minutos: number | null
  prioridade: number | null
}

type CSVRow = {
  modulo?: string
  'nome do modulo'?: string
  'Nome do Módulo'?: string
  aula?: string
  'nome da aula'?: string
  'Nome da Aula'?: string
  tempo?: string
  prioridade?: string
  disciplina?: string
  frente?: string
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

type AtividadeItem = {
  id: string
  moduloId: string
  tipo: TipoAtividade
  titulo: string
  ordemExibicao: number
}

type RegraAtividade = {
  id: string
  cursoId: string | null
  tipoAtividade: TipoAtividade
  nomePadrao: string
  frequenciaModulos: number
  comecarNoModulo: number
  acumulativo: boolean
  gerarNoUltimo: boolean
}

export default function ConteudosClientPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [userId, setUserId] = React.useState<string | null>(null)
  const [cursos, setCursos] = React.useState<CursoOption[]>([])
  const [cursoSelecionado, setCursoSelecionado] = React.useState<string>('')
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [disciplinasDoCurso, setDisciplinasDoCurso] = React.useState<Disciplina[]>([]) // Disciplinas do curso selecionado
  const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
  const [frenteNome, setFrenteNome] = React.useState<string>('')
  const [arquivo, setArquivo] = React.useState<File | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingContent, setIsLoadingContent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [frentes, setFrentes] = React.useState<Frente[]>([])
  const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')
  const [modulos, setModulos] = React.useState<Modulo[]>([])
  const [isProfessor, setIsProfessor] = React.useState<boolean | null>(null)
  const [modulosAbertos, setModulosAbertos] = React.useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteCronogramasInfo, setDeleteCronogramasInfo] = React.useState<{
    hasCronogramas: boolean
    count: number
  } | null>(null)
  const [, setRegras] = React.useState<RegraAtividade[]>([])
  const [isAddingActivity, setIsAddingActivity] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState<string | null>(null)
  const [editingImportancia, setEditingImportancia] = React.useState<string | null>(null)
  const [atividadesPorModulo, setAtividadesPorModulo] = React.useState<Record<string, AtividadeItem[]>>({})
  const [isCreatingActivity, setIsCreatingActivity] = React.useState(false)
  const [isUpdatingEstrutura, setIsUpdatingEstrutura] = React.useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false)

  const fetchWithAuth = React.useCallback(
    async (input: string, init?: RequestInit) => {
      const { data: { session } } = await supabase.auth.getSession()
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

  // Verificar se o usuário é professor
  React.useEffect(() => {
    const checkProfessor = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/aluno/login')
          return
        }
        setUserId(user.id)

        const { data, error } = await supabase
          .from('professores')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Erro ao verificar professor:', error)
          setIsProfessor(false)
          return
        }

        setIsProfessor(!!data)
        if (!data) {
          setError('Acesso negado. Apenas professores podem acessar esta página.')
        }
      } catch (err) {
        console.error('Erro ao verificar permissões:', err)
        setIsProfessor(false)
      }
    }

    checkProfessor()
  }, [supabase, router])

  // Carregar disciplinas (todas - usado para outros propósitos)
  React.useEffect(() => {
    const fetchDisciplinas = async () => {
      try {
        const { data, error } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .order('nome', { ascending: true })

        if (error) throw error
        setDisciplinas(data || [])
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err)
        setError('Erro ao carregar disciplinas')
      }
    }

    if (isProfessor) {
      fetchDisciplinas()
    }
  }, [supabase, isProfessor])

  // Carregar disciplinas do curso selecionado
  React.useEffect(() => {
    const fetchDisciplinasDoCurso = async () => {
      if (!cursoSelecionado) {
        setDisciplinasDoCurso([])
        setDisciplinaSelecionada('')
        return
      }

      try {
        // Buscar disciplinas do curso através da tabela cursos_disciplinas
        const { data: cursosDisciplinas, error: cdError } = await supabase
          .from('cursos_disciplinas')
          .select('disciplina_id')
          .eq('curso_id', cursoSelecionado)

        if (cdError) {
          console.error('Erro ao carregar disciplinas do curso:', cdError)
          setDisciplinasDoCurso([])
          return
        }

        if (!cursosDisciplinas || cursosDisciplinas.length === 0) {
          setDisciplinasDoCurso([])
          setDisciplinaSelecionada('')
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
          return
        }

        setDisciplinasDoCurso(disciplinasData || [])
        
        // Se houver apenas uma disciplina, selecionar automaticamente
        if (disciplinasData && disciplinasData.length === 1) {
          setDisciplinaSelecionada(disciplinasData[0].id)
        } else {
          setDisciplinaSelecionada('')
        }
      } catch (err) {
        console.error('Erro ao carregar disciplinas do curso:', err)
        setDisciplinasDoCurso([])
        setDisciplinaSelecionada('')
      }
    }

    fetchDisciplinasDoCurso()
  }, [supabase, cursoSelecionado])

  React.useEffect(() => {
    const fetchCursos = async () => {
      if (!isProfessor || !userId) {
        setCursos([])
        return
      }

      try {
        // Primeiro, buscar os cursos sem o join para evitar problemas de RLS
        const { data: cursosData, error: cursosError } = await supabase
          .from('cursos')
          .select('id, nome, disciplina_id')
          .order('nome', { ascending: true })

        if (cursosError) {
          console.error('Erro na query de cursos:', {
            message: cursosError.message,
            details: cursosError.details,
            hint: cursosError.hint,
            code: cursosError.code,
          })
          throw cursosError
        }

        console.log('Cursos carregados:', cursosData?.length || 0, cursosData)

        // Buscar disciplinas separadamente se necessário (opcional, para exibir nomes)
        let disciplinasMap: Map<string, string> = new Map()
        try {
          const { data: disciplinasData } = await supabase
            .from('disciplinas')
            .select('id, nome')
          
          if (disciplinasData) {
            disciplinasMap = new Map(
              disciplinasData.map((d) => [d.id, d.nome])
            )
          }
        } catch (discError) {
          console.warn('Erro ao carregar disciplinas (opcional):', discError)
          // Não é crítico, continuamos sem os nomes das disciplinas
        }

        // Buscar disciplinas de cada curso através da tabela cursos_disciplinas
        const cursoIds = cursosData?.map(c => c.id) || []
        const cursosDisciplinasMap: Map<string, string[]> = new Map()
        
        if (cursoIds.length > 0) {
          try {
            const { data: cursosDisciplinasData } = await supabase
              .from('cursos_disciplinas')
              .select('curso_id, disciplina_id')
              .in('curso_id', cursoIds)
            
            if (cursosDisciplinasData) {
              // Agrupar disciplinas por curso
              cursosDisciplinasData.forEach((cd) => {
                const existing = cursosDisciplinasMap.get(cd.curso_id) || []
                cursosDisciplinasMap.set(cd.curso_id, [...existing, cd.disciplina_id])
              })
            }
          } catch (cdError) {
            console.warn('Erro ao carregar cursos_disciplinas (opcional):', cdError)
            // Não é crítico, continuamos sem os IDs das disciplinas
          }
        }

        const mapped =
          cursosData?.map((curso) => ({
            id: curso.id,
            nome: curso.nome,
            disciplina_id: curso.disciplina_id,
            disciplina_nome: curso.disciplina_id ? disciplinasMap.get(curso.disciplina_id) ?? null : null,
            disciplinaIds: cursosDisciplinasMap.get(curso.id) || [],
          })) ?? []

        console.log('Cursos mapeados:', mapped.length, mapped)
        setCursos(mapped)
      } catch (err) {
        console.error('Erro ao carregar cursos:', {
          error: err,
          errorString: String(err),
          errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          errorType: typeof err,
          errorKeys: err && typeof err === 'object' ? Object.keys(err) : [],
        })
        setError('Erro ao carregar cursos disponíveis. Verifique se você tem permissão para acessar os cursos.')
      }
    }

    fetchCursos()
  }, [supabase, isProfessor, userId])

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

    if (isProfessor) {
      fetchRegras()
    }
  }, [cursoSelecionado, fetchWithAuth, isProfessor])

  const loadAtividadesForModulos = React.useCallback(
    async (moduloIds: string[]) => {
      if (moduloIds.length === 0) {
        setAtividadesPorModulo({})
        return
      }

      const { data, error } = await supabase
        .from('atividades')
        .select('id, modulo_id, tipo, titulo, ordem_exibicao')
        .in('modulo_id', moduloIds)
        .order('ordem_exibicao', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar atividades:', error)
        return
      }

      const agrupado = (data || [])
        .filter((atividade): atividade is typeof atividade & { modulo_id: string } => 
          atividade.modulo_id !== null
        )
        .reduce<Record<string, AtividadeItem[]>>((acc, atividade) => {
          const lista = acc[atividade.modulo_id] || []
          lista.push({
            id: atividade.id,
            moduloId: atividade.modulo_id,
            titulo: atividade.titulo,
            tipo: atividade.tipo as TipoAtividade,
            ordemExibicao: atividade.ordem_exibicao ?? 0,
          })
          acc[atividade.modulo_id] = lista
          return acc
        }, {})

      setAtividadesPorModulo(agrupado)
    },
    [supabase],
  )

  // Carregar frentes quando disciplina for selecionada
  React.useEffect(() => {
    const fetchFrentes = async () => {
      if (!disciplinaSelecionada || !cursoSelecionado) {
        setFrentes([])
        setModulos([])
        return
      }

      try {
        setIsLoadingContent(true)
        // Buscar frentes da disciplina que pertencem ao curso selecionado
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, curso_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .eq('curso_id', cursoSelecionado)
          .order('nome', { ascending: true })

        if (error) {
          console.error('Erro na query de frentes:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            disciplinaSelecionada,
            cursoSelecionado,
          })
          throw error
        }

        console.log('Frentes carregadas:', data?.length || 0, data)
        setFrentes(
          (data || [])
            .filter((f): f is typeof f & { disciplina_id: string } => f.disciplina_id !== null)
            .map((f) => ({ id: f.id, nome: f.nome, disciplina_id: f.disciplina_id, curso_id: f.curso_id }))
        )
      } catch (err) {
        console.error('Erro ao carregar frentes:', {
          error: err,
          errorString: String(err),
          errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          disciplinaSelecionada,
          cursoSelecionado,
        })
        setError('Erro ao carregar frentes. Verifique se a disciplina e o curso estão corretos.')
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchFrentes()
  }, [supabase, disciplinaSelecionada, cursoSelecionado])

  // Carregar módulos e aulas quando frente for selecionada
  React.useEffect(() => {
    const fetchModulosEAulas = async () => {
      if (!frenteSelecionada) {
        setModulos([])
        return
      }

      try {
        setIsLoadingContent(true)
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id, importancia')
          .eq('frente_id', frenteSelecionada)
          .order('numero_modulo', { ascending: true })

        if (modulosError) throw modulosError

        if (modulosData && modulosData.length > 0) {
          // Filtrar módulos com frente_id não nulo
          const modulosValidos = modulosData.filter(
            (m): m is typeof m & { frente_id: string } => m.frente_id !== null
          )
          
          // Buscar aulas para cada módulo
          const modulosComAulas = await Promise.all(
            modulosValidos.map(async (modulo) => {
              const { data: aulasData, error: aulasError } = await supabase
                .from('aulas')
                .select('id, nome, numero_aula, tempo_estimado_minutos, prioridade')
                .eq('modulo_id', modulo.id)
                .order('numero_aula', { ascending: true })

              if (aulasError) {
                console.error('Erro ao carregar aulas:', aulasError)
                return { ...modulo, aulas: [] }
              }

              // Log para debug (apenas em desenvolvimento)
              if (process.env.NODE_ENV === 'development' && aulasData && aulasData.length > 0) {
                console.log(`Aulas do módulo ${modulo.nome}:`, aulasData)
              }

              return { ...modulo, aulas: aulasData || [] }
            })
          )

        setModulos(modulosComAulas)
        await loadAtividadesForModulos(modulosValidos.map((m) => m.id))
        } else {
          setModulos([])
        setAtividadesPorModulo({})
        }
      } catch (err) {
        console.error('Erro ao carregar módulos e aulas:', err)
        setError('Erro ao carregar conteúdo')
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchModulosEAulas()
}, [supabase, frenteSelecionada, loadAtividadesForModulos])

  // Função auxiliar para formatar tempo (minutos para minutos/horas)
  const formatTempo = (minutos: number): string => {
    if (minutos < 60) {
      return `${minutos} min`
    }
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (mins === 0) {
      return `${horas}h`
    }
    return `${horas}h ${mins} min`
  }

  // Calcular estatísticas de um módulo
  const calcularEstatisticasModulo = (aulas: Aula[]) => {
    const totalAulas = aulas.length
    const tempoTotal = aulas.reduce((sum, aula) => {
      return sum + (aula.tempo_estimado_minutos || 0)
    }, 0)
    return { totalAulas, tempoTotal }
  }

  // Calcular estatísticas de uma frente (todos os módulos)
  const calcularEstatisticasFrente = (modulos: Modulo[]) => {
    const totalAulas = modulos.reduce((sum, modulo) => sum + modulo.aulas.length, 0)
    const tempoTotal = modulos.reduce((sum, modulo) => {
      return sum + modulo.aulas.reduce((aulaSum, aula) => {
        return aulaSum + (aula.tempo_estimado_minutos || 0)
      }, 0)
    }, 0)
    return { totalAulas, tempoTotal }
  }


  const handleCursoChange = (value: string) => {
    setCursoSelecionado(value)
    setFrenteSelecionada('')
    setFrentes([])
    setModulos([])
    setFrenteNome('')
    // A disciplina será definida automaticamente pelo useEffect quando as disciplinas do curso forem carregadas
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        setError('Por favor, selecione um arquivo CSV ou XLSX')
        return
      }
      setArquivo(file)
      setError(null)
    }
  }

  const parseXLSX = async (file: File): Promise<CSVRow[]> => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('O arquivo XLSX não contém planilhas')
      }

      const headers: string[] = []
      const rows: CSVRow[] = []

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row = headers (normalize to lowercase)
          row.eachCell({ includeEmpty: false }, (cell) => {
            headers.push(String(cell.value ?? '').trim().toLowerCase())
          })
        } else {
          // Data rows
          const rowObj: CSVRow = {} as CSVRow
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = headers[colNumber - 1]
            if (header) {
              const value = cell.value
              const stringValue = value != null ? String(value).trim() : ''
              ;(rowObj as Record<string, string>)[header] = stringValue
            }
          })
          // Only add non-empty rows
          if (Object.values(rowObj).some(val => val && String(val).trim())) {
            rows.push(rowObj)
          }
        }
      })

      if (rows.length === 0) {
        throw new Error('O arquivo XLSX está vazio')
      }

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && rows.length > 0) {
        console.log('XLSX processado - Primeira linha:', rows[0])
        console.log('XLSX processado - Chaves disponíveis:', Object.keys(rows[0]))
      }

      return rows
    } catch (error) {
      throw new Error(`Erro ao processar XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const parseCSV = (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: 'greedy', // Pula linhas vazias de forma mais agressiva
        transformHeader: (header: string) => {
          // Normaliza os nomes das colunas (remove espaços, converte para minúsculas)
          return header.trim().toLowerCase()
        },
        transform: (value: string) => {
          // Remove apenas espaços em branco (o PapaParse já lida com aspas corretamente)
          return value.trim()
        },
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ';', // Padrão Excel PT-BR
        preview: 0, // Processa todo o arquivo
        worker: false, // Não usar worker para melhor compatibilidade
        fastMode: false, // Modo normal para melhor tratamento de erros
        complete: (results) => {
          // Filtrar erros por tipo
          const quoteErrors = results.errors.filter((error) => 
            error.type === 'Quotes' || 
            error.message?.toLowerCase().includes('quote') ||
            error.message?.toLowerCase().includes('aspas')
          )
          
          const delimiterErrors = results.errors.filter((error) => 
            error.type === 'Delimiter'
          )

          // Se houver muitos erros de aspas mas ainda tiver dados, continuar
          // (pode ser um problema menor de formatação)
          if (quoteErrors.length > 0 && results.data.length === 0) {
            const errorMsg = quoteErrors[0].message || 'Erro ao processar campos com aspas'
            reject(
              new Error(
                `Erro ao processar CSV: ${errorMsg}. ` +
                `Verifique se todas as aspas no arquivo estão fechadas corretamente. ` +
                `Dica: Se houver aspas dentro de um campo, elas devem ser escapadas com aspas duplas ("").`
              )
            )
            return
          }

          // Se houver erros de delimitador e nenhum dado, rejeitar
          if (delimiterErrors.length > 0 && results.data.length === 0) {
            reject(
              new Error(
                `Erro ao processar CSV: Não foi possível identificar o delimitador. ` +
                `Certifique-se de que o arquivo usa ponto e vírgula (;) como separador (padrão Excel PT-BR).`
              )
            )
            return
          }

          // Se tiver dados, mesmo com alguns erros, continuar
          if (results.data.length === 0) {
            reject(
              new Error(
                'Nenhum dado válido encontrado no CSV. ' +
                'Verifique se o arquivo contém as colunas necessárias: Módulo (ou Nome do Módulo) e Aula (ou Nome da Aula).'
              )
            )
            return
          }

          // Avisar sobre erros não críticos, mas não bloquear
          if (results.errors.length > 0) {
            console.warn('Avisos ao processar CSV (processando mesmo assim):', results.errors)
          }

          resolve(results.data)
        },
        error: (error) => {
          reject(new Error(`Erro ao ler arquivo: ${error.message}`))
        },
      })
    })
  }

  // Função auxiliar para buscar valor de coluna de forma flexível (case-insensitive)
  const getColumnValue = (row: CSVRow, possibleNames: string[]): string => {
    const rowObj = row as Record<string, string | undefined>
    const rowKeys = Object.keys(rowObj)
    
    // Normalizar todas as chaves do row para comparação
    const normalizedRowKeys = rowKeys.map(k => ({
      original: k,
      normalized: k.toLowerCase().trim().replace(/\s+/g, ' '), // Normalizar espaços
    }))
    
    // Tentar encontrar a coluna correspondente
    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ')
      
      // 1. Busca exata normalizada
      const exactMatch = normalizedRowKeys.find(
        nk => nk.normalized === normalizedName
      )
      if (exactMatch) {
        const value = rowObj[exactMatch.original]
        if (value != null && String(value).trim()) {
          return String(value).trim()
        }
      }
      
      // 2. Busca parcial (contém o nome)
      const partialMatch = normalizedRowKeys.find(
        nk => nk.normalized.includes(normalizedName) || normalizedName.includes(nk.normalized)
      )
      if (partialMatch) {
        const value = rowObj[partialMatch.original]
        if (value != null && String(value).trim()) {
          return String(value).trim()
        }
      }
    }
    
    return ''
  }

  const validateCSV = (rows: CSVRow[]): string | null => {
    if (rows.length === 0) {
      return 'O arquivo CSV está vazio'
    }

    const firstRow = rows[0]
    const moduloNome = getColumnValue(firstRow, [
      'modulo',
      'nome do modulo',
      'nome do módulo',
      'módulo',
      'Módulo',
      'Nome do Módulo',
      'nome do modulo',
    ])
    const aulaNome = getColumnValue(firstRow, [
      'aula',
      'nome da aula',
      'Nome da Aula',
      'Aula',
    ])

    if (!moduloNome) {
      return 'O CSV deve conter uma coluna "Módulo" ou "Nome do Módulo"'
    }

    if (!aulaNome) {
      return 'O CSV deve conter uma coluna "Aula" ou "Nome da Aula"'
    }

    return null
  }

  const normalizeImportancia = (value?: string | null): 'Alta' | 'Media' | 'Baixa' | 'Base' | null => {
    if (!value) return null
    const normalized = value.trim().toLowerCase()
    if (['alta', 'a'].includes(normalized)) return 'Alta'
    if (['media', 'média', 'm'].includes(normalized)) return 'Media'
    if (['baixa', 'b'].includes(normalized)) return 'Baixa'
    if (['base'].includes(normalized)) return 'Base'
    return null
  }

  const transformCSVToJSON = (rows: CSVRow[]) => {
    const jsonData: Array<{
      modulo_numero: number
      modulo_nome: string
      aula_numero: number
      aula_nome: string
      tempo?: number | null
      prioridade?: number | null
      importancia?: 'Alta' | 'Media' | 'Baixa' | 'Base' | null
    }> = []

    // Mapear números de módulo e aula para garantir sequência
    const moduloMap = new Map<string, number>()
    const aulaMap = new Map<string, number>()

    rows.forEach((row) => {
      const moduloNome = getColumnValue(row, [
        'modulo',
        'nome do modulo',
        'nome do módulo',
        'módulo',
        'Módulo',
        'Nome do Módulo',
        'nome do modulo',
      ])
      // Buscar Nome da Aula - PRIORIDADE para nomes completos, evitar "Aula" que pode ter números
      // Primeiro, buscar colunas que claramente são nomes
      const aulaNome = getColumnValue(row, [
        'nome da aula',
        'Nome da Aula',
        'nome aula',
        'nomeaula',
      ])
      
      // Se não encontrou, tentar "nome" genérico (mas validar que não é número)
      let aulaNomeFinal = aulaNome
      if (!aulaNomeFinal) {
        const nomeCol = getColumnValue(row, ['nome', 'Nome'])
        // Validar que não é apenas número
        if (nomeCol && (isNaN(Number(nomeCol)) || nomeCol.trim().length > 3)) {
          aulaNomeFinal = nomeCol
        }
      }
      
      // Se ainda não encontrou, tentar "Aula" mas validar que não é apenas número
      if (!aulaNomeFinal) {
        const aulaCol = getColumnValue(row, ['aula', 'Aula'])
        // Se a coluna "Aula" contém texto (não é apenas número), usar ela
        if (aulaCol && (isNaN(Number(aulaCol)) || aulaCol.trim().length > 3)) {
          aulaNomeFinal = aulaCol
        } else if (aulaCol) {
          // Se "Aula" contém apenas número, buscar outra coluna que possa ter o nome
          console.warn('Coluna "Aula" contém apenas número. Buscando alternativa...', {
            aulaCol,
            rowKeys: Object.keys(row),
          })
        }
      }

      if (!moduloNome || !aulaNomeFinal) {
        // Log para debug (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          console.log('Linha ignorada - dados faltando:', {
            moduloNome,
            aulaNome: aulaNomeFinal,
            rowKeys: Object.keys(row),
            row,
          })
        }
        return // Pular linhas incompletas
      }

      // Validar que aulaNomeFinal não é apenas um número
      if (!isNaN(Number(aulaNomeFinal)) && aulaNomeFinal.trim().length <= 3) {
        // Se for apenas número, tentar buscar outra coluna
        console.warn('Aviso: Nome da aula parece ser um número. Tentando buscar coluna alternativa...', {
          aulaNomeFinal,
          rowKeys: Object.keys(row),
          row,
        })
        // Tentar buscar qualquer coluna que contenha "nome" e não seja número
        const alternativeNome = Object.keys(row).find(key => {
          const normalizedKey = key.toLowerCase().trim()
          const value = (row as Record<string, string>)[key]
          return (
            (normalizedKey.includes('nome') || normalizedKey.includes('aula')) &&
            value &&
            (isNaN(Number(value)) || value.trim().length > 3)
          )
        })
        if (alternativeNome) {
          aulaNomeFinal = String((row as Record<string, string>)[alternativeNome]).trim()
          console.log('Coluna alternativa encontrada:', alternativeNome, aulaNomeFinal)
        } else {
          console.error('Não foi possível encontrar nome da aula válido. Linha ignorada.')
          return
        }
      }

      // Log para debug (apenas em desenvolvimento) - verificar se os dados estão corretos
      if (process.env.NODE_ENV === 'development' && rows.indexOf(row) < 3) {
        console.log('Dados extraídos da linha:', {
          moduloNome,
          aulaNome: aulaNomeFinal,
          rowKeys: Object.keys(row),
          row,
        })
      }

      // Obter ou criar número do módulo
      let moduloNumero = moduloMap.get(moduloNome)
      if (moduloNumero === undefined) {
        moduloNumero = moduloMap.size + 1
        moduloMap.set(moduloNome, moduloNumero)
      }

      // Obter ou criar número da aula (dentro do módulo)
      const aulaKey = `${moduloNome}-${aulaNomeFinal}`
      let aulaNumero = aulaMap.get(aulaKey)
      if (aulaNumero === undefined) {
        // Contar quantas aulas já existem neste módulo
        const aulasNoModulo = Array.from(aulaMap.keys()).filter(k => k.startsWith(`${moduloNome}-`)).length
        aulaNumero = aulasNoModulo + 1
        aulaMap.set(aulaKey, aulaNumero)
      }

      // Buscar tempo e prioridade de forma flexível
      const tempoStr = getColumnValue(row, [
        'tempo',
        'Tempo',
        'tempo estimado',
        'tempo_estimado',
        'tempo estimado (minutos)',
        'tempo (minutos)',
        'duração',
        'duracao',
      ])
      const prioridadeStr = getColumnValue(row, [
        'prioridade',
        'Prioridade',
        'pri',
        'prio',
        'prioridade (0-5)',
        'prioridade (1-5)',
        'prioridade 0-5',
        'prioridade 1-5',
      ])

      const tempo = tempoStr ? parseInt(tempoStr, 10) : null
      const prioridade = prioridadeStr ? parseInt(prioridadeStr, 10) : null
      const importancia = normalizeImportancia(
        getColumnValue(row, ['importancia', 'prioridade', 'importância', 'Importancia', 'Prioridade']),
      )

      const aulaData = {
        modulo_numero: moduloNumero,
        modulo_nome: moduloNome,
        aula_numero: aulaNumero,
        aula_nome: aulaNomeFinal.trim(), // Garantir que está limpo e usar o nome correto
        tempo: tempo && !isNaN(tempo) && tempo > 0 ? tempo : null,
        prioridade:
          prioridade !== null && !isNaN(prioridade) && prioridade >= 0 && prioridade <= 5
            ? prioridade
            : null,
        importancia: importancia ?? null,
      }

      // Log para debug (apenas em desenvolvimento) - primeiras 3 linhas
      if (process.env.NODE_ENV === 'development' && jsonData.length < 3) {
        console.log('Dados preparados para RPC:', aulaData)
      }

      jsonData.push(aulaData)
    })

    return jsonData
  }

  const handleImport = async () => {
    if (!disciplinaSelecionada) {
      setError('Por favor, selecione uma disciplina')
      return
    }

    if (!frenteNome.trim()) {
      setError('Por favor, informe o nome da frente')
      return
    }

    if (!arquivo) {
      setError('Por favor, selecione um arquivo CSV ou XLSX')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      if (!cursoSelecionado) {
        setError('Selecione um curso antes de importar.')
        return
      }

      // Detectar tipo de arquivo e fazer parse apropriado
      const isXLSX = arquivo.name.toLowerCase().endsWith('.xlsx') || 
                     arquivo.name.toLowerCase().endsWith('.xls')
      
      let csvRows: CSVRow[]
      
      if (isXLSX) {
        csvRows = await parseXLSX(arquivo)
      } else {
        csvRows = await parseCSV(arquivo)
      }
      const validationError = validateCSV(csvRows)
      if (validationError) {
        setError(validationError)
        return
      }

      // Transformar em JSON
      const jsonData = transformCSVToJSON(csvRows)

      if (jsonData.length === 0) {
        setError('Nenhum dado válido encontrado no CSV')
        return
      }

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Dados a serem enviados para RPC:', jsonData.slice(0, 3)) // Primeiras 3 linhas
      }

      // Buscar nome da disciplina
      const disciplina = disciplinas.find(d => d.id === disciplinaSelecionada)
      if (!disciplina) {
        setError('Disciplina não encontrada')
        return
      }

      // Chamar RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('importar_cronograma_aulas', {
        p_curso_id: cursoSelecionado,
        p_disciplina_nome: disciplina.nome,
        p_frente_nome: frenteNome.trim(),
        p_conteudo: jsonData,
      })

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Resposta da RPC:', { rpcData, rpcError })
      }

      if (rpcError) {
        throw rpcError
      }

      setSuccessMessage('Cronograma importado com sucesso!')
      setArquivo(null)
      
      // Resetar input de arquivo
      const fileInput = document.getElementById('csv-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Recarregar conteúdo (apenas refetch de frentes)
      if (disciplinaSelecionada) {
        setFrenteSelecionada('')
      }

      // Forçar refresh da página para atualizar seletores
      router.refresh()
    } catch (err) {
      console.error('Erro ao importar:', err)

      // Supabase RPC costuma retornar PostgrestError como objeto (não instanceof Error)
      // com campos: message, details, hint, code.
      const formatUnknownError = (e: unknown) => {
        if (typeof e === 'string') return e
        if (e instanceof Error) return e.message || 'Erro ao importar cronograma'

        if (e && typeof e === 'object') {
          // Algumas libs retornam erros com props não-enumeráveis, e o console mostra "{}".
          const obj = e as Record<string, unknown>
          const getString = (v: unknown) => (typeof v === 'string' ? v : v != null ? String(v) : undefined)

          const message =
            getString(obj.message) ||
            getString(obj.error_description) ||
            getString(obj.error) ||
            'Erro ao importar cronograma'

          const details = getString(obj.details)
          const hint = getString(obj.hint)
          const code = getString(obj.code)

          // Tenta também inspecionar propriedades não-enumeráveis
          const allProps = Object.getOwnPropertyNames(e)
            .filter((k) => k !== 'stack')
            .slice(0, 12)
          const propsPreview =
            allProps.length > 0
              ? `props: ${allProps
                  .map((k) => `${k}=${getString((obj as any)[k]) ?? '[obj]'}`)
                  .join(', ')}`
              : null

          if (process.env.NODE_ENV === 'development') {
            return [message, details, hint, code, propsPreview].filter(Boolean).join(' | ')
          }

          return message
        }

        return 'Erro ao importar cronograma'
      }

      setError(formatUnknownError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const checkCronogramasBeforeDelete = async () => {
    if (!frenteSelecionada) return

    try {
      // Buscar módulos da frente
      const { data: modulosData } = await supabase
        .from('modulos')
        .select('id')
        .eq('frente_id', frenteSelecionada)

      if (!modulosData || modulosData.length === 0) {
        setDeleteCronogramasInfo({ hasCronogramas: false, count: 0 })
        setShowDeleteDialog(true)
        return
      }

      const moduloIds = modulosData.map(m => m.id)

      // Buscar aulas dos módulos
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('id')
        .in('modulo_id', moduloIds)

      if (!aulasData || aulasData.length === 0) {
        setDeleteCronogramasInfo({ hasCronogramas: false, count: 0 })
        setShowDeleteDialog(true)
        return
      }

      const aulaIds = aulasData.map(a => a.id)

      // Verificar se há cronogramas que referenciam essas aulas
      const { data: cronogramasData } = await supabase
        .from('cronograma_itens')
        .select('cronograma_id')
        .in('aula_id', aulaIds)
        .limit(100) // Limitar para performance

      if (cronogramasData && cronogramasData.length > 0) {
        const cronogramaIds = new Set(cronogramasData.map(c => c.cronograma_id))
        setDeleteCronogramasInfo({
          hasCronogramas: true,
          count: cronogramaIds.size,
        })
      } else {
        setDeleteCronogramasInfo({ hasCronogramas: false, count: 0 })
      }

      setShowDeleteDialog(true)
    } catch (err) {
      console.error('Erro ao verificar cronogramas:', err)
      // Continuar mesmo com erro
      setDeleteCronogramasInfo({ hasCronogramas: false, count: 0 })
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteFrente = async () => {
    if (!frenteSelecionada) {
      setError('Nenhuma frente selecionada')
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      setSuccessMessage(null)

      // Buscar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Sessão expirada. Por favor, faça login novamente.')
        return
      }

      // Chamar API para deletar
      const response = await fetch(`/api/frente/${frenteSelecionada}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar frente')
      }

      setSuccessMessage('Frente deletada com sucesso!')
      
      // Limpar estado
      setFrenteSelecionada('')
      setModulos([])
      setShowDeleteDialog(false)
      setDeleteCronogramasInfo(null)

      // Recarregar frentes
      if (disciplinaSelecionada && cursoSelecionado) {
        const { data: frentesData, error: frentesError } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id, curso_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .or(`curso_id.eq.${cursoSelecionado},curso_id.is.null`)
          .order('nome', { ascending: true })

        if (!frentesError && frentesData) {
          setFrentes(
            frentesData
              .filter((f): f is typeof f & { disciplina_id: string } => f.disciplina_id !== null)
              .map((f) => ({ id: f.id, nome: f.nome, disciplina_id: f.disciplina_id, curso_id: f.curso_id }))
          )
        }
      }
    } catch (err) {
      console.error('Erro ao deletar frente:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar frente'
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateActivity = async (
    moduloId: string,
    payload: { tipo: TipoAtividade; titulo: string; ordemExibicao?: number },
  ) => {
    try {
      setIsCreatingActivity(true)
      const response = await fetchWithAuth('/api/atividade', {
        method: 'POST',
        body: JSON.stringify({
          modulo_id: moduloId,
          tipo: payload.tipo,
          titulo: payload.titulo,
          ordem_exibicao: payload.ordemExibicao,
        }),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao criar atividade')
      }

      await loadAtividadesForModulos([moduloId])
      setSuccessMessage('Atividade criada com sucesso')
    } catch (err) {
      console.error('Erro ao criar atividade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar atividade')
    } finally {
      setIsCreatingActivity(false)
    }
  }

  const handleUpdateActivityTitle = async (atividadeId: string, moduloId: string, titulo: string) => {
    try {
      const response = await fetchWithAuth(`/api/atividade/${atividadeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ titulo }),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao atualizar atividade')
      }

      await loadAtividadesForModulos([moduloId])
      setSuccessMessage('Título atualizado')
    } catch (err) {
      console.error('Erro ao atualizar título:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar atividade')
    } finally {
      setEditingTitle(null)
    }
  }

  const handleUpdateModuloImportancia = async (moduloId: string, importancia: 'Alta' | 'Media' | 'Baixa' | 'Base') => {
    try {
      const response = await fetchWithAuth(`/api/modulo/${moduloId}`, {
        method: 'PATCH',
        body: JSON.stringify({ importancia }),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao atualizar importância do módulo')
      }

      // Atualizar o módulo na lista local
      setModulos((prev) =>
        prev.map((m) => (m.id === moduloId ? { ...m, importancia } : m))
      )

      setEditingImportancia(null)
      setSuccessMessage('Importância do módulo atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao atualizar importância:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar importância do módulo')
      setEditingImportancia(null)
    }
  }

  const handleDeleteActivity = async (atividadeId: string, moduloId: string) => {
    try {
      const response = await fetchWithAuth(`/api/atividade/${atividadeId}`, {
        method: 'DELETE',
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body?.error || 'Erro ao remover atividade')
      }

      await loadAtividadesForModulos([moduloId])
      setSuccessMessage('Atividade removida')
    } catch (err) {
      console.error('Erro ao remover atividade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao remover atividade')
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

      if (modulos.length > 0) {
        await loadAtividadesForModulos(modulos.map((m) => m.id))
      }
      setSuccessMessage('Estrutura atualizada com sucesso')
    } catch (err) {
      console.error('Erro ao atualizar estrutura:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estrutura de atividades')
    } finally {
      setIsUpdatingEstrutura(false)
      setShowUpdateDialog(false)
    }
  }



  if (isProfessor === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Verificando permissões...</div>
      </div>
    )
  }

  if (isProfessor === false) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              {error || 'Apenas professores podem acessar esta página.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Conteúdo Programático</h1>
        <p className="text-muted-foreground">
          Faça upload de arquivos CSV para cadastrar ou atualizar o conteúdo programático
        </p>
      </div>

      {/* Card de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Escolha o curso, informe a disciplina e a frente correspondente, depois envie o arquivo da planilha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          {cursos.length === 0 && (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Nenhum curso encontrado.{' '}
              <Button variant="link" className="h-auto p-0 align-baseline" onClick={() => router.push('/curso')}>
                Crie um curso antes de importar conteúdos.
              </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="curso">Curso</Label>
              <Select value={cursoSelecionado} onValueChange={handleCursoChange}>
                <SelectTrigger id="curso">
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
              <div className="text-xs text-muted-foreground">
                Precisa de um curso novo?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 align-baseline"
                  onClick={() => router.push('/curso')}
                >
                  Abrir gestão de cursos
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina do Curso</Label>
              {!cursoSelecionado ? (
                <Input
                  id="disciplina"
                  value="Selecione um curso primeiro"
                  disabled
                />
              ) : disciplinasDoCurso.length === 0 ? (
                <Input
                  id="disciplina"
                  value="Este curso não possui disciplinas cadastradas"
                  disabled
                />
              ) : disciplinasDoCurso.length === 1 ? (
                <Input
                  id="disciplina"
                  value={disciplinasDoCurso[0].nome}
                  disabled
                />
              ) : (
                <Select
                  value={disciplinaSelecionada}
                  onValueChange={(value) => {
                    setDisciplinaSelecionada(value)
                    setFrenteSelecionada('')
                    setModulos([])
                  }}
                >
                  <SelectTrigger id="disciplina">
                    <SelectValue placeholder="Selecione uma disciplina do curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinasDoCurso.map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frente">Nome da Frente</Label>
            <Input
              id="frente"
              placeholder="Ex: Frente A"
              value={frenteNome}
              onChange={(e) => setFrenteNome(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {arquivo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {arquivo.name}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: CSV (padrão ; e UTF-8) ou XLSX. O arquivo deve conter colunas: Módulo (ou Nome do Módulo), Aula (ou Nome da Aula), Tempo (opcional), Prioridade (opcional, 0-5) e Importância (opcional: Alta, Media, Baixa, Base).
            </p>
          </div>

          <Button
            onClick={handleImport}
            disabled={
              isLoading ||
              !cursoSelecionado ||
              !disciplinaSelecionada ||
              !frenteNome.trim() ||
              !arquivo
            }
            className="w-full"
          >
            {isLoading ? (
              <>Processando...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar e Atualizar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card de Visualização */}
      {disciplinaSelecionada && (
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Atual</CardTitle>
            <CardDescription>
              Visualize o conteúdo programático cadastrado para esta disciplina
            </CardDescription>
          </CardHeader>
          <CardContent>
            {frentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma frente cadastrada para esta disciplina
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Selecione uma frente para visualizar:</Label>
                <Select
                  value={frenteSelecionada}
                  onValueChange={setFrenteSelecionada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma frente" />
                  </SelectTrigger>
                  <SelectContent>
                    {frentes.map((frente) => (
                      <SelectItem key={frente.id} value={frente.id}>
                        {frente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isLoadingContent && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}

            {!isLoadingContent && frenteSelecionada && modulos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum módulo cadastrado para esta frente
              </div>
            )}

            {!isLoadingContent && frenteSelecionada && modulos.length > 0 && (
              <div className="mt-4 space-y-4">
                {/* Resumo da Frente */}
                {(() => {
                  const { totalAulas, tempoTotal } = calcularEstatisticasFrente(modulos)
                  const frenteSelecionadaData = frentes.find(f => f.id === frenteSelecionada)
                  return (
                    <div className="rounded-lg border-2 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              Resumo: {frenteSelecionadaData?.nome || 'N/A'}
                            </h3>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={checkCronogramasBeforeDelete}
                              disabled={isDeleting}
                              className="ml-4"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar Frente
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {modulos.length} módulo{modulos.length !== 1 ? 's' : ''} cadastrado{modulos.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold">
                            {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
                          </div>
                          {tempoTotal > 0 && (
                            <div className="text-lg text-muted-foreground mt-1">
                              {formatTempo(tempoTotal)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
                
                <div className="space-y-2">
                  {modulos.map((modulo) => {
                  const isOpen = modulosAbertos.has(modulo.id)
                  const toggleModulo = (open: boolean) => {
                    setModulosAbertos((prev) => {
                      const next = new Set(prev)
                      if (open) {
                        next.add(modulo.id)
                      } else {
                        next.delete(modulo.id)
                      }
                      return next
                    })
                  }
                  
                  return (
                    <Collapsible key={modulo.id} open={isOpen} onOpenChange={toggleModulo}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          <span className="font-medium">
                            Módulo {modulo.numero_modulo || 'N/A'}: {modulo.nome}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {modulo.aulas.length} aula{modulo.aulas.length !== 1 ? 's' : ''}
                        </span>
                      </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-3">
                        {/* Seletor de Importância */}
                        <div className="flex items-center justify-between rounded-md border p-3 bg-muted/50">
                          <div className="flex items-center gap-3 flex-1">
                            <Label className="text-sm font-medium whitespace-nowrap">Importância:</Label>
                            {editingImportancia === modulo.id ? (
                              <Select
                                value={modulo.importancia || 'Media'}
                                onValueChange={(value) => {
                                  handleUpdateModuloImportancia(modulo.id, value as 'Alta' | 'Media' | 'Baixa' | 'Base')
                                }}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Alta">Alta</SelectItem>
                                  <SelectItem value="Media">Média</SelectItem>
                                  <SelectItem value="Baixa">Baixa</SelectItem>
                                  <SelectItem value="Base">Base</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-normal">
                                  {modulo.importancia || 'Media'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingImportancia(modulo.id)}
                                  className="h-7 px-2"
                                >
                                  Editar
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-right ml-2">
                            Usado no modo &quot;Mais Cobrados&quot; dos flashcards
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Atividades</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddingActivity(modulo.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Atividade
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {(atividadesPorModulo[modulo.id] || []).length === 0 ? (
                            <div className="text-sm text-muted-foreground">Nenhuma atividade cadastrada</div>
                          ) : (
                            (atividadesPorModulo[modulo.id] || []).map((atividade) => (
                              <div
                                key={atividade.id}
                                className="flex items-center justify-between rounded-md border p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary">{atividade.tipo}</Badge>
                                  <InlineEditableTitle
                                    value={atividade.titulo}
                                    isEditing={editingTitle === atividade.id}
                                    onStartEdit={() => setEditingTitle(atividade.id)}
                                    onCancel={() => setEditingTitle(null)}
                                    onSave={(novoTitulo) =>
                                      handleUpdateActivityTitle(atividade.id, atividade.moduloId, novoTitulo)
                                    }
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  {atividade.ordemExibicao !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      Ordem: {atividade.ordemExibicao}
                                    </span>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteActivity(atividade.id, atividade.moduloId)}
                                    aria-label="Excluir atividade"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">Aula</TableHead>
                                <TableHead>Nome da Aula</TableHead>
                                <TableHead className="w-24">Tempo (min)</TableHead>
                                <TableHead className="w-24">Prioridade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {modulo.aulas.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                    Nenhuma aula cadastrada
                                  </TableCell>
                                </TableRow>
                              ) : (
                                modulo.aulas.map((aula) => {
                                  // Debug: verificar dados da aula
                                  if (process.env.NODE_ENV === 'development') {
                                    console.log('Aula renderizada:', {
                                      id: aula.id,
                                      nome: aula.nome,
                                      tempo_estimado_minutos: aula.tempo_estimado_minutos,
                                      numero_aula: aula.numero_aula,
                                      prioridade: aula.prioridade,
                                    })
                                  }
                                  
                                  return (
                                    <TableRow key={aula.id}>
                                      <TableCell>{aula.numero_aula ?? 'N/A'}</TableCell>
                                      <TableCell className="font-medium">
                                        {aula.nome || 'Sem nome'}
                                      </TableCell>
                                      <TableCell>
                                        {aula.tempo_estimado_minutos != null && aula.tempo_estimado_minutos > 0
                                          ? `${aula.tempo_estimado_minutos} min`
                                          : '-'}
                                      </TableCell>
                                    <TableCell>
                                      {aula.prioridade !== null && aula.prioridade !== undefined ? (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                          {aula.prioridade}
                                        </span>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                  </TableRow>
                                  )
                                })
                              )}
                            </TableBody>
                          </Table>
                          {/* Resumo do Módulo */}
                          {modulo.aulas.length > 0 && (() => {
                            const { totalAulas, tempoTotal } = calcularEstatisticasModulo(modulo.aulas)
                            return (
                              <div className="border-t bg-muted/50 px-4 py-3">
                                <div className="flex items-center justify-between text-sm font-medium">
                                  <span>Total do Módulo:</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">
                                      {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
                                    </span>
                                    {tempoTotal > 0 && (
                                      <span className="text-muted-foreground">
                                        {formatTempo(tempoTotal)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </CollapsibleContent>
                    </Collapsible>
                  )
                })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AddActivityModal
        open={!!isAddingActivity}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingActivity(null)
          }
        }}
        onSubmit={async (data) => {
          if (!isAddingActivity) return
          await handleCreateActivity(isAddingActivity, data)
          setIsAddingActivity(null)
        }}
        isSubmitting={isCreatingActivity}
      />

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar Estrutura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai apagar todas as atividades (incluindo manuais) da frente selecionada e gerar novamente pela regras configuradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingEstrutura}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAtualizarEstrutura}
              disabled={isUpdatingEstrutura}
            >
              {isUpdatingEstrutura ? 'Atualizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de deleção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Frente Completa?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta ação irá deletar permanentemente a frente <strong>{frentes.find(f => f.id === frenteSelecionada)?.nome}</strong> e todo o seu conteúdo:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Todos os módulos da frente</li>
                  <li>Todas as aulas dos módulos</li>
                  <li>A própria frente</li>
                </ul>
                {deleteCronogramasInfo?.hasCronogramas && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Atenção: Esta frente possui {deleteCronogramasInfo.count} cronograma(s) associado(s).
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Os itens do cronograma que referenciam estas aulas podem ficar órfãos após a deleção.
                    </p>
                  </div>
                )}
                <p className="text-sm font-medium text-destructive mt-3">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFrente}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar Frente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

