export interface SystemConfig {
  id: string
  key: string
  value: string | number | boolean
  description: string
  category: ConfigCategory
  type: "string" | "number" | "boolean" | "json"
  updatedAt: string
  updatedBy?: string
}

export type ConfigCategory =
  | "general"
  | "security"
  | "notifications"
  | "limits"
  | "features"
  | "maintenance"

export interface ConfigCategory {
  id: ConfigCategory
  label: string
  description: string
}

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: "general",
    label: "Geral",
    description: "Configurações gerais do sistema",
  },
  {
    id: "security",
    label: "Segurança",
    description: "Configurações de segurança e autenticação",
  },
  {
    id: "notifications",
    label: "Notificações",
    description: "Configurações de e-mail e notificações",
  },
  {
    id: "limits",
    label: "Limites",
    description: "Limites padrão para empresas e usuários",
  },
  {
    id: "features",
    label: "Funcionalidades",
    description: "Ativar ou desativar funcionalidades globais",
  },
  {
    id: "maintenance",
    label: "Manutenção",
    description: "Modo de manutenção e backups",
  },
]

// Default system configurations
export const DEFAULT_CONFIGS: Omit<SystemConfig, "id" | "updatedAt">[] = [
  // General
  {
    key: "app_name",
    value: "Aluminify",
    description: "Nome da aplicação",
    category: "general",
    type: "string",
  },
  {
    key: "support_email",
    value: "suporte@aluminify.com",
    description: "E-mail de suporte",
    category: "general",
    type: "string",
  },
  {
    key: "default_language",
    value: "pt-BR",
    description: "Idioma padrão do sistema",
    category: "general",
    type: "string",
  },
  {
    key: "default_timezone",
    value: "America/Sao_Paulo",
    description: "Fuso horário padrão",
    category: "general",
    type: "string",
  },

  // Security
  {
    key: "session_timeout",
    value: 3600,
    description: "Tempo de sessão em segundos (padrão: 1 hora)",
    category: "security",
    type: "number",
  },
  {
    key: "max_login_attempts",
    value: 5,
    description: "Tentativas máximas de login antes do bloqueio",
    category: "security",
    type: "number",
  },
  {
    key: "require_2fa",
    value: false,
    description: "Exigir autenticação de dois fatores",
    category: "security",
    type: "boolean",
  },
  {
    key: "password_min_length",
    value: 8,
    description: "Comprimento mínimo de senha",
    category: "security",
    type: "number",
  },

  // Notifications
  {
    key: "email_notifications_enabled",
    value: true,
    description: "Habilitar notificações por e-mail",
    category: "notifications",
    type: "boolean",
  },
  {
    key: "welcome_email_enabled",
    value: true,
    description: "Enviar e-mail de boas-vindas para novos usuários",
    category: "notifications",
    type: "boolean",
  },
  {
    key: "digest_email_enabled",
    value: false,
    description: "Enviar e-mail resumo semanal",
    category: "notifications",
    type: "boolean",
  },

  // Limits
  {
    key: "default_storage_limit_mb",
    value: 5120,
    description: "Limite de armazenamento padrão em MB (5GB)",
    category: "limits",
    type: "number",
  },
  {
    key: "max_file_upload_mb",
    value: 100,
    description: "Tamanho máximo de upload em MB",
    category: "limits",
    type: "number",
  },
  {
    key: "api_rate_limit",
    value: 1000,
    description: "Limite de requisições da API por hora",
    category: "limits",
    type: "number",
  },

  // Features
  {
    key: "ai_features_enabled",
    value: true,
    description: "Habilitar funcionalidades de IA",
    category: "features",
    type: "boolean",
  },
  {
    key: "video_conferencing_enabled",
    value: true,
    description: "Habilitar videoconferência integrada",
    category: "features",
    type: "boolean",
  },
  {
    key: "analytics_enabled",
    value: true,
    description: "Habilitar analytics e métricas",
    category: "features",
    type: "boolean",
  },
  {
    key: "new_registrations_enabled",
    value: true,
    description: "Permitir novos cadastros de empresas",
    category: "features",
    type: "boolean",
  },

  // Maintenance
  {
    key: "maintenance_mode",
    value: false,
    description: "Ativar modo de manutenção",
    category: "maintenance",
    type: "boolean",
  },
  {
    key: "maintenance_message",
    value: "Sistema em manutenção. Voltaremos em breve.",
    description: "Mensagem exibida durante manutenção",
    category: "maintenance",
    type: "string",
  },
  {
    key: "auto_backup_enabled",
    value: true,
    description: "Habilitar backup automático",
    category: "maintenance",
    type: "boolean",
  },
  {
    key: "backup_retention_days",
    value: 30,
    description: "Dias de retenção de backups",
    category: "maintenance",
    type: "number",
  },
]
