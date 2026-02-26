"use client"

import * as React from "react"
import { cn } from "@/app/shared/library/utils"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Configuração de uma coluna para visualização responsiva
 */
export interface ResponsiveColumn<T> {
  /** Chave do campo nos dados */
  key: keyof T | string
  /** Label exibido no header da tabela e nos cards */
  label: string
  /** Se true, esta coluna é destacada como título no card mobile */
  isPrimary?: boolean
  /** Se true, esta coluna é sempre visível (mesmo em cards compactos) */
  isImportant?: boolean
  /** Função para renderizar o valor (opcional) */
  render?: (value: unknown, item: T) => React.ReactNode
  /** Classes adicionais para a célula */
  className?: string
}

export interface ResponsiveTableProps<T> {
  /** Dados a serem exibidos */
  data: T[]
  /** Configuração das colunas */
  columns: ResponsiveColumn<T>[]
  /** Função para obter a key única de cada item */
  getRowKey: (item: T) => string | number
  /** Ações disponíveis para cada linha/card (opcional) */
  renderActions?: (item: T) => React.ReactNode
  /** Mensagem quando não há dados */
  emptyMessage?: string
  /** Classes adicionais para o container */
  className?: string
  /** Força visualização de tabela mesmo em mobile */
  forceTable?: boolean
  /** Força visualização de cards mesmo em desktop */
  forceCards?: boolean
  /** Callback ao clicar em uma linha/card */
  onRowClick?: (item: T) => void
}

/**
 * Tabela responsiva que exibe como cards em mobile e tabela em desktop.
 *
 * @example
 * <ResponsiveTable
 *   data={users}
 *   columns={[
 *     { key: 'name', label: 'Nome', isPrimary: true },
 *     { key: 'email', label: 'Email', isImportant: true },
 *     { key: 'role', label: 'Função' },
 *   ]}
 *   getRowKey={(user) => user.id}
 *   renderActions={(user) => <Button>Editar</Button>}
 * />
 */
export function ResponsiveTable<T>({
  data,
  columns,
  getRowKey,
  renderActions,
  emptyMessage = "Nenhum item encontrado",
  className,
  forceTable = false,
  forceCards = false,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useBreakpoint()

  const showCards = forceCards || (!forceTable && isMobile)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  // Obtém valor de um item por key (suporta nested keys com ".")
  const getValue = (item: T, key: string): unknown => {
    const keys = key.split(".")
    let value: unknown = item
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return undefined
      }
    }
    return value
  }

  if (showCards) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => {
          const primaryColumn = columns.find((c) => c.isPrimary)
          const importantColumns = columns.filter((c) => c.isImportant && !c.isPrimary)
          const otherColumns = columns.filter((c) => !c.isPrimary && !c.isImportant)

          return (
            <Card
              key={getRowKey(item)}
              className={cn(
                "overflow-hidden",
                onRowClick && "cursor-pointer hover:bg-accent/50 transition-colors"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-3">
                {/* Título primário */}
                {primaryColumn && (
                  <div className="font-medium text-base mb-1.5">
                    {primaryColumn.render
                      ? primaryColumn.render(getValue(item, String(primaryColumn.key)), item)
                      : String(getValue(item, String(primaryColumn.key)) ?? "")}
                  </div>
                )}

                {/* Campos importantes */}
                {importantColumns.length > 0 && (
                  <div className="space-y-0.5 mb-2">
                    {importantColumns.map((col) => (
                      <div key={String(col.key)} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{col.label}</span>
                        <span className={col.className}>
                          {col.render
                            ? col.render(getValue(item, String(col.key)), item)
                            : String(getValue(item, String(col.key)) ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outros campos */}
                {otherColumns.length > 0 && (
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    {otherColumns.map((col) => (
                      <div key={String(col.key)} className="flex justify-between">
                        <span>{col.label}</span>
                        <span className={cn("text-foreground", col.className)}>
                          {col.render
                            ? col.render(getValue(item, String(col.key)), item)
                            : String(getValue(item, String(col.key)) ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ações */}
                {renderActions && (
                  <div className="mt-2 pt-2 border-t flex justify-end gap-2">
                    {renderActions(item)}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Visualização em tabela para desktop
  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
            {renderActions && (
              <th className="text-muted-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap w-25">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((item) => (
            <tr
              key={getRowKey(item)}
              className={cn(
                "hover:bg-muted/50 border-b transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn("p-2 align-middle whitespace-nowrap", col.className)}
                >
                  {col.render
                    ? col.render(getValue(item, String(col.key)), item)
                    : String(getValue(item, String(col.key)) ?? "")}
                </td>
              ))}
              {renderActions && (
                <td className="p-2 align-middle whitespace-nowrap text-right">
                  {renderActions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
