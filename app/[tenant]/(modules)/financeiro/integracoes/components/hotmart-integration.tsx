"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/app/shared/components/forms/input";
import { Label } from "@/app/shared/components/forms/label";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/shared/components/feedback/alert";
import {
  Loader2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Webhook,
  ShieldCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/app/shared/core/client";

interface HotmartIntegrationProps {
  empresaId: string;
}

interface PaymentProvider {
  id: string;
  empresa_id: string;
  provider: string;
  name: string;
  webhook_secret: string | null;
  webhook_url: string | null;
  active: boolean;
}

const HOTMART_EVENTS = [
  { name: "PURCHASE_APPROVED", description: "Compra aprovada" },
  { name: "PURCHASE_COMPLETE", description: "Compra finalizada" },
  { name: "PURCHASE_CANCELED", description: "Compra cancelada" },
  { name: "PURCHASE_REFUNDED", description: "Compra reembolsada" },
  { name: "PURCHASE_CHARGEBACK", description: "Chargeback" },
  { name: "SUBSCRIPTION_CANCELLATION", description: "Cancelamento de assinatura" },
  { name: "CLUB_FIRST_ACCESS", description: "Primeiro acesso ao curso" },
];

export function HotmartIntegration({ empresaId }: HotmartIntegrationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [hottok, setHottok] = useState("");
  const [showHottok, setShowHottok] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/hotmart?empresaId=${empresaId}`
      : "";

  useEffect(() => {
    loadProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  async function loadProvider() {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("provider", "hotmart")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProvider(data);
        setHottok(data.webhook_secret || "");
      }
    } catch (error) {
      console.error("Error loading payment provider:", error);
      toast.error("Erro ao carregar configuração de integração");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!hottok.trim()) {
      toast.error("Informe o Hottok da Hotmart");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      if (provider) {
        const { error } = await supabase
          .from("payment_providers")
          .update({
            webhook_secret: hottok.trim(),
            webhook_url: webhookUrl,
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_providers").insert({
          empresa_id: empresaId,
          provider: "hotmart",
          name: "Hotmart",
          webhook_secret: hottok.trim(),
          webhook_url: webhookUrl,
          active: true,
        });

        if (error) throw error;
      }

      toast.success("Integração Hotmart configurada!");
      loadProvider();
    } catch (error) {
      console.error("Error saving payment provider:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!provider) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("payment_providers")
        .update({
          active: !provider.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      if (error) throw error;

      toast.success(
        provider.active ? "Integração desativada" : "Integração ativada"
      );
      loadProvider();
    } catch (error) {
      console.error("Error toggling provider:", error);
      toast.error("Erro ao alterar status");
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Integração Hotmart
          </CardTitle>
          <CardDescription>
            Receba automaticamente dados de vendas e alunos da Hotmart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={provider?.active ? "default" : "secondary"}
              className="text-sm"
            >
              {provider?.active ? "Ativo" : provider ? "Inativo" : "Não configurado"}
            </Badge>
            {provider?.active && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <ShieldCheck className="h-4 w-4" />
                Webhook configurado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            URL do Webhook
          </CardTitle>
          <CardDescription>
            Copie esta URL e configure no painel da Hotmart
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL para configurar na Hotmart</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Como configurar na Hotmart</AlertTitle>
            <AlertDescription className="space-y-2">
              <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                <li>
                  Acesse{" "}
                  <a
                    href="https://app-vlc.hotmart.com/tools/webhook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Ferramentas {">"} Webhook
                  </a>{" "}
                  na Hotmart
                </li>
                <li>Clique em {"Adicionar webhook"}</li>
                <li>Cole a URL acima no campo {"URL de destino"}</li>
                <li>Selecione os eventos desejados (recomendamos todos)</li>
                <li>Copie o {"Hottok"} exibido e cole abaixo</li>
                <li>Salve a configuração em ambos os lados</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Hottok Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Autenticação (Hottok)
          </CardTitle>
          <CardDescription>
            O Hottok é o token de segurança que valida as requisições da Hotmart
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hottok">Hottok da Hotmart</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="hottok"
                  type={showHottok ? "text" : "password"}
                  placeholder="Cole aqui o Hottok da aba Autenticação"
                  value={hottok}
                  onChange={(e) => setHottok(e.target.value)}
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowHottok(!showHottok)}
                >
                  {showHottok ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Encontre o Hottok na aba {"Autenticação"} das configurações de
              Webhook da Hotmart
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !hottok.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {provider ? "Atualizar Configuração" : "Ativar Integração"}
            </Button>

            {provider && (
              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={saving}
              >
                {provider.active ? "Desativar" : "Ativar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supported Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Eventos Suportados
          </CardTitle>
          <CardDescription>
            Selecione estes eventos ao configurar o webhook na Hotmart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {HOTMART_EVENTS.map((event) => (
              <div
                key={event.name}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
