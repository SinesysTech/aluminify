"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/shared/components/forms/input"
import { Label } from "@/app/shared/components/forms/label"
import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/shared/components/feedback/alert"
import {
  getIntegracaoProfessor,
  getConfiguracoesProfessor,
  updateIntegracaoProfessor,
  updateConfiguracoesProfessor,
} from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import type { ProfessorIntegracao, ConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/types"
import { Loader2, Video, Link2, Check, X, ExternalLink, AlertCircle, Settings2 } from "lucide-react"
import { toast } from "sonner"

interface IntegracaoManagerProps {
  professorId: string
}

export function IntegracaoManager({ professorId }: IntegracaoManagerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integracao, setIntegracao] = useState<ProfessorIntegracao | null>(null)
  const [_configuracoes, setConfiguracoes] = useState<ConfiguracoesProfessor | null>(null)
  const [defaultLink, setDefaultLink] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<"google" | "zoom" | "default">("default")

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId])

  async function loadData() {
    try {
      setLoading(true)
      const [integracaoData, configData] = await Promise.all([
        getIntegracaoProfessor(professorId),
        getConfiguracoesProfessor(professorId),
      ])
      setIntegracao(integracaoData)
      setConfiguracoes(configData)
      setDefaultLink(configData?.link_reuniao_padrao || "")
      setSelectedProvider(integracaoData?.provider || "default")
    } catch (error) {
      console.error("Error loading integration data:", error)
      toast.error("Erro ao carregar dados de integração")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDefaultLink = async () => {
    setSaving(true)
    try {
      await updateConfiguracoesProfessor(professorId, {
        link_reuniao_padrao: defaultLink || null,
      })
      await updateIntegracaoProfessor(professorId, {
        provider: "default",
      })
      setSelectedProvider("default")
      toast.success("Link padrão salvo!")
      loadData()
    } catch (error) {
      console.error("Error saving default link:", error)
      toast.error("Erro ao salvar link padrão")
    } finally {
      setSaving(false)
    }
  }

  const handleConnectGoogle = async () => {
    // Redirect to Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error("Google OAuth não configurado. Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID.")
      return
    }

    const redirectUri = `${window.location.origin}/api/empresa/integracoes/google/callback`
    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events")
    const state = encodeURIComponent(JSON.stringify({ professorId }))

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`

    window.location.href = authUrl
  }

  const handleConnectZoom = async () => {
    // Redirect to Zoom OAuth
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID
    if (!clientId) {
      toast.error("Zoom OAuth não configurado. Configure NEXT_PUBLIC_ZOOM_CLIENT_ID.")
      return
    }

    const redirectUri = `${window.location.origin}/api/empresa/integracoes/zoom/callback`
    const state = encodeURIComponent(JSON.stringify({ professorId }))

    const authUrl = `https://zoom.us/oauth/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${state}`

    window.location.href = authUrl
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      await updateIntegracaoProfessor(professorId, {
        provider: "default",
        access_token: null,
        refresh_token: null,
        token_expiry: null,
      })
      toast.success("Integração desconectada")
      loadData()
    } catch (error) {
      console.error("Error disconnecting:", error)
      toast.error("Erro ao desconectar integração")
    } finally {
      setSaving(false)
    }
  }

  const isGoogleConnected = integracao?.provider === "google" && !!integracao?.access_token
  const isZoomConnected = integracao?.provider === "zoom" && !!integracao?.access_token
  const hasGoogleConfig = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const hasZoomConfig = !!process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Status da Integracao
          </CardTitle>
          <CardDescription>
            Provedor de reuniao atualmente configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={selectedProvider === "default" ? "secondary" : "default"} className="text-sm">
              {selectedProvider === "google" && "Google Meet"}
              {selectedProvider === "zoom" && "Zoom"}
              {selectedProvider === "default" && "Link Padrao"}
            </Badge>
            {(isGoogleConnected || isZoomConnected) && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Conectado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link de Reuniao Padrao
          </CardTitle>
          <CardDescription>
            Configure um link fixo para suas reunioes (Google Meet, Zoom, ou outro)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLink">URL da reuniao</Label>
            <Input
              id="defaultLink"
              type="url"
              placeholder="https://meet.google.com/sua-sala"
              value={defaultLink}
              onChange={(e) => setDefaultLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Este link sera usado em todos os agendamentos confirmados
            </p>
          </div>
          <Button onClick={handleSaveDefaultLink} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Usar Link Padrao
          </Button>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" />
            Google Calendar / Meet
          </CardTitle>
          <CardDescription>
            Crie eventos no Google Calendar com links do Google Meet automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasGoogleConfig && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuracao necessaria</AlertTitle>
              <AlertDescription>
                Para habilitar a integração com Google, configure as variáveis de ambiente:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li>NEXT_PUBLIC_GOOGLE_CLIENT_ID</li>
                  <li>GOOGLE_CLIENT_SECRET</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {hasGoogleConfig && (
            <>
              {isGoogleConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Google Calendar conectado</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleConnectGoogle} disabled={saving}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Conectar Google Calendar
                </Button>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">O que acontece ao conectar:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Eventos serao criados no seu Google Calendar</li>
                  <li>Links do Google Meet serao gerados automaticamente</li>
                  <li>Alunos recebem convites do calendario</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Zoom Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Zoom
          </CardTitle>
          <CardDescription>
            Crie reunioes Zoom automaticamente para cada agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasZoomConfig && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuracao necessaria</AlertTitle>
              <AlertDescription>
                Para habilitar a integracao com Zoom, configure as variaveis de ambiente:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li>NEXT_PUBLIC_ZOOM_CLIENT_ID</li>
                  <li>ZOOM_CLIENT_SECRET</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {hasZoomConfig && (
            <>
              {isZoomConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Zoom conectado</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleConnectZoom} disabled={saving}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Conectar Zoom
                </Button>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">O que acontece ao conectar:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Reunioes Zoom serao criadas automaticamente</li>
                  <li>Links de acesso enviados aos alunos</li>
                  <li>Configuracoes de sala de espera e video habilitadas</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
