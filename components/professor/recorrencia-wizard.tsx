"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/server"
import { cn } from "@/lib/utils"

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

const SLOT_DURATIONS = [15, 30, 45, 60]

interface RecorrenciaData {
  tipo_servico: 'plantao' | 'mentoria'
  data_inicio: Date | null
  data_fim: Date | null
  dias_semana: number[]
  hora_inicio: string
  hora_fim: string
  duracao_slot_minutos: number
}

interface RecorrenciaWizardProps {
  professorId: string
  empresaId: string
  onSuccess?: () => void
}

export function RecorrenciaWizard({ professorId, empresaId, onSuccess }: RecorrenciaWizardProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<RecorrenciaData>({
    tipo_servico: 'plantao',
    data_inicio: new Date(),
    data_fim: null,
    dias_semana: [],
    hora_inicio: '09:00',
    hora_fim: '18:00',
    duracao_slot_minutos: 30,
  })

  const handleNext = () => {
    if (step === 1 && !data.tipo_servico) {
      toast.error("Selecione o tipo de serviço")
      return
    }
    if (step === 2 && (!data.data_inicio || (data.data_fim && data.data_fim < data.data_inicio))) {
      toast.error("Data de início inválida ou data de fim anterior à data de início")
      return
    }
    if (step === 3 && data.dias_semana.length === 0) {
      toast.error("Selecione pelo menos um dia da semana")
      return
    }
    if (step === 4 && (!data.hora_inicio || !data.hora_fim || data.hora_fim <= data.hora_inicio)) {
      toast.error("Horários inválidos")
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!data.data_inicio) {
      toast.error("Data de início é obrigatória")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = await createClient()
      
      // Criar um padrão de recorrência para cada dia selecionado
      const recorrencias = data.dias_semana.map(dia => ({
        professor_id: professorId,
        empresa_id: empresaId,
        tipo_servico: data.tipo_servico,
        data_inicio: format(data.data_inicio!, 'yyyy-MM-dd'),
        data_fim: data.data_fim ? format(data.data_fim, 'yyyy-MM-dd') : null,
        dia_semana: dia,
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        duracao_slot_minutos: data.duracao_slot_minutos,
        ativo: true,
      }))

      const { error } = await supabase
        .from('agendamento_recorrencia')
        .insert(recorrencias)

      if (error) throw error

      toast.success("Padrão de recorrência criado com sucesso!")
      onSuccess?.()
    } catch (error) {
      console.error("Error creating recurrence:", error)
      toast.error("Erro ao criar padrão de recorrência")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configurar Disponibilidade Recorrente</CardTitle>
        <CardDescription>
          Configure padrões de disponibilidade que se repetem automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2",
                    s < step ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Tipo de Serviço */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Serviço</Label>
              <Select
                value={data.tipo_servico}
                onValueChange={(value) =>
                  setData({ ...data, tipo_servico: value as 'plantao' | 'mentoria' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plantao">Plantão</SelectItem>
                  <SelectItem value="mentoria">Mentoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Período de Vigência */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.data_inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.data_inicio ? (
                      format(data.data_inicio, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.data_inicio || undefined}
                    onSelect={(date) => setData({ ...data, data_inicio: date || null })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data de Fim (Opcional - deixe vazio para recorrência indefinida)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.data_fim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.data_fim ? (
                      format(data.data_fim, "PPP", { locale: ptBR })
                    ) : (
                      <span>Recorrência indefinida</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.data_fim || undefined}
                    onSelect={(date) => setData({ ...data, data_fim: date || null })}
                    disabled={(date) =>
                      data.data_inicio ? date < data.data_inicio : date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Step 3: Dias da Semana */}
        {step === 3 && (
          <div className="space-y-4">
            <Label>Selecione os dias da semana</Label>
            <div className="grid grid-cols-2 gap-4">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={data.dias_semana.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setData({
                          ...data,
                          dias_semana: [...data.dias_semana, day.value],
                        })
                      } else {
                        setData({
                          ...data,
                          dias_semana: data.dias_semana.filter((d) => d !== day.value),
                        })
                      }
                    }}
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Horários */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={data.hora_inicio}
                onChange={(e) => setData({ ...data, hora_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário de Fim</Label>
              <Input
                type="time"
                value={data.hora_fim}
                onChange={(e) => setData({ ...data, hora_fim: e.target.value })}
              />
            </div>
            <div>
              <Label>Duração dos Slots (minutos)</Label>
              <Select
                value={data.duracao_slot_minutos.toString()}
                onValueChange={(value) =>
                  setData({ ...data, duracao_slot_minutos: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_DURATIONS.map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 5: Revisão */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Serviço</Label>
              <p className="text-sm capitalize">{data.tipo_servico}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <p className="text-sm">
                {data.data_inicio && format(data.data_inicio, "PPP", { locale: ptBR })}
                {data.data_fim
                  ? ` até ${format(data.data_fim, "PPP", { locale: ptBR })}`
                  : " (indefinido)"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dias da Semana</Label>
              <p className="text-sm">
                {data.dias_semana
                  .map((d) => DAYS.find((day) => day.value === d)?.label)
                  .join(", ")}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horários</Label>
              <p className="text-sm">
                {data.hora_inicio} - {data.hora_fim}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duração dos Slots</Label>
              <p className="text-sm">{data.duracao_slot_minutos} minutos</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {step < 5 ? (
            <Button onClick={handleNext}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

