"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/app/shared/components/forms/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/shared/components/ui/collapsible";
import {
  saveTenantOAuthCredentials,
  deleteTenantOAuthCredentials,
} from "../lib/oauth-actions";
import {
  Loader2,
  ChevronDown,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

interface ProviderConfig {
  configured: boolean;
  active: boolean;
}

interface OAuthCredentialsFormProps {
  empresaId: string;
  initialConfig: {
    google: ProviderConfig | null;
    zoom: ProviderConfig | null;
  };
}

type ProviderFormState = {
  clientId: string;
  clientSecret: string;
  showSecret: boolean;
  saving: boolean;
  deleting: boolean;
  showGuide: boolean;
};

const defaultFormState: ProviderFormState = {
  clientId: "",
  clientSecret: "",
  showSecret: false,
  saving: false,
  deleting: false,
  showGuide: false,
};

export function OAuthCredentialsForm({
  empresaId,
  initialConfig,
}: OAuthCredentialsFormProps) {
  const [google, setGoogle] = useState<ProviderFormState>(defaultFormState);
  const [zoom, setZoom] = useState<ProviderFormState>(defaultFormState);
  const [googleConfigured, setGoogleConfigured] = useState(
    initialConfig.google?.configured ?? false,
  );
  const [zoomConfigured, setZoomConfigured] = useState(
    initialConfig.zoom?.configured ?? false,
  );

  const handleSave = async (
    provider: "google" | "zoom",
    state: ProviderFormState,
    setState: React.Dispatch<React.SetStateAction<ProviderFormState>>,
    setConfigured: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!state.clientId.trim() || !state.clientSecret.trim()) {
      toast.error("Preencha o Client ID e o Client Secret");
      return;
    }

    setState((s) => ({ ...s, saving: true }));
    try {
      await saveTenantOAuthCredentials(
        empresaId,
        provider,
        state.clientId.trim(),
        state.clientSecret.trim(),
      );
      setConfigured(true);
      setState((s) => ({ ...s, clientId: "", clientSecret: "" }));
      const name = provider === "google" ? "Google" : "Zoom";
      toast.success(`Credenciais ${name} salvas com sucesso`);
    } catch (err) {
      console.error(`Error saving ${provider} credentials:`, err);
      toast.error(`Erro ao salvar credenciais ${provider}`);
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  };

  const handleDelete = async (
    provider: "google" | "zoom",
    setState: React.Dispatch<React.SetStateAction<ProviderFormState>>,
    setConfigured: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setState((s) => ({ ...s, deleting: true }));
    try {
      await deleteTenantOAuthCredentials(empresaId, provider);
      setConfigured(false);
      const name = provider === "google" ? "Google" : "Zoom";
      toast.success(`Credenciais ${name} removidas`);
    } catch (err) {
      console.error(`Error deleting ${provider} credentials:`, err);
      toast.error(`Erro ao remover credenciais ${provider}`);
    } finally {
      setState((s) => ({ ...s, deleting: false }));
    }
  };

  const renderProviderCard = (
    provider: "google" | "zoom",
    label: string,
    configured: boolean,
    state: ProviderFormState,
    setState: React.Dispatch<React.SetStateAction<ProviderFormState>>,
    setConfigured: React.Dispatch<React.SetStateAction<boolean>>,
    guideContent: React.ReactNode,
  ) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">{label}</h4>
          </div>
          {configured ? (
            <Badge variant="default" className="bg-green-600 shrink-0">
              Configurado
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              Nao configurado
            </Badge>
          )}
        </div>

        {configured ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Credenciais configuradas. Para atualizar, preencha novos valores
              abaixo.
            </p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Novo Client ID (deixe vazio para manter)"
                value={state.clientId}
                onChange={(e) =>
                  setState((s) => ({ ...s, clientId: e.target.value }))
                }
              />
              <div className="relative">
                <Input
                  type={state.showSecret ? "text" : "password"}
                  placeholder="Novo Client Secret (deixe vazio para manter)"
                  value={state.clientSecret}
                  onChange={(e) =>
                    setState((s) => ({ ...s, clientSecret: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, showSecret: !s.showSecret }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {state.showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {state.clientId && state.clientSecret && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleSave(provider, state, setState, setConfigured)
                  }
                  disabled={state.saving}
                >
                  {state.saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Atualizar
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  handleDelete(provider, setState, setConfigured)
                }
                disabled={state.deleting}
              >
                {state.deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Client ID"
                value={state.clientId}
                onChange={(e) =>
                  setState((s) => ({ ...s, clientId: e.target.value }))
                }
              />
              <div className="relative">
                <Input
                  type={state.showSecret ? "text" : "password"}
                  placeholder="Client Secret"
                  value={state.clientSecret}
                  onChange={(e) =>
                    setState((s) => ({ ...s, clientSecret: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, showSecret: !s.showSecret }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {state.showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                handleSave(provider, state, setState, setConfigured)
              }
              disabled={state.saving || !state.clientId || !state.clientSecret}
            >
              {state.saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        )}

        <Collapsible
          open={state.showGuide}
          onOpenChange={(open) =>
            setState((s) => ({ ...s, showGuide: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors cursor-pointer">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${state.showGuide ? "rotate-180" : ""}`}
            />
            Como configurar
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              {guideContent}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="section-title">Credenciais OAuth (Admin)</h3>
        <p className="text-sm text-muted-foreground">
          Configure as credenciais do aplicativo OAuth para que os professores
          possam conectar suas contas.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {renderProviderCard(
          "google",
          "Google OAuth",
          googleConfigured,
          google,
          setGoogle,
          setGoogleConfigured,
          <>
            <p>1. Acesse console.cloud.google.com</p>
            <p>2. Crie um projeto ou selecione um existente</p>
            <p>3. Ative a API Google Calendar</p>
            <p>4. Em Credenciais, crie um OAuth Client ID (Web)</p>
            <p>
              5. Adicione a URI de redirecionamento:{" "}
              <code className="bg-muted px-1 rounded">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /api/empresa/integracoes/google/callback
              </code>
            </p>
            <p>6. Copie o Client ID e Client Secret aqui</p>
          </>,
        )}

        {renderProviderCard(
          "zoom",
          "Zoom OAuth",
          zoomConfigured,
          zoom,
          setZoom,
          setZoomConfigured,
          <>
            <p>1. Acesse marketplace.zoom.us</p>
            <p>2. Crie um app do tipo OAuth</p>
            <p>
              3. Adicione a URI de redirecionamento:{" "}
              <code className="bg-muted px-1 rounded">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /api/empresa/integracoes/zoom/callback
              </code>
            </p>
            <p>4. Copie o Client ID e Client Secret aqui</p>
          </>,
        )}
      </div>
    </div>
  );
}
