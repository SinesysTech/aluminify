// ============================================
// Module Definition Types (Reference Data)
// ============================================

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string | null;
  iconName: string;
  defaultUrl: string;
  displayOrder: number;
  isCore: boolean;
  createdAt: Date;
}

export interface SubmoduleDefinition {
  id: string;
  moduleId: string;
  name: string;
  defaultUrl: string;
  displayOrder: number;
  createdAt: Date;
}

// ============================================
// Tenant Configuration Types (Per-tenant settings)
// ============================================

export interface TenantModuleVisibility {
  id: string;
  empresaId: string;
  moduleId: string;
  isVisible: boolean;
  customName: string | null;
  customUrl: string | null;
  options: Record<string, unknown>;
  displayOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface TenantSubmoduleVisibility {
  id: string;
  empresaId: string;
  moduleId: string;
  submoduleId: string;
  isVisible: boolean;
  customName: string | null;
  customUrl: string | null;
  displayOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// ============================================
// Combined Types for Frontend Consumption
// ============================================

/**
 * Represents a visible module for the sidebar
 * This is the final computed state after applying tenant visibility settings
 */
export interface VisibleModule {
  id: string;
  name: string;
  url: string;
  iconName: string;
  displayOrder: number;
  isCore: boolean;
  submodules: VisibleSubmodule[];
}

export interface VisibleSubmodule {
  id: string;
  name: string;
  url: string;
  displayOrder: number;
}

/**
 * Module with its visibility configuration for admin UI
 * Includes both the definition and the tenant-specific settings
 */
export interface ModuleWithVisibility extends ModuleDefinition {
  visibility: TenantModuleVisibility | null;
  submodules: SubmoduleWithVisibility[];
}

export interface SubmoduleWithVisibility extends SubmoduleDefinition {
  visibility: TenantSubmoduleVisibility | null;
}

// ============================================
// Input Types for Mutations
// ============================================

export interface UpdateModuleVisibilityInput {
  moduleId: string;
  isVisible?: boolean;
  customName?: string | null;
  customUrl?: string | null;
  displayOrder?: number | null;
  options?: Record<string, unknown>;
}

export interface UpdateSubmoduleVisibilityInput {
  moduleId: string;
  submoduleId: string;
  isVisible?: boolean;
  customName?: string | null;
  customUrl?: string | null;
  displayOrder?: number | null;
}

export interface BulkUpdateModuleVisibilityInput {
  modules: UpdateModuleVisibilityInput[];
  submodules: UpdateSubmoduleVisibilityInput[];
}

// ============================================
// Database Row Types (snake_case to match Supabase)
// ============================================

export interface ModuleDefinitionRow {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  default_url: string;
  display_order: number;
  is_core: boolean;
  created_at: string;
}

export interface SubmoduleDefinitionRow {
  id: string;
  module_id: string;
  name: string;
  default_url: string;
  display_order: number;
  created_at: string;
}

export interface TenantModuleVisibilityRow {
  id: string;
  empresa_id: string;
  module_id: string;
  is_visible: boolean;
  custom_name: string | null;
  custom_url: string | null;
  options: Record<string, unknown>;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TenantSubmoduleVisibilityRow {
  id: string;
  empresa_id: string;
  module_id: string;
  submodule_id: string;
  is_visible: boolean;
  custom_name: string | null;
  custom_url: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
