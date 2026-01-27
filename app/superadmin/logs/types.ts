export type LogLevel = "info" | "warning" | "error" | "success"
export type LogCategory =
  | "auth"
  | "empresa"
  | "user"
  | "curso"
  | "payment"
  | "integration"
  | "system"

export interface AuditLog {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  action: string
  description: string
  userId?: string
  userName?: string
  empresaId?: string
  empresaNome?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export interface LogStats {
  totalLogs: number
  byLevel: {
    info: number
    warning: number
    error: number
    success: number
  }
  byCategory: {
    category: LogCategory
    count: number
  }[]
  recentActivity: {
    hour: string
    count: number
  }[]
}

export interface LogFilters {
  level?: LogLevel | "all"
  category?: LogCategory | "all"
  empresaId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export const LOG_CATEGORIES: { id: LogCategory; label: string }[] = [
  { id: "auth", label: "Autenticação" },
  { id: "empresa", label: "Empresa" },
  { id: "user", label: "Usuário" },
  { id: "curso", label: "Curso" },
  { id: "payment", label: "Pagamento" },
  { id: "integration", label: "Integração" },
  { id: "system", label: "Sistema" },
]

export const LOG_LEVELS: { id: LogLevel; label: string; color: string }[] = [
  { id: "info", label: "Info", color: "text-blue-600" },
  { id: "warning", label: "Aviso", color: "text-orange-600" },
  { id: "error", label: "Erro", color: "text-red-600" },
  { id: "success", label: "Sucesso", color: "text-green-600" },
]
