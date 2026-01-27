"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/shared/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/app/shared/core/client"
import type { EmpresaWithMetrics } from "../types"

interface ToggleStatusDialogProps {
  empresa: EmpresaWithMetrics | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ToggleStatusDialog({
  empresa,
  open,
  onOpenChange,
  onSuccess,
}: ToggleStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (!empresa) return

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

      const action = empresa.ativo ? "deactivate" : "activate"

      const response = await fetch(`/api/superadmin/empresas/${empresa.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao alterar status")
      }

      toast({
        title: empresa.ativo ? "Empresa desativada" : "Empresa ativada",
        description: `${empresa.nome} foi ${empresa.ativo ? "desativada" : "ativada"} com sucesso.`,
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error toggling empresa status:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar status da empresa.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!empresa) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {empresa.ativo ? "Desativar empresa" : "Ativar empresa"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {empresa.ativo ? (
              <>
                Tem certeza que deseja desativar a empresa{" "}
                <strong>{empresa.nome}</strong>?
                <br />
                <br />
                Isso irá bloquear o acesso de todos os usuários desta empresa à
                plataforma. A empresa pode ser reativada a qualquer momento.
              </>
            ) : (
              <>
                Tem certeza que deseja ativar a empresa{" "}
                <strong>{empresa.nome}</strong>?
                <br />
                <br />
                Isso irá restaurar o acesso de todos os usuários desta empresa à
                plataforma.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={isLoading}
            className={
              empresa.ativo
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600"
            }
          >
            {isLoading
              ? "Processando..."
              : empresa.ativo
                ? "Desativar"
                : "Ativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
