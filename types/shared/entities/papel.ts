/**
 * Tipos para o sistema RBAC (Role-Based Access Control)
 * Papéis e Permissões
 */

// Tipos de papel disponíveis no sistema
export type RoleTipo =
  | 'professor'       // Professor padrão - acesso às próprias disciplinas
  | 'professor_admin' // Professor com poderes administrativos
  | 'staff'          // Funcionário administrativo - não dá aula
  | 'admin'          // Administrador total da empresa
  | 'monitor';       // Monitor - nível básico para monitoria

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

// Papel (Role) do sistema
export interface Papel {
  id: string;
  empresaId: string | null; // NULL = papel do sistema (template)
  nome: string;
  tipo: RoleTipo;
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
  tipo: RoleTipo;
  descricao?: string;
  permissoes: RolePermissions;
}

// Input para atualizar papel
export interface UpdatePapelInput {
  nome?: string;
  descricao?: string;
  permissoes?: Partial<RolePermissions>;
}

// Helper para verificar se é papel de ensino (professor/monitor)
export const TEACHING_ROLES: RoleTipo[] = ['professor', 'professor_admin', 'monitor'];

// Helper para verificar se é papel administrativo
export const ADMIN_ROLES: RoleTipo[] = ['admin', 'professor_admin'];

// Permissões padrão por tipo de papel
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
