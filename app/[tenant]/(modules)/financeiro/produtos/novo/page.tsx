"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/app/shared/components/forms/input";
import { Label } from "@/app/shared/components/forms/label";
import { Textarea } from "@/app/shared/components/forms/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select";
import { Switch } from "@/app/shared/components/forms/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "BRL",
    provider: "internal",
    providerProductId: "",
    providerOfferId: "",
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do produto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const priceValue = parseFloat(formData.price.replace(",", "."));
    if (isNaN(priceValue) || priceValue < 0) {
      toast({
        title: "Erro",
        description: "O preço deve ser um valor válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const priceCents = Math.round(priceValue * 100);

      const response = await fetch("/api/financeiro/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          priceCents,
          currency: formData.currency,
          provider: formData.provider,
          providerProductId: formData.providerProductId.trim() || null,
          providerOfferId: formData.providerOfferId.trim() || null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso",
      });

      router.push(tenant ? `/${tenant}/financeiro/produtos` : "/financeiro/produtos");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível criar o produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(tenant ? `/${tenant}/financeiro/produtos` : "/financeiro/produtos")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="page-title">Novo Produto</h1>
          <p className="page-subtitle">
            Cadastre um novo produto para venda
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Curso de Marketing Digital"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Produto ativo pode ser vendido
                  </p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, active: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração com Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, provider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecione o gateway de pagamento associado
                </p>
              </div>

              {(formData.provider === "hotmart" || formData.provider === "stripe") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="providerProductId">ID do Produto no Provider</Label>
                    <Input
                      id="providerProductId"
                      value={formData.providerProductId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          providerProductId: e.target.value,
                        }))
                      }
                      placeholder="Ex: 123456"
                    />
                    <p className="text-sm text-muted-foreground">
                      ID do produto no sistema do provider
                    </p>
                  </div>

                  {formData.provider === "hotmart" && (
                    <div className="space-y-2">
                      <Label htmlFor="providerOfferId">ID da Oferta (Hotmart)</Label>
                      <Input
                        id="providerOfferId"
                        value={formData.providerOfferId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            providerOfferId: e.target.value,
                          }))
                        }
                        placeholder="Ex: abc123xyz"
                      />
                      <p className="text-sm text-muted-foreground">
                        ID da oferta específica no Hotmart
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(tenant ? `/${tenant}/financeiro/produtos` : "/financeiro/produtos")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Produto
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
