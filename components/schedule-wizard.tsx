'use client'

import React, { useState } from 'react'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CalendarIcon, Loader2, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { cn } from '@/lib/utils'

const wizardSchema = z.object({
  data_inicio: z.date({ required_error: 'Data de início é obrigatória' }),
  data_fim: z.date({ required_error: 'Data de término é obrigatória' }),
  dias_semana: z.number().min(1).max(7),
  horas_dia: z.number().min(1),
  ferias: z.array(z.object({
    inicio: z.string(),
    fim: z.string(),
  })).default([]),
  curso_alvo_id: z.string().optional(),
  disciplinas_ids: z.array(z.string()).min(1, 'Selecione pelo menos uma disciplina'),
  prioridade_minima: z.number().min(1).max(5),
  modalidade: z.enum(['paralelo', 'sequencial']),
  ordem_frentes_preferencia: z.array(z.string()).optional(),
  nome: z.string().min(1, 'Nome do cronograma é obrigatório'),
}).refine((data) => data.data_fim > data.data_inicio, {
  message: 'Data de término deve ser posterior à data de início',
  path: ['data_fim'],
})

type WizardFormData = z.infer<typeof wizardSchema>

const STEPS = [
  { id: 1, title: 'Definições de Tempo' },
  { id: 2, title: 'Conteúdo e Prioridade' },
  { id: 3, title: 'Estratégia de Estudo' },
  { id: 4, title: 'Revisão e Geração' },
]

export function ScheduleWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [frentes, setFrentes] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      dias_semana: 5,
      horas_dia: 4,
      prioridade_minima: 4,
      modalidade: 'paralelo',
      disciplinas_ids: [],
      ferias: [],
    },
  })

  // Carregar cursos e disciplinas
  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar cursos do aluno
      const { data: matriculas } = await supabase
        .from('matriculas')
        .select('curso_id, cursos(*)')
        .eq('aluno_id', user.id)
        .eq('ativo', true)

      if (matriculas) {
        const cursosData = matriculas.map((m: any) => m.cursos).filter(Boolean)
        setCursos(cursosData)
      }

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

  // Carregar frentes quando disciplinas são selecionadas
  React.useEffect(() => {
    async function loadFrentes() {
      const disciplinasIds = form.watch('disciplinas_ids')
      if (disciplinasIds.length === 0) {
        setFrentes([])
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('frentes')
        .select('*')
        .in('disciplina_id', disciplinasIds)
        .order('nome')

      if (data) {
        setFrentes(data)
      }
    }

    loadFrentes()
  }, [form.watch('disciplinas_ids')])

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
        ferias: data.ferias,
        horas_dia: data.horas_dia,
        dias_semana: data.dias_semana,
        prioridade_minima: data.prioridade_minima,
        disciplinas_ids: data.disciplinas_ids,
        modalidade: data.modalidade,
        curso_alvo_id: data.curso_alvo_id,
        nome: data.nome.trim(), // Garantir que não há espaços extras
        ordem_frentes_preferencia: data.ordem_frentes_preferencia,
      }

      // Chamar Edge Function usando o cliente Supabase
      console.log('Invocando Edge Function com body:', requestBody)
      
      const { data: result, error: functionError } = await supabase.functions.invoke('gerar-cronograma', {
        body: requestBody,
      })

      console.log('Resultado da Edge Function:', { result, functionError })

      if (functionError) {
        console.error('Erro na Edge Function:', functionError)
        // Se o erro contém detalhes, mostrar mensagem mais específica
        if (functionError.context?.statusCode) {
          setError(`Erro ${functionError.context.statusCode}: ${functionError.message || 'Erro ao gerar cronograma'}`)
        } else {
          setError(functionError.message || 'Erro ao gerar cronograma. Verifique sua conexão e tente novamente.')
        }
        setLoading(false)
        return
      }

      if (result?.error) {
        if (result.error === 'Tempo insuficiente' && result.detalhes) {
          setError(
            `Tempo insuficiente! Necessário ${result.detalhes.horas_necessarias}h, disponível ${result.detalhes.horas_disponiveis}h. ` +
            `Sugestão: ${result.detalhes.horas_dia_necessarias}h por dia.`
          )
        } else {
          setError(result.error || 'Erro ao gerar cronograma')
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
    } catch (err: any) {
      console.error('Erro na requisição:', err)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, verifique se a Edge Function está configurada corretamente.')
      } else {
        setError(err.message || 'Erro ao gerar cronograma')
      }
      setLoading(false)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate as any)
    
    if (isValid) {
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
        return ['disciplinas_ids', 'prioridade_minima']
      case 3:
        return ['modalidade']
      default:
        return []
    }
  }

  const addFerias = () => {
    const ferias = form.getValues('ferias')
    form.setValue('ferias', [
      ...ferias,
      { inicio: '', fim: '' },
    ])
  }

  const removeFerias = (index: number) => {
    const ferias = form.getValues('ferias')
    form.setValue('ferias', ferias.filter((_, i) => i !== index))
  }

  const progress = (currentStep / STEPS.length) * 100

  if (loadingData) {
    return <div className="container mx-auto py-6">Carregando...</div>
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Criar Cronograma de Estudos</CardTitle>
          <CardDescription>
            Configure seu plano de estudos personalizado em {STEPS.length} passos
          </CardDescription>
          <Progress value={progress} className="mt-4" />
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
            {/* Step 1: Definições de Tempo */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch('data_inicio') && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch('data_inicio') ? (
                            format(form.watch('data_inicio'), "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch('data_inicio')}
                          onSelect={(date) => form.setValue('data_inicio', date!)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.data_inicio && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.data_inicio.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch('data_fim') && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch('data_fim') ? (
                            format(form.watch('data_fim'), "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch('data_fim')}
                          onSelect={(date) => form.setValue('data_fim', date!)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.data_fim && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.data_fim.message}
                      </p>
                    )}
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
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Início</Label>
                        <Input
                          type="date"
                          value={periodo.inicio}
                          onChange={(e) => {
                            const ferias = form.getValues('ferias')
                            ferias[index].inicio = e.target.value
                            form.setValue('ferias', ferias)
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Fim</Label>
                        <Input
                          type="date"
                          value={periodo.fim}
                          onChange={(e) => {
                            const ferias = form.getValues('ferias')
                            ferias[index].fim = e.target.value
                            form.setValue('ferias', ferias)
                          }}
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

            {/* Step 2: Conteúdo e Prioridade */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {cursos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Curso (Opcional)</Label>
                    <Select
                      value={form.watch('curso_alvo_id')}
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Disciplinas *</Label>
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 border rounded-md">
                    {disciplinas.map((disciplina) => (
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
                  {form.formState.errors.disciplinas_ids && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.disciplinas_ids.message}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Nível de Prioridade Mínima</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((nivel) => (
                      <Card
                        key={nivel}
                        className={cn(
                          "cursor-pointer transition-colors",
                          form.watch('prioridade_minima') === nivel
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                        onClick={() => form.setValue('prioridade_minima', nivel)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="font-bold text-lg">{nivel}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {nivel === 1 && 'Super Extensivo'}
                            {nivel === 2 && 'Extensivo'}
                            {nivel === 3 && 'Intensivo'}
                            {nivel === 4 && 'Super Intensivo'}
                            {nivel === 5 && 'Revisão'}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Estratégia de Estudo */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Modalidade de Estudo</Label>
                  <RadioGroup
                    value={form.watch('modalidade')}
                    onValueChange={(value) => form.setValue('modalidade', value as 'paralelo' | 'sequencial')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paralelo" id="paralelo" />
                      <Label htmlFor="paralelo" className="font-normal cursor-pointer">
                        Estudo Paralelo (Todas as frentes juntas - Recomendado)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sequencial" id="sequencial" />
                      <Label htmlFor="sequencial" className="font-normal cursor-pointer">
                        Estudo Sequencial (Uma frente por vez)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

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

            {/* Step 4: Revisão e Geração */}
            {currentStep === 4 && (
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
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período:</span>
                      <span>
                        {form.watch('data_inicio') && format(form.watch('data_inicio'), "dd/MM/yyyy", { locale: ptBR })} - {' '}
                        {form.watch('data_fim') && format(form.watch('data_fim'), "dd/MM/yyyy", { locale: ptBR })}
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
                      <span className="text-muted-foreground">Disciplinas:</span>
                      <span>{form.watch('disciplinas_ids').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridade mínima:</span>
                      <span>{form.watch('prioridade_minima')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modalidade:</span>
                      <span className="capitalize">{form.watch('modalidade')}</span>
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
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
    </div>
  )
}

