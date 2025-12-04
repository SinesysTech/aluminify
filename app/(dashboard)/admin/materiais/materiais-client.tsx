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
import { MaterialsFilters } from '@/components/materials-filters'
import { ModuleAccordion } from '@/components/module-accordion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ModuloComAtividades } from './types'
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

export default function MateriaisClientPage() {
  const router = useRouter()
  const supabase = createClient()

  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [frentes, setFrentes] = React.useState<Frente[]>([])
  const [disciplinaSelecionada, setDisciplinaSelecionada] = React.useState<string>('')
  const [frenteSelecionada, setFrenteSelecionada] = React.useState<string>('')
  const [modulosComAtividades, setModulosComAtividades] = React.useState<ModuloComAtividades[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingFrentes, setIsLoadingFrentes] = React.useState(false)
  const [isLoadingAtividades, setIsLoadingAtividades] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Carregar disciplinas
  React.useEffect(() => {
    const fetchDisciplinas = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .order('nome', { ascending: true })

        if (error) throw error
        setDisciplinas(data || [])
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err)
        setError('Erro ao carregar disciplinas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDisciplinas()
  }, [supabase])

  // Carregar frentes quando disciplina muda
  React.useEffect(() => {
    const fetchFrentes = async () => {
      if (!disciplinaSelecionada) {
        setFrentes([])
        setFrenteSelecionada('')
        setModulosComAtividades([])
        return
      }

      try {
        setIsLoadingFrentes(true)
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .order('nome', { ascending: true })

        if (error) throw error
        setFrentes(data || [])
        setFrenteSelecionada('')
        setModulosComAtividades([])
      } catch (err) {
        console.error('Erro ao carregar frentes:', err)
        setError('Erro ao carregar frentes')
      } finally {
        setIsLoadingFrentes(false)
      }
    }

    fetchFrentes()
  }, [supabase, disciplinaSelecionada])

  // Carregar módulos e atividades quando frente muda
  React.useEffect(() => {
    const fetchModulosEAtividades = async () => {
      if (!frenteSelecionada) {
        setModulosComAtividades([])
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

        const { data: atividadesData } = await response.json()

        // Agrupar atividades por módulo
        const modulosComAtividadesMap = new Map<string, ModuloComAtividades>()

        modulosData.forEach((modulo) => {
          modulosComAtividadesMap.set(modulo.id, {
            id: modulo.id,
            nome: modulo.nome,
            numero_modulo: modulo.numero_modulo,
            frente_id: modulo.frente_id,
            atividades: [],
          })
        })

        atividadesData.forEach((atividade: any) => {
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
  }, [frenteSelecionada])

  const handleGenerateStructure = async () => {
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

  const handleUploadSuccess = () => {
    // Recarregar atividades após upload
    const frenteId = frenteSelecionada
    setFrenteSelecionada('')
    setTimeout(() => {
      setFrenteSelecionada(frenteId)
    }, 100)
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Área de Estudo e Gestão de Materiais</h1>
        <p className="text-muted-foreground">
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <MaterialsFilters
        disciplinas={disciplinas}
        frentes={frentes}
        disciplinaSelecionada={disciplinaSelecionada}
        frenteSelecionada={frenteSelecionada}
        onDisciplinaChange={setDisciplinaSelecionada}
        onFrenteChange={setFrenteSelecionada}
        onGenerateStructure={handleGenerateStructure}
        isGenerating={isGenerating}
        isLoadingFrentes={isLoadingFrentes}
      />

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
              Clique em "Gerar Estrutura" para criar os slots de atividades automaticamente.
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

