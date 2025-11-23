'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface CronogramaItem {
  id: string
  aula_id: string
  semana_numero: number
  ordem_na_semana: number
  concluido: boolean
  data_conclusao: string | null
  aulas: {
    id: string
    nome: string
    numero_aula: number | null
    tempo_estimado_minutos: number | null
  }
}

interface ScheduleListProps {
  itensPorSemana: Record<number, CronogramaItem[]>
  dataInicio: string
  onToggleConcluido: (itemId: string, concluido: boolean) => void
}

export function ScheduleList({ itensPorSemana, dataInicio, onToggleConcluido }: ScheduleListProps) {
  const semanas = Object.keys(itensPorSemana)
    .map(Number)
    .sort((a, b) => a - b)

  const getSemanaDates = (semanaNumero: number) => {
    const inicio = new Date(dataInicio)
    const inicioSemana = addDays(inicio, (semanaNumero - 1) * 7)
    const fimSemana = addDays(inicioSemana, 6)
    return { inicioSemana, fimSemana }
  }

  return (
    <Accordion type="multiple" className="w-full">
      {semanas.map((semana) => {
        const itens = itensPorSemana[semana]
        const concluidos = itens.filter((item) => item.concluido).length
        const { inicioSemana, fimSemana } = getSemanaDates(semana)

        return (
          <AccordionItem key={semana} value={`semana-${semana}`}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full mr-4">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    Semana {semana} ({format(inicioSemana, 'dd/MM')} - {format(fimSemana, 'dd/MM')})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {concluidos} de {itens.length} aulas
                  </span>
                  <Progress
                    value={(concluidos / itens.length) * 100}
                    className="w-24 h-2"
                  />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.concluido}
                      onCheckedChange={(checked) =>
                        onToggleConcluido(item.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Badge variant="outline">
                          Aula {item.aulas.numero_aula || 'N/A'}
                        </Badge>
                      </div>
                      <div className="font-medium">{item.aulas.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.aulas.tempo_estimado_minutos
                          ? `${item.aulas.tempo_estimado_minutos} min`
                          : 'Duração não informada'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

