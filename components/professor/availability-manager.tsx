"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getDisponibilidade, upsertDisponibilidade } from "@/app/actions/agendamentos"
import { Loader2, Plus, Save, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

interface AvailabilityRule {
  id?: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  ativo: boolean
}

interface AvailabilityManagerProps {
  professorId: string
}

export function AvailabilityManager({ professorId }: AvailabilityManagerProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const data = await getDisponibilidade(professorId)
        const mapped: AvailabilityRule[] = data.map((d: { id: string; dia_semana: number; hora_inicio: string; hora_fim: string; ativo: boolean }) => ({
          id: d.id,
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio,
          hora_fim: d.hora_fim,
          ativo: d.ativo,
        }))
        setRules(mapped)
      } catch (error) {
        console.error(error)
        toast({
            title: "Erro",
            description: "Erro ao carregar disponibilidade",
            variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [professorId])

  const handleAddRule = () => {
    setRules([
      ...rules,
      {
        dia_semana: 1, // Default Monday
        hora_inicio: "09:00",
        hora_fim: "17:00",
        ativo: true,
      },
    ])
  }

  const handleChange = (index: number, field: keyof AvailabilityRule, value: string | number | boolean) => {
    const newRules = [...rules]
    // @ts-ignore
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const handleDelete = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    setRules(newRules)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const rule of rules) {
        await upsertDisponibilidade({
            professor_id: professorId,
            dia_semana: Number(rule.dia_semana),
            hora_inicio: rule.hora_inicio,
            hora_fim: rule.hora_fim,
            ativo: rule.ativo,
            ...(rule.id ? { id: rule.id } : {})
        })
      }
      toast({
        title: "Sucesso",
        description: "Disponibilidade salva com sucesso!",
      })
      // Refetch to ensure IDs are updated? Or just trust UI for now.
    } catch (error) {
       console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao salvar disponibilidade",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Disponibilidade</CardTitle>
        <CardDescription>
          Defina seus horários de atendimento para que os alunos possam agendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia da Semana</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <TableRow key={index}>
                <TableCell>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={rule.dia_semana}
                    aria-label="Dia da semana"
                    onChange={(e) => handleChange(index, "dia_semana", Number(e.target.value))}
                  >
                    {DAYS.map((day, i) => (
                      <option key={i} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={rule.hora_inicio}
                    onChange={(e) => handleChange(index, "hora_inicio", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={rule.hora_fim}
                    onChange={(e) => handleChange(index, "hora_fim", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`active-${index}`}
                        checked={rule.ativo}
                        onCheckedChange={(checked) => handleChange(index, "ativo", checked === true)}
                      />
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}>
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between">
            <Button variant="outline" onClick={handleAddRule}>
                <Plus className="size-4 mr-2" />
                Adicionar Horário
            </Button>
            <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                <Save className="size-4 mr-2" />
                Salvar Alterações
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
