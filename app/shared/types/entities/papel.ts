/**
 * Tipos para o sistema RBAC (Role-Based Access Control)
 * Papéis e Permissões
 */

// Papel base no modelo unificado (enum_papel_base no banco)
export type PapelBase = "aluno" | "professor" | "usuario";

/**
 * @deprecated Use PapelBase + isAdmin flag instead.
 * RoleTipo is being phased out in favor of a simpler model:
 * - PapelBase determines the user category (aluno, professor, usuario)
 * - isAdmin flag grants administrative powers
 */
export type RoleTipo =
  | "professor" // Professor padrão - acesso às próprias disciplinas
  | "professor_admin" // Professor com poderes administrativos
  | "staff" // Funcionário administrativo - não dá aula
  | "admin" // Administrador total da empresa
  | "monitor"; // Monitor - nível básico para monitoria

// Permissões por recurso
export interface ResourcePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// Permissões simples (view/edit)
export interface SimplePermissions {
  view: boolean;
  edit?: boolean;
}

// Estrutura completa de permissões
export interface RolePermissions {
  dashboard: { view: boolean };
  cursos: ResourcePermissions;
  disciplinas: ResourcePermissions;
  alunos: ResourcePermissions;
  usuarios: ResourcePermissions;
  agendamentos: ResourcePermissions;
  flashcards: ResourcePermissions;
  materiais: ResourcePermissions;
  configuracoes: SimplePermissions;
  branding: SimplePermissions;
  relatorios: { view: boolean };
}

// Papel (Role) do sistema - modelo simplificado
export interface Papel {
  id: string;
  // NULL = papel do sistema (template), string = papel customizado da empresa
  empresaId: string | null;
  nome: string;
  /**
   * @deprecated O campo tipo está sendo descontinuado.
   * Use apenas nome e permissoes para papéis customizados.
   */
  tipo?: RoleTipo | null;
  descricao: string | null;
  permissoes: RolePermissions;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input para criar papel customizado
export interface CreatePapelInput {
  empresaId: string;
  nome: string;
  /**
   * @deprecated O campo tipo está sendo descontinuado.
   */
  tipo?: RoleTipo;
  descricao?: string;
  permissoes: RolePermissions;
}

// Input para atualizar papel
export interface UpdatePapelInput {
  nome?: string;
  descricao?: string;
  permissoes?: Partial<RolePermissions>;
}

/**
 * @deprecated Use isTeachingRole(role: PapelBase) instead
 */
export const TEACHING_ROLES: RoleTipo[] = [
  "professor",
  "professor_admin",
  "monitor",
];

/**
 * @deprecated Use isAdmin flag on usuarios_empresas instead
 */
export const ADMIN_ROLES: RoleTipo[] = ["admin", "professor_admin"];

// =============================================================================
// Permissões padrão por PapelBase (novo modelo)
// =============================================================================

/**
 * Permissões padrão para cada papel base.
 * - aluno: acesso somente leitura ao conteúdo + gerenciamento de progresso próprio
 * - professor: gerencia conteúdo e agendamentos próprios
 * - usuario: staff administrativo com acesso básico
 */
export const DEFAULT_PERMISSIONS_BY_PAPEL_BASE: Record<
  PapelBase,
  RolePermissions
> = {
  aluno: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: false, create: false, edit: false, delete: false },
    usuarios: { view: false, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: true },
    flashcards: { view: true, create: false, edit: false, delete: false },
    materiais: { view: true, create: false, edit: false, delete: false },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: false },
  },
  professor: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: true, create: false, edit: false, delete: false },
    usuarios: { view: false, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: true },
    flashcards: { view: true, create: true, edit: true, delete: true },
    materiais: { view: true, create: true, edit: true, delete: true },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: false },
  },
  usuario: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: true, create: true, edit: true, delete: false },
    usuarios: { view: true, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: false },
    flashcards: { view: true, create: false, edit: false, delete: false },
    materiais: { view: true, create: false, edit: false, delete: false },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: true },
  },
};

/**
 * Permissões completas para administradores.
 * Concedidas quando isAdmin = true no vínculo usuarios_empresas.
 */
export const ADMIN_PERMISSIONS: RolePermissions = {
  dashboard: { view: true },
  cursos: { view: true, create: true, edit: true, delete: true },
  disciplinas: { view: true, create: true, edit: true, delete: true },
  alunos: { view: true, create: true, edit: true, delete: true },
  usuarios: { view: true, create: true, edit: true, delete: true },
  agendamentos: { view: true, create: true, edit: true, delete: true },
  flashcards: { view: true, create: true, edit: true, delete: true },
  materiais: { view: true, create: true, edit: true, delete: true },
  configuracoes: { view: true, edit: true },
  branding: { view: true, edit: true },
  relatorios: { view: true },
};

// =============================================================================
// Permissões legadas por RoleTipo (deprecated - manter para compatibilidade)
// =============================================================================

/**
 * @deprecated Use DEFAULT_PERMISSIONS_BY_PAPEL_BASE + ADMIN_PERMISSIONS instead
 */
export const DEFAULT_PERMISSIONS: Record<RoleTipo, RolePermissions> = {
  professor: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: true, create: false, edit: false, delete: false },
    usuarios: { view: false, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: true },
    flashcards: { view: true, create: true, edit: true, delete: true },
    materiais: { view: true, create: true, edit: true, delete: true },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: false },
  },
  professor_admin: {
    dashboard: { view: true },
    cursos: { view: true, create: true, edit: true, delete: true },
    disciplinas: { view: true, create: true, edit: true, delete: true },
    alunos: { view: true, create: true, edit: true, delete: true },
    usuarios: { view: true, create: true, edit: true, delete: true },
    agendamentos: { view: true, create: true, edit: true, delete: true },
    flashcards: { view: true, create: true, edit: true, delete: true },
    materiais: { view: true, create: true, edit: true, delete: true },
    configuracoes: { view: true, edit: true },
    branding: { view: true, edit: true },
    relatorios: { view: true },
  },
  staff: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: true, create: true, edit: true, delete: false },
    usuarios: { view: true, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: false },
    flashcards: { view: true, create: false, edit: false, delete: false },
    materiais: { view: true, create: false, edit: false, delete: false },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: true },
  },
  admin: {
    dashboard: { view: true },
    cursos: { view: true, create: true, edit: true, delete: true },
    disciplinas: { view: true, create: true, edit: true, delete: true },
    alunos: { view: true, create: true, edit: true, delete: true },
    usuarios: { view: true, create: true, edit: true, delete: true },
    agendamentos: { view: true, create: true, edit: true, delete: true },
    flashcards: { view: true, create: true, edit: true, delete: true },
    materiais: { view: true, create: true, edit: true, delete: true },
    configuracoes: { view: true, edit: true },
    branding: { view: true, edit: true },
    relatorios: { view: true },
  },
  monitor: {
    dashboard: { view: true },
    cursos: { view: true, create: false, edit: false, delete: false },
    disciplinas: { view: true, create: false, edit: false, delete: false },
    alunos: { view: true, create: false, edit: false, delete: false },
    usuarios: { view: false, create: false, edit: false, delete: false },
    agendamentos: { view: true, create: true, edit: true, delete: false },
    flashcards: { view: true, create: false, edit: false, delete: false },
    materiais: { view: true, create: false, edit: false, delete: false },
    configuracoes: { view: false, edit: false },
    branding: { view: false, edit: false },
    relatorios: { view: false },
  },
};
