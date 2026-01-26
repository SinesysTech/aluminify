"use client"

import { useState } from "react"
import { ConfiguracoesProfessor, updateConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
      toast.success("Configuracoes salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configuracoes")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-confirmacao */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-confirmacao
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
                Os agendamentos serao confirmados assim que criados
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
            Configuracoes de Tempo
          </CardTitle>
          <CardDescription>
            Defina os prazos minimos e lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="antecedencia">Antecedencia minima (minutos)</Label>
              <Input
                id="antecedencia"
                type="number"
                min="0"
                value={tempoAntecedencia}
                onChange={(e) => setTempoAntecedencia(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground">
                Tempo minimo de antecedencia para agendar
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
            Link de Reuniao Padrao
          </CardTitle>
          <CardDescription>
            Configure um link padrao para suas reunioes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="link">Link da sala de reuniao</Label>
            <Input
              id="link"
              type="url"
              value={linkPadrao}
              onChange={(e) => setLinkPadrao(e.target.value)}
              placeholder="https://meet.google.com/sua-sala"
            />
            <p className="text-xs text-muted-foreground">
              Este link sera usado automaticamente ao confirmar agendamentos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem de Confirmacao */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagem de Confirmacao
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
              Esta mensagem sera incluida no email de confirmacao
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
          Salvar Configuracoes
        </Button>
      </div>
    </form>
  )
}
