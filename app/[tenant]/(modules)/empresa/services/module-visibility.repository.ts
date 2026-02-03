import { SupabaseClient } from '@supabase/supabase-js';
import type {
  ModuleDefinition,
  SubmoduleDefinition,
  TenantModuleVisibility,
  TenantSubmoduleVisibility,
  ModuleWithVisibility,
  SubmoduleWithVisibility,
  VisibleModule,
  VisibleSubmodule,
  ModuleDefinitionRow,
  SubmoduleDefinitionRow,
  TenantModuleVisibilityRow,
  TenantSubmoduleVisibilityRow,
} from './module-visibility.types';

// ============================================
// Repository Interface
// ============================================

export interface ModuleVisibilityRepository {
  // Definitions (read-only)
  findAllModuleDefinitions(): Promise<ModuleDefinition[]>;
  findAllSubmoduleDefinitions(): Promise<SubmoduleDefinition[]>;
  findSubmodulesByModuleId(moduleId: string): Promise<SubmoduleDefinition[]>;

  // Tenant visibility configs
  findModuleVisibilityByEmpresa(empresaId: string): Promise<TenantModuleVisibility[]>;
  findSubmoduleVisibilityByEmpresa(empresaId: string): Promise<TenantSubmoduleVisibility[]>;

  // Combined queries
  getVisibleModulesForEmpresa(empresaId: string): Promise<VisibleModule[]>;
  getModuleVisibilityConfig(empresaId: string): Promise<ModuleWithVisibility[]>;

  // Mutations
  upsertModuleVisibility(
    empresaId: string,
    moduleId: string,
    data: Partial<Omit<TenantModuleVisibility, 'id' | 'empresaId' | 'moduleId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<TenantModuleVisibility>;

  upsertSubmoduleVisibility(
    empresaId: string,
    moduleId: string,
    submoduleId: string,
    data: Partial<Omit<TenantSubmoduleVisibility, 'id' | 'empresaId' | 'moduleId' | 'submoduleId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<TenantSubmoduleVisibility>;

  deleteModuleVisibility(empresaId: string, moduleId: string): Promise<void>;
  deleteSubmoduleVisibility(empresaId: string, moduleId: string, submoduleId: string): Promise<void>;
  deleteAllVisibilityForEmpresa(empresaId: string): Promise<void>;
}

// ============================================
// Helpers
// ============================================

/** Supabase .select() may return data as array or (in some cases) object; ensure we always get an array. */
function toArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && !Array.isArray(data)) return Object.values(data) as T[];
  return [];
}

// ============================================
// Row Mappers
// ============================================

function mapModuleDefinitionRow(row: ModuleDefinitionRow): ModuleDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconName: row.icon_name,
    defaultUrl: row.default_url,
    displayOrder: row.display_order,
    isCore: row.is_core,
    defaultVisible: row.default_visible,
    createdAt: new Date(row.created_at),
  };
}

function mapSubmoduleDefinitionRow(row: SubmoduleDefinitionRow): SubmoduleDefinition {
  return {
    id: row.id,
    moduleId: row.module_id,
    name: row.name,
    defaultUrl: row.default_url,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
  };
}

function mapModuleVisibilityRow(row: TenantModuleVisibilityRow): TenantModuleVisibility {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    moduleId: row.module_id,
    isVisible: row.is_visible,
    customName: row.custom_name,
    customUrl: row.custom_url,
    options: row.options || {},
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapSubmoduleVisibilityRow(row: TenantSubmoduleVisibilityRow): TenantSubmoduleVisibility {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    moduleId: row.module_id,
    submoduleId: row.submodule_id,
    isVisible: row.is_visible,
    customName: row.custom_name,
    customUrl: row.custom_url,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

// ============================================
// Repository Implementation
// ============================================

export class ModuleVisibilityRepositoryImpl implements ModuleVisibilityRepository {
  constructor(private readonly client: SupabaseClient) {}

  // ----------------------------------------
  // Definitions (read-only)
  // ----------------------------------------

  async findAllModuleDefinitions(): Promise<ModuleDefinition[]> {
    const { data, error } = await this.client
      .from('module_definitions')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch module definitions: ${error.message}`);
    }

    return toArray<ModuleDefinitionRow>(data).map(mapModuleDefinitionRow);
  }

  async findAllSubmoduleDefinitions(): Promise<SubmoduleDefinition[]> {
    const { data, error } = await this.client
      .from('submodule_definitions')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch submodule definitions: ${error.message}`);
    }

    return toArray<SubmoduleDefinitionRow>(data).map(mapSubmoduleDefinitionRow);
  }

  async findSubmodulesByModuleId(moduleId: string): Promise<SubmoduleDefinition[]> {
    const { data, error } = await this.client
      .from('submodule_definitions')
      .select('*')
      .eq('module_id', moduleId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch submodules for module ${moduleId}: ${error.message}`);
    }

    return toArray<SubmoduleDefinitionRow>(data).map(mapSubmoduleDefinitionRow);
  }

  // ----------------------------------------
  // Tenant visibility configs
  // ----------------------------------------

  async findModuleVisibilityByEmpresa(empresaId: string): Promise<TenantModuleVisibility[]> {
    const { data, error } = await this.client
      .from('tenant_module_visibility')
      .select('*')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Failed to fetch module visibility for empresa ${empresaId}: ${error.message}`);
    }

    return toArray<TenantModuleVisibilityRow>(data).map(mapModuleVisibilityRow);
  }

  async findSubmoduleVisibilityByEmpresa(empresaId: string): Promise<TenantSubmoduleVisibility[]> {
    const { data, error } = await this.client
      .from('tenant_submodule_visibility')
      .select('*')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Failed to fetch submodule visibility for empresa ${empresaId}: ${error.message}`);
    }

    return toArray<TenantSubmoduleVisibilityRow>(data).map(mapSubmoduleVisibilityRow);
  }

  // ----------------------------------------
  // Combined queries
  // ----------------------------------------

  async getVisibleModulesForEmpresa(empresaId: string): Promise<VisibleModule[]> {
    // Fetch all data in parallel
    const [moduleDefinitions, submoduleDefinitions, moduleVisibility, submoduleVisibility] = await Promise.all([
      this.findAllModuleDefinitions(),
      this.findAllSubmoduleDefinitions(),
      this.findModuleVisibilityByEmpresa(empresaId),
      this.findSubmoduleVisibilityByEmpresa(empresaId),
    ]);

    // Create lookup maps for visibility
    const moduleVisibilityMap = new Map(moduleVisibility.map(v => [v.moduleId, v]));
    const submoduleVisibilityMap = new Map(
      submoduleVisibility.map(v => [`${v.moduleId}:${v.submoduleId}`, v])
    );

    // Group submodules by module
    const submodulesByModule = new Map<string, SubmoduleDefinition[]>();
    for (const sub of submoduleDefinitions) {
      const existing = submodulesByModule.get(sub.moduleId) || [];
      existing.push(sub);
      submodulesByModule.set(sub.moduleId, existing);
    }

    // Build visible modules list
    const visibleModules: VisibleModule[] = [];

    for (const moduleDef of moduleDefinitions) {
      const visibility = moduleVisibilityMap.get(moduleDef.id);

      // Check if module is visible (default: use module's defaultVisible setting)
      const isVisible = visibility?.isVisible ?? moduleDef.defaultVisible;
      if (!isVisible) continue;

      // Get submodules for this module
      const submodules = submodulesByModule.get(moduleDef.id) || [];
      const visibleSubmodules: VisibleSubmodule[] = [];

      for (const subDef of submodules) {
        const subVisibility = submoduleVisibilityMap.get(`${moduleDef.id}:${subDef.id}`);

        // Check if submodule is visible (default: true if no config)
        const isSubVisible = subVisibility?.isVisible ?? true;
        if (!isSubVisible) continue;

        visibleSubmodules.push({
          id: subDef.id,
          name: subVisibility?.customName || subDef.name,
          url: subVisibility?.customUrl || subDef.defaultUrl,
          displayOrder: subVisibility?.displayOrder ?? subDef.displayOrder,
        });
      }

      // Sort submodules by display order
      visibleSubmodules.sort((a, b) => a.displayOrder - b.displayOrder);

      visibleModules.push({
        id: moduleDef.id,
        name: visibility?.customName || moduleDef.name,
        url: visibility?.customUrl || moduleDef.defaultUrl,
        iconName: moduleDef.iconName,
        displayOrder: visibility?.displayOrder ?? moduleDef.displayOrder,
        isCore: moduleDef.isCore,
        submodules: visibleSubmodules,
      });
    }

    // Sort modules by display order
    visibleModules.sort((a, b) => a.displayOrder - b.displayOrder);

    return visibleModules;
  }

  async getModuleVisibilityConfig(empresaId: string): Promise<ModuleWithVisibility[]> {
    // Fetch all data in parallel
    const [moduleDefinitions, submoduleDefinitions, moduleVisibility, submoduleVisibility] = await Promise.all([
      this.findAllModuleDefinitions(),
      this.findAllSubmoduleDefinitions(),
      this.findModuleVisibilityByEmpresa(empresaId),
      this.findSubmoduleVisibilityByEmpresa(empresaId),
    ]);

    // Create lookup maps
    const moduleVisibilityMap = new Map(moduleVisibility.map(v => [v.moduleId, v]));
    const submoduleVisibilityMap = new Map(
      submoduleVisibility.map(v => [`${v.moduleId}:${v.submoduleId}`, v])
    );

    // Group submodules by module
    const submodulesByModule = new Map<string, SubmoduleDefinition[]>();
    for (const sub of submoduleDefinitions) {
      const existing = submodulesByModule.get(sub.moduleId) || [];
      existing.push(sub);
      submodulesByModule.set(sub.moduleId, existing);
    }

    // Build config list
    const config: ModuleWithVisibility[] = moduleDefinitions.map(moduleDef => {
      const visibility = moduleVisibilityMap.get(moduleDef.id) || null;
      const submodules = submodulesByModule.get(moduleDef.id) || [];

      const submodulesWithVisibility: SubmoduleWithVisibility[] = submodules.map(subDef => ({
        ...subDef,
        visibility: submoduleVisibilityMap.get(`${moduleDef.id}:${subDef.id}`) || null,
      }));

      return {
        ...moduleDef,
        visibility,
        submodules: submodulesWithVisibility,
      };
    });

    return config;
  }

  // ----------------------------------------
  // Mutations
  // ----------------------------------------

  async upsertModuleVisibility(
    empresaId: string,
    moduleId: string,
    data: Partial<Omit<TenantModuleVisibility, 'id' | 'empresaId' | 'moduleId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<TenantModuleVisibility> {
    const upsertData = {
      empresa_id: empresaId,
      module_id: moduleId,
      is_visible: data.isVisible ?? true,
      custom_name: data.customName ?? null,
      custom_url: data.customUrl ?? null,
      options: data.options ?? {},
      display_order: data.displayOrder ?? null,
      updated_by: userId,
    };

    const { data: result, error } = await this.client
      .from('tenant_module_visibility')
      .upsert(upsertData, { onConflict: 'empresa_id,module_id' })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to upsert module visibility: ${error.message}`);
    }

    return mapModuleVisibilityRow(result);
  }

  async upsertSubmoduleVisibility(
    empresaId: string,
    moduleId: string,
    submoduleId: string,
    data: Partial<Omit<TenantSubmoduleVisibility, 'id' | 'empresaId' | 'moduleId' | 'submoduleId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<TenantSubmoduleVisibility> {
    const upsertData = {
      empresa_id: empresaId,
      module_id: moduleId,
      submodule_id: submoduleId,
      is_visible: data.isVisible ?? true,
      custom_name: data.customName ?? null,
      custom_url: data.customUrl ?? null,
      display_order: data.displayOrder ?? null,
      updated_by: userId,
    };

    const { data: result, error } = await this.client
      .from('tenant_submodule_visibility')
      .upsert(upsertData, { onConflict: 'empresa_id,module_id,submodule_id' })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to upsert submodule visibility: ${error.message}`);
    }

    return mapSubmoduleVisibilityRow(result);
  }

  async bulkUpsertModuleVisibility(
    empresaId: string,
    inputs: { moduleId: string; data: Partial<Omit<TenantModuleVisibility, 'id' | 'empresaId' | 'moduleId' | 'createdAt' | 'updatedAt'>> }[],
    userId: string
  ): Promise<TenantModuleVisibility[]> {
    const upsertData = inputs.map(({ moduleId, data }) => ({
      empresa_id: empresaId,
      module_id: moduleId,
      is_visible: data.isVisible ?? true,
      custom_name: data.customName ?? null,
      custom_url: data.customUrl ?? null,
      options: data.options ?? {},
      display_order: data.displayOrder ?? null,
      updated_by: userId,
    }));

    const { data: result, error } = await this.client
      .from('tenant_module_visibility')
      .upsert(upsertData, { onConflict: 'empresa_id,module_id' })
      .select('*');

    if (error) {
      throw new Error(`Failed to bulk upsert module visibility: ${error.message}`);
    }

    return toArray<TenantModuleVisibilityRow>(result).map(mapModuleVisibilityRow);
  }

  async bulkUpsertSubmoduleVisibility(
    empresaId: string,
    inputs: { moduleId: string; submoduleId: string; data: Partial<Omit<TenantSubmoduleVisibility, 'id' | 'empresaId' | 'moduleId' | 'submoduleId' | 'createdAt' | 'updatedAt'>> }[],
    userId: string
  ): Promise<TenantSubmoduleVisibility[]> {
    const upsertData = inputs.map(({ moduleId, submoduleId, data }) => ({
      empresa_id: empresaId,
      module_id: moduleId,
      submodule_id: submoduleId,
      is_visible: data.isVisible ?? true,
      custom_name: data.customName ?? null,
      custom_url: data.customUrl ?? null,
      display_order: data.displayOrder ?? null,
      updated_by: userId,
    }));

    const { data: result, error } = await this.client
      .from('tenant_submodule_visibility')
      .upsert(upsertData, { onConflict: 'empresa_id,module_id,submodule_id' })
      .select('*');

    if (error) {
      throw new Error(`Failed to bulk upsert submodule visibility: ${error.message}`);
    }

    return toArray<TenantSubmoduleVisibilityRow>(result).map(mapSubmoduleVisibilityRow);
  }

  async deleteModuleVisibility(empresaId: string, moduleId: string): Promise<void> {
    const { error } = await this.client
      .from('tenant_module_visibility')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('module_id', moduleId);

    if (error) {
      throw new Error(`Failed to delete module visibility: ${error.message}`);
    }
  }

  async deleteSubmoduleVisibility(empresaId: string, moduleId: string, submoduleId: string): Promise<void> {
    const { error } = await this.client
      .from('tenant_submodule_visibility')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('module_id', moduleId)
      .eq('submodule_id', submoduleId);

    if (error) {
      throw new Error(`Failed to delete submodule visibility: ${error.message}`);
    }
  }

  async deleteAllVisibilityForEmpresa(empresaId: string): Promise<void> {
    // Delete submodule visibility first (foreign key constraints)
    const { error: subError } = await this.client
      .from('tenant_submodule_visibility')
      .delete()
      .eq('empresa_id', empresaId);

    if (subError) {
      throw new Error(`Failed to delete submodule visibility: ${subError.message}`);
    }

    // Then delete module visibility
    const { error: modError } = await this.client
      .from('tenant_module_visibility')
      .delete()
      .eq('empresa_id', empresaId);

    if (modError) {
      throw new Error(`Failed to delete module visibility: ${modError.message}`);
    }
  }
}
