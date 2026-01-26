"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/components/overlay/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/app/shared/core/client"

type ExportType = "empresas" | "professores" | "alunos"
type ExportFormat = "csv" | "json"

export function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Faça login novamente.",
        })
        return
      }

      const response = await fetch(
        `/api/superadmin/relatorios/export?type=${type}&format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Erro ao exportar dados")
      }

      // Get the filename from content-disposition header
      const contentDisposition = response.headers.get("content-disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `${type}_export.${format}`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${filename} baixado com sucesso.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportItems: { type: ExportType; label: string }[] = [
    { type: "empresas", label: "Empresas" },
    { type: "professores", label: "Professores" },
    { type: "alunos", label: "Alunos" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar Dados"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar como CSV</DropdownMenuLabel>
        {exportItems.map((item) => (
          <DropdownMenuItem
            key={`csv-${item.type}`}
            onClick={() => handleExport(item.type, "csv")}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {item.label} (.csv)
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Exportar como JSON</DropdownMenuLabel>
        {exportItems.map((item) => (
          <DropdownMenuItem
            key={`json-${item.type}`}
            onClick={() => handleExport(item.type, "json")}
            className="cursor-pointer"
          >
            <FileJson className="mr-2 h-4 w-4" />
            {item.label} (.json)
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
