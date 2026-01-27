"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/shared/components/overlay/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/shared/components/forms/form"
import { Input } from "@/app/shared/components/forms/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select"
import { Switch } from "@/app/shared/components/forms/switch"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/app/shared/core/client"

const createEmpresaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  emailContato: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  plano: z.enum(["basico", "profissional", "enterprise"]),
  criarAdmin: z.boolean(),
  primeiroAdminNome: z.string().optional(),
  primeiroAdminEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  primeiroAdminPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
}).refine((data) => {
  if (data.criarAdmin) {
    return data.primeiroAdminNome && data.primeiroAdminEmail && data.primeiroAdminPassword
  }
  return true
}, {
  message: "Preencha todos os dados do administrador",
  path: ["primeiroAdminEmail"],
})

type CreateEmpresaFormValues = z.infer<typeof createEmpresaSchema>

interface CreateEmpresaDialogProps {
  onSuccess: () => void
}

export function CreateEmpresaDialog({ onSuccess }: CreateEmpresaDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateEmpresaFormValues>({
    resolver: zodResolver(createEmpresaSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      emailContato: "",
      telefone: "",
      plano: "basico",
      criarAdmin: false,
      primeiroAdminNome: "",
      primeiroAdminEmail: "",
      primeiroAdminPassword: "",
    },
  })

  const criarAdmin = form.watch("criarAdmin")

  const handleSubmit = async (values: CreateEmpresaFormValues) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Faça login novamente.",
        })
        return
      }

      const body: Record<string, unknown> = {
        nome: values.nome,
        cnpj: values.cnpj || undefined,
        emailContato: values.emailContato || undefined,
        telefone: values.telefone || undefined,
        plano: values.plano,
      }

      if (values.criarAdmin && values.primeiroAdminEmail && values.primeiroAdminNome && values.primeiroAdminPassword) {
        body.primeiroAdminEmail = values.primeiroAdminEmail
        body.primeiroAdminNome = values.primeiroAdminNome
        body.primeiroAdminPassword = values.primeiroAdminPassword
      }

      const response = await fetch("/api/empresa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar empresa")
      }

      toast({
        title: "Empresa criada",
        description: `${values.nome} foi criada com sucesso.${values.criarAdmin ? " O administrador receberá um email de boas-vindas." : ""}`,
      })

      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating empresa:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar empresa.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
          <DialogDescription>
            Cadastre uma nova empresa na plataforma. Opcionalmente, crie o primeiro administrador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Dados da Empresa
              </h3>

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="emailContato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contato</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Primeiro Administrador */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="criarAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Criar Primeiro Administrador
                      </FormLabel>
                      <FormDescription>
                        Crie automaticamente um usuário administrador para esta empresa.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {criarAdmin && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <h4 className="text-sm font-medium">Dados do Administrador</h4>

                  <FormField
                    control={form.control}
                    name="primeiroAdminNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do administrador" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primeiroAdminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@empresa.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primeiroAdminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
