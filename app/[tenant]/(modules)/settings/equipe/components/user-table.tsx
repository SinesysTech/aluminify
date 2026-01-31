"use client"

import { Eye } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import type { UsuarioSummary } from '@/app/shared/types/entities/usuario'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/shared/components/overlay/tooltip"
import { Button } from "@/components/ui/button"
import { getPapelBaseLabel, getPapelBaseColor } from '@/app/shared/utils/papel-display'

interface UserTableProps {
  usuarios: UsuarioSummary[]
}

export function UserTable({ usuarios }: UserTableProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string

  return (
    <TooltipProvider>
      <div className="overflow-hidden flex-1">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="h-10 px-4 font-medium text-muted-foreground uppercase tracking-wider text-xs">Usuario / Email</th>
              <th className="h-10 px-4 font-medium text-muted-foreground uppercase tracking-wider text-xs">Papel</th>
              <th className="h-10 px-4 font-medium text-muted-foreground uppercase tracking-wider text-xs w-[150px]">Status</th>
              <th className="h-10 px-4 font-medium text-muted-foreground uppercase tracking-wider text-xs text-right w-[80px]">Acoes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E4E4E7]">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Nenhum usuario encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => {
                const initials = usuario.nomeCompleto
                  ? usuario.nomeCompleto.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                  : '??'

                return (
                  <tr key={usuario.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{usuario.nomeCompleto || 'Sem nome'}</div>
                          <div className="font-mono text-xs text-muted-foreground">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPapelBaseColor(usuario.papelBase)}`}>
                          {usuario.papelNome || getPapelBaseLabel(usuario.papelBase)}
                        </span>
                        {usuario.isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        usuario.ativo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                router.push(
                                  tenant
                                    ? `/${tenant}/settings/equipe/${usuario.id}`
                                    : `/settings/equipe/${usuario.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Perfil</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Mostrando <strong>{usuarios.length}</strong> resultado(s)
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
