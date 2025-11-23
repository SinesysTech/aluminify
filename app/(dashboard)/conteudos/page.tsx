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
import { ChevronDown, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'

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

export default function ConteudosPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
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

  // Verificar se o usuário é professor
  React.useEffect(() => {
    const checkProfessor = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

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

  // Carregar disciplinas
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

  // Carregar frentes quando disciplina for selecionada
  React.useEffect(() => {
    const fetchFrentes = async () => {
      if (!disciplinaSelecionada) {
        setFrentes([])
        setModulos([])
        return
      }

      try {
        setIsLoadingContent(true)
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .order('nome', { ascending: true })

        if (error) throw error
        setFrentes(data || [])
      } catch (err) {
        console.error('Erro ao carregar frentes:', err)
        setError('Erro ao carregar frentes')
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchFrentes()
  }, [supabase, disciplinaSelecionada])

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
          .select('id, nome, numero_modulo, frente_id')
          .eq('frente_id', frenteSelecionada)
          .order('numero_modulo', { ascending: true })

        if (modulosError) throw modulosError

        if (modulosData && modulosData.length > 0) {
          // Buscar aulas para cada módulo
          const modulosComAulas = await Promise.all(
            modulosData.map(async (modulo) => {
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
        } else {
          setModulos([])
        }
      } catch (err) {
        console.error('Erro ao carregar módulos e aulas:', err)
        setError('Erro ao carregar conteúdo')
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchModulosEAulas()
  }, [supabase, frenteSelecionada])

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

  const parseXLSX = (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            reject(new Error('Erro ao ler arquivo XLSX'))
            return
          }

          // Usar ArrayBuffer ao invés de binary string (readAsBinaryString está deprecated)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Pegar a primeira planilha
          const firstSheetName = workbook.SheetNames[0]
          if (!firstSheetName) {
            reject(new Error('O arquivo XLSX não contém planilhas'))
            return
          }

          const worksheet = workbook.Sheets[firstSheetName]
          
          // Converter para JSON (retorna objetos com chaves sendo os nomes das colunas)
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: '', // Valor padrão para células vazias
            raw: false, // Converter números para strings
            blankrows: false, // Ignorar linhas vazias
          })

          if (jsonData.length === 0) {
            reject(new Error('O arquivo XLSX está vazio'))
            return
          }

          // Normalizar os nomes das colunas (case-insensitive) e converter para CSVRow
          const rows: CSVRow[] = jsonData
            .map((row) => {
              const rowObj: CSVRow = {} as CSVRow
              
              // Normalizar todas as chaves para minúsculas
              Object.keys(row).forEach((key) => {
                const normalizedKey = key.trim().toLowerCase()
                const value = row[key]
                // Converter valor para string, tratando null/undefined
                const stringValue = value != null ? String(value).trim() : ''
                // Usar type assertion para permitir qualquer chave
                ;(rowObj as Record<string, string>)[normalizedKey] = stringValue
              })
              
              return rowObj
            })
            .filter(row => {
              // Filtrar linhas completamente vazias
              return Object.values(row).some(val => val && String(val).trim())
            })

          // Log para debug (apenas em desenvolvimento)
          if (process.env.NODE_ENV === 'development' && rows.length > 0) {
            console.log('XLSX processado - Primeira linha:', rows[0])
            console.log('XLSX processado - Chaves disponíveis:', Object.keys(rows[0]))
          }

          if (rows.length === 0) {
            reject(new Error('Nenhum dado válido encontrado no arquivo XLSX'))
            return
          }

          resolve(rows)
        } catch (error) {
          reject(new Error(`Erro ao processar XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo XLSX'))
      }

      // Usar readAsArrayBuffer ao invés de readAsBinaryString (deprecated)
      reader.readAsArrayBuffer(file)
    })
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
        quotes: true, // Permite campos com aspas
        quoteChar: '"',
        escapeChar: '"',
        delimiter: '', // Auto-detect delimiter
        newline: '', // Auto-detect newline
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
                `Certifique-se de que o arquivo usa vírgula (,) como separador.`
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

  const transformCSVToJSON = (rows: CSVRow[]) => {
    const jsonData: Array<{
      modulo_numero: number
      modulo_nome: string
      aula_numero: number
      aula_nome: string
      tempo?: number | null
      prioridade?: number | null
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
        'prioridade (1-5)',
        'prioridade 1-5',
      ])

      const tempo = tempoStr ? parseInt(tempoStr, 10) : null
      const prioridade = prioridadeStr ? parseInt(prioridadeStr, 10) : null

      const aulaData = {
        modulo_numero: moduloNumero,
        modulo_nome: moduloNome,
        aula_numero: aulaNumero,
        aula_nome: aulaNomeFinal.trim(), // Garantir que está limpo e usar o nome correto
        tempo: tempo && !isNaN(tempo) && tempo > 0 ? tempo : null,
        prioridade: prioridade && !isNaN(prioridade) && prioridade >= 1 && prioridade <= 5 ? prioridade : null,
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

      // Recarregar conteúdo
      if (disciplinaSelecionada) {
        const { data: frentesData } = await supabase
          .from('frentes')
          .select('id, nome')
          .eq('disciplina_id', disciplinaSelecionada)
          .eq('nome', frenteNome.trim())
          .maybeSingle()

        if (frentesData) {
          setFrenteSelecionada(frentesData.id)
        }
      }
    } catch (err) {
      console.error('Erro ao importar:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar cronograma'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
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
            Selecione a disciplina, informe o nome da frente e faça upload do arquivo CSV
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select
                value={disciplinaSelecionada}
                onValueChange={(value) => {
                  setDisciplinaSelecionada(value)
                  setFrenteSelecionada('')
                  setModulos([])
                }}
              >
                <SelectTrigger id="disciplina">
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
              <Label htmlFor="frente">Nome da Frente</Label>
              <Input
                id="frente"
                placeholder="Ex: Frente A"
                value={frenteNome}
                onChange={(e) => setFrenteNome(e.target.value)}
              />
            </div>
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
              Formatos aceitos: CSV ou XLSX. O arquivo deve conter colunas: Módulo (ou Nome do Módulo), Aula (ou Nome da Aula), Tempo (opcional), Prioridade (opcional, 1-5)
            </p>
          </div>

          <Button
            onClick={handleImport}
            disabled={isLoading || !disciplinaSelecionada || !frenteNome.trim() || !arquivo}
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
                        <div>
                          <h3 className="text-lg font-semibold">
                            Resumo: {frenteSelecionadaData?.nome || 'N/A'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {modulos.length} módulo{modulos.length !== 1 ? 's' : ''} cadastrado{modulos.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
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
                      <div className="mt-2 rounded-md border">
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
                                    {aula.prioridade ? (
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
    </div>
  )
}

