"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/app/shared/components/feedback/use-toast"
import { createMemberAction, type CreateMemberState } from "../actions"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Criando..." : "Criar Membro"}
        </Button>
    )
}

export function CreateMemberDialog() {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()

    // Como useActionState é do React 19 / Next.js 15 (canary), e aqui podemos estar no 14,
    // vamos usar uma abordagem compatível ou assumir que actions funcionam.
    // Vamos usar um form handler simples wrapper.

    const [state, setState] = useState<CreateMemberState>(null)

    async function handleSubmit(formData: FormData) {
        const result = await createMemberAction(null, formData)
        setState(result)

        if (result?.success) {
            toast({
                title: "Sucesso",
                description: "Membro convidado e criado com sucesso.",
                variant: "default",
            })
            setOpen(false)
            setState(null) // Reset state
        } else if (result?.error) {
            toast({
                title: "Erro",
                description: result.error,
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Membro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Membro da Equipe</DialogTitle>
                    <DialogDescription>
                        Adicione um novo usuário à sua equipe. Ele receberá acesso imediato.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nomeCompleto">Nome Completo</Label>
                        <Input
                            id="nomeCompleto"
                            name="nomeCompleto"
                            placeholder="Ex: João da Silva"
                            required
                        />
                        {state?.fieldErrors?.nomeCompleto && (
                            <p className="text-sm text-red-500">{state.fieldErrors.nomeCompleto[0]}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="usuario@exemplo.com"
                            required
                        />
                        {state?.fieldErrors?.email && (
                            <p className="text-sm text-red-500">{state.fieldErrors.email[0]}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="papelTipo">Papel (Função)</Label>
                        <Select name="papelTipo" required defaultValue="professor">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um papel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="staff">Staff/Gerente</SelectItem>
                                <SelectItem value="monitor">Monitor</SelectItem>
                            </SelectContent>
                        </Select>
                        {state?.fieldErrors?.papelTipo && (
                            <p className="text-sm text-red-500">{state.fieldErrors.papelTipo[0]}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
