'use client'

import React from 'react'

import { Button } from "@/components/ui/button"
import { Label } from "@/app/shared/components/forms/label"
import { Textarea } from "@/app/shared/components/forms/textarea"
import { Badge } from "@/components/ui/badge"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { createAgendamento } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Loader2, Clock, Calendar } from "lucide-react"
import { toast } from "sonner"

interface FormPanelProps {
  professorId: string
  timeZone: string
  durationMinutes: number
}

export function FormPanel({ professorId, timeZone, durationMinutes }: FormPanelProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const searchParams = useSearchParams()
  const slotParam = searchParams.get("slot")

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    observacoes: "",
  })

  if (!slotParam) {
    return <div>Nenhum horário selecionado</div>
  }

  const startDate = new Date(slotParam)
  // Use dynamic duration from props instead of hardcoded 30 minutes
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createAgendamento({
        professor_id: professorId,
        aluno_id: "", // Filled by server
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        observacoes: formData.observacoes || null,
        link_reuniao: null, // Generated on confirmation
        status: "pendente" // Initial status, may be auto-confirmed by server
      })
      toast.success("Agendamento solicitado com sucesso!")
      router.push(tenant ? `/${tenant}/agendamentos/meus` : "/agendamentos/meus")
      router.refresh()
    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao agendar"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full lg:w-90">
      {/* Summary Card */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {startDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatTime(startDate)} - {formatTime(endDate)}
          </span>
          <Badge variant="secondary" className="ml-auto">
            {durationMinutes} min
          </Badge>
        </div>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          placeholder="Compartilhe detalhes ou dúvidas para a reunião..."
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.back()}
          disabled={loading}
        >
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Agendamento
        </Button>
      </div>
    </form>
  )
}
