"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceCents: number;
  currency: string;
  provider: string;
  providerProductId: string | null;
  providerOfferId: string | null;
  active: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const productId = params.id as string;

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/financeiro/products/${productId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Erro",
              description: "Produto não encontrado",
              variant: "destructive",
            });
            router.push(tenant ? `/${tenant}/financeiro/produtos` : "/financeiro/produtos");
            return;
          }
          throw new Error("Failed to fetch product");
        }

        const result = await response.json();
        const product: Product = result.data;

        setFormData({
          name: product.name,
          description: product.description || "",
          price: product.price.toFixed(2).replace(".", ","),
          currency: product.currency,
          provider: product.provider,
          providerProductId: product.providerProductId || "",
          providerOfferId: product.providerOfferId || "",
          active: product.active,
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o produto",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router, toast, tenant]);

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

    setSaving(true);
    try {
      const priceCents = Math.round(priceValue * 100);

      const response = await fetch(`/api/financeiro/products/${productId}`, {
        method: "PATCH",
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
        throw new Error(error.error || "Failed to update product");
      }

      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      });

      router.push(tenant ? `/${tenant}/financeiro/produtos/${productId}` : `/financeiro/produtos/${productId}`);
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível atualizar o produto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(tenant ? `/${tenant}/financeiro/produtos/${productId}` : `/financeiro/produtos/${productId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
          <p className="text-muted-foreground">
            Atualize as informações do produto
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
              onClick={() => router.push(tenant ? `/${tenant}/financeiro/produtos/${productId}` : `/financeiro/produtos/${productId}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
