"use client"

import { useState } from "react"
import { Key, Copy, CheckCircle2, AlertTriangle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import { Input } from "@/app/shared/components/forms/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ApiKeyInfo } from "../types"

interface ApiKeysListProps {
  apiKeys: ApiKeyInfo[]
  isLoading: boolean
}

export function ApiKeysList({ apiKeys, isLoading }: ApiKeysListProps) {
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [now] = useState(() => new Date())

  const filteredKeys = apiKeys.filter((key) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      key.name.toLowerCase().includes(searchLower) ||
      key.keyPreview.toLowerCase().includes(searchLower)
    )
  })

  const handleCopyKey = (keyPreview: string, id: string) => {
    navigator.clipboard.writeText(keyPreview)
    setCopiedId(id)
    toast({
      title: "Copiado",
      description: "Preview da chave copiado para a área de transferência",
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-32 mb-6" />
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-medium mb-6">API Keys</h3>

      <div className="mb-6">
        <Input
          placeholder="Buscar por nome ou chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filteredKeys.length === 0 ? (
        <div className="text-center py-8">
          <Key className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            {apiKeys.length === 0
              ? "Nenhuma API key cadastrada"
              : "Nenhuma API key encontrada"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Chave</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada</TableHead>
              <TableHead>Último Uso</TableHead>
              <TableHead>Expira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKeys.map((key) => {

              const isExpired = key.expiresAt && new Date(key.expiresAt) < now
              const expiresIn7Days =
                key.expiresAt &&
                new Date(key.expiresAt) <
                new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

              return (
                <TableRow key={key.id}>
                  <TableCell>
                    <span className="font-medium">{key.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.keyPreview}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyKey(key.keyPreview, key.id)}
                      >
                        {copiedId === key.id ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.active && !isExpired ? (
                      <Badge variant="default" className="bg-green-600">
                        Ativa
                      </Badge>
                    ) : isExpired ? (
                      <Badge variant="destructive">Expirada</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(key.createdAt), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.lastUsedAt
                      ? formatDistanceToNow(new Date(key.lastUsedAt), {
                        locale: ptBR,
                        addSuffix: true,
                      })
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {key.expiresAt ? (
                      <div className="flex items-center gap-1.5">
                        {expiresIn7Days && !isExpired && (
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                        )}
                        <span
                          className={`text-sm ${isExpired
                            ? "text-destructive"
                            : expiresIn7Days
                              ? "text-orange-600"
                              : "text-muted-foreground"
                            }`}
                        >
                          {formatDistanceToNow(new Date(key.expiresAt), {
                            locale: ptBR,
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sem expiração
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
