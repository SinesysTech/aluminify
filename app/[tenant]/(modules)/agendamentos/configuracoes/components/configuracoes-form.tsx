"use client"

import { useState } from "react"
import { updateConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { ConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/shared/components/forms/input"
import { Label } from "@/app/shared/components/forms/label"
import { Textarea } from "@/app/shared/components/forms/textarea"
import { Switch } from "@/app/shared/components/forms/switch"
import { toast } from "sonner"
import { Loader2, Save, Clock, Video, MessageSquare, Zap } from "lucide-react"

interface ConfiguracoesFormProps {
  professorId: string
  initialData: ConfiguracoesProfessor | null
}

export function ConfiguracoesForm({ professorId, initialData }: ConfiguracoesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [autoConfirmar, setAutoConfirmar] = useState(initialData?.auto_confirmar ?? false)
  const [tempoAntecedencia, setTempoAntecedencia] = useState(
    initialData?.tempo_antecedencia_minimo?.toString() ?? "60"
  )
  const [tempoLembrete, setTempoLembrete] = useState(
    initialData?.tempo_lembrete_minutos?.toString() ?? "1440"
  )
  const [linkPadrao, setLinkPadrao] = useState(initialData?.link_reuniao_padrao ?? "")
  const [mensagemConfirmacao, setMensagemConfirmacao] = useState(
    initialData?.mensagem_confirmacao ?? ""
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateConfiguracoesProfessor(professorId, {
        auto_confirmar: autoConfirmar,
        tempo_antecedencia_minimo: parseInt(tempoAntecedencia) || 60,
        tempo_lembrete_minutos: parseInt(tempoLembrete) || 1440,
        link_reuniao_padrao: linkPadrao || null,
        mensagem_confirmacao: mensagemConfirmacao || null
      })
      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-confirmação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-confirmação
          </CardTitle>
          <CardDescription>
            Configure se os agendamentos devem ser confirmados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Confirmar automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Os agendamentos serão confirmados assim que criados
              </p>
            </div>
            <Switch
              checked={autoConfirmar}
              onCheckedChange={setAutoConfirmar}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tempos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Tempo
          </CardTitle>
          <CardDescription>
            Defina os prazos mínimos e lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="antecedencia">Antecedência mínima (minutos)</Label>
              <Input
                id="antecedencia"
                type="number"
                min="0"
                value={tempoAntecedencia}
                onChange={(e) => setTempoAntecedencia(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground">
                Tempo mínimo de antecedência para agendar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lembrete">Lembrete antes (minutos)</Label>
              <Input
                id="lembrete"
                type="number"
                min="0"
                value={tempoLembrete}
                onChange={(e) => setTempoLembrete(e.target.value)}
                placeholder="1440"
              />
              <p className="text-xs text-muted-foreground">
                1440 minutos = 24 horas antes do agendamento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link de Reuniao */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Link de Reunião Padrão
          </CardTitle>
          <CardDescription>
            Configure um link padrão para suas reuniões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="link">Link da sala de reunião</Label>
            <Input
              id="link"
              type="url"
              value={linkPadrao}
              onChange={(e) => setLinkPadrao(e.target.value)}
              placeholder="https://meet.google.com/sua-sala"
            />
            <p className="text-xs text-muted-foreground">
              Este link será usado automaticamente ao confirmar agendamentos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem de Confirmação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagem de Confirmação
          </CardTitle>
          <CardDescription>
            Personalize a mensagem enviada aos alunos ao confirmar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem personalizada</Label>
            <Textarea
              id="mensagem"
              value={mensagemConfirmacao}
              onChange={(e) => setMensagemConfirmacao(e.target.value)}
              placeholder="Ex: Olá! Seu agendamento foi confirmado. Nos vemos em breve!"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Esta mensagem será incluída no email de confirmação
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </form>
  )
}
