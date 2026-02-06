import { SupabaseClient } from "@supabase/supabase-js";
import type { PapelBase } from "@/app/shared/types";
import type { RoleTipo, RolePermissions } from "@/app/shared/types/entities/papel";
import type {
  UserRoleIdentification,
  UserRoleDetail,
  IdentifyRolesOptions,
  SwitchRoleResult,
} from "./user-role-identifier.types";

/**
 * Service for identifying and managing user roles across tenants
 */
export class UserRoleIdentifierService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Identify all roles a user has across tenants
   * @param userId - The user's auth ID
   * @param options - Options for role identification
   */
  async identifyUserRoles(
    userId: string,
    options: IdentifyRolesOptions = {},
  ): Promise<UserRoleIdentification> {
    const { empresaId, includeDetails = true } = options;

    const roleDetails: UserRoleDetail[] = [];
    const rolesSet = new Set<PapelBase>();
    const empresaIdsSet = new Set<string>();

    // Buscar email/metadata do usuário (útil para fallback por email)
    const { data: userData, error: userDataError } =
      await this.client.auth.admin.getUserById(userId);
    if (userDataError) {
      console.warn(
        "[UserRoleIdentifier] Failed to get user by id:",
        userDataError,
      );
    }
    const userEmail = userData?.user?.email?.toLowerCase() ?? null;

    // Check for usuario role (institution staff)
    // First check in 'usuarios' table (new structure)
    const usuarioRoles = await this.checkUsuarioRoles(
      userId,
      empresaId,
      userEmail,
    );
    for (const role of usuarioRoles) {
      rolesSet.add("usuario");
      empresaIdsSet.add(role.empresaId);
      if (includeDetails) {
        roleDetails.push(role);
      }
    }

    // Check for aluno role
    const alunoExists = await this.checkAlunoExists(userId, userEmail);
    if (alunoExists) {
      rolesSet.add("aluno");
    }
    // Detalhes (empresa) do aluno continuam vindo por cursos/empresa_id via join table
    const alunoRoleDetails = includeDetails
      ? await this.checkAlunoRoleDetails(userId, empresaId)
      : [];
    for (const role of alunoRoleDetails) {
      empresaIdsSet.add(role.empresaId);
      roleDetails.push(role);
    }

    const roles = Array.from(rolesSet);
    const primaryRole = this.determinePrimaryRole(roles);

    return {
      userId,
      roles,
      primaryRole,
      empresaIds: Array.from(empresaIdsSet),
      roleDetails,
    };
  }

  /**
   * Get the primary role for a user
   * Useful for determining the default dashboard to redirect to
   */
  async getUserPrimaryRole(
    userId: string,
    empresaId?: string,
  ): Promise<PapelBase> {
    const identification = await this.identifyUserRoles(userId, {
      empresaId,
      includeDetails: false,
    });
    return identification.primaryRole;
  }

  /**
   * Validate that a user belongs to a specific tenant
   */
  async validateUserBelongsToTenant(
    userId: string,
    empresaId: string,
  ): Promise<{
    valid: boolean;
    roles: PapelBase[];
  }> {
    const identification = await this.identifyUserRoles(userId, {
      empresaId,
      includeDetails: false,
    });

    const valid = identification.empresaIds.includes(empresaId);
    return {
      valid,
      roles: valid ? identification.roles : [],
    };
  }

  /**
   * Switch user's active role
   * Updates user_metadata.role in auth.users
   */
  async switchUserRole(
    userId: string,
    newRole: PapelBase,
    empresaId?: string,
  ): Promise<SwitchRoleResult> {
    // Validate that user has the requested role
    const identification = await this.identifyUserRoles(userId, {
      empresaId,
      includeDetails: false,
    });

    if (!identification.roles.includes(newRole)) {
      return {
        success: false,
        newRole,
        error: `Usuário não possui o papel ${newRole}`,
      };
    }

    // Update user_metadata.role using admin client
    // Note: This requires the service role key which can only be used server-side
    const userMetadata: Record<string, unknown> = {
      role: newRole,
    };
    if (empresaId) {
      userMetadata.empresa_id = empresaId;
    }

    const { error } = await this.client.auth.admin.updateUserById(userId, {
      user_metadata: userMetadata,
    });

    if (error) {
      console.error("[UserRoleIdentifier] Failed to switch role:", error);
      return {
        success: false,
        newRole,
        error: error.message,
      };
    }

    return {
      success: true,
      newRole,
      empresaId,
    };
  }

  /**
   * Get all empresas a user has access to
   */
  async getUserEmpresas(userId: string): Promise<UserRoleDetail[]> {
    const identification = await this.identifyUserRoles(userId, {
      includeDetails: true,
    });
    return identification.roleDetails;
  }

  // Private helper methods

  private async checkUsuarioRoles(
    userId: string,
    empresaId?: string,
    email?: string | null,
  ): Promise<UserRoleDetail[]> {
    // Query usuarios with usuarios_empresas join to get isAdmin/isOwner flags
    let query = this.client
      .from("usuarios")
      .select(
        `
        id,
        empresa_id,
        papel_id,
        papeis (
          tipo,
          permissoes
        ),
        empresas!inner (
          id,
          nome,
          slug
        ),
        usuarios_empresas!inner (
          is_admin,
          is_owner
        )
      `,
      )
      .eq("id", userId)
      .eq("ativo", true)
      .is("deleted_at", null);

    if (empresaId) {
      query = query.eq("empresa_id", empresaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[UserRoleIdentifier] Error checking usuario roles:",
        error,
      );
      // Continue to fallback by email if available
    }

    // Type for raw query result
    type UsuarioQueryRow = {
      id: string;
      empresa_id: string;
      papel_id: string | null;
      papeis:
        | { tipo: string | null; permissoes: unknown }
        | { tipo: string | null; permissoes: unknown }[]
        | null;
      empresas:
        | { id: string; nome: string; slug: string }
        | { id: string; nome: string; slug: string }[];
      usuarios_empresas:
        | { is_admin: boolean; is_owner: boolean }
        | { is_admin: boolean; is_owner: boolean }[];
    };

    const rows = (data || []) as UsuarioQueryRow[];

    // Fallback: some databases may have users registered by email (or divergent id)
    if (!rows.length && email) {
      let emailQuery = this.client
        .from("usuarios")
        .select(
          `
          id,
          empresa_id,
          papel_id,
          papeis (
            tipo,
            permissoes
          ),
          empresas!inner (
            id,
            nome,
            slug
          ),
          usuarios_empresas!inner (
            is_admin,
            is_owner
          )
        `,
        )
        .eq("email", email)
        .eq("ativo", true)
        .is("deleted_at", null);

      if (empresaId) {
        emailQuery = emailQuery.eq("empresa_id", empresaId);
      }

      const { data: emailData, error: emailError } = await emailQuery;
      if (emailError) {
        console.error(
          "[UserRoleIdentifier] Error checking usuario roles by email:",
          emailError,
        );
      } else {
        rows.push(...((emailData || []) as UsuarioQueryRow[]));
      }
    }

    return rows.map((row) => {
      const empresa = Array.isArray(row.empresas)
        ? row.empresas[0]
        : row.empresas;
      const vinculo = Array.isArray(row.usuarios_empresas)
        ? row.usuarios_empresas[0]
        : row.usuarios_empresas;

      // Get isAdmin/isOwner from usuarios_empresas (new model)
      const isAdmin = vinculo?.is_admin ?? false;
      const isOwner = vinculo?.is_owner ?? false;

      // Get papel data if exists (for custom permissions)
      let roleType: RoleTipo | undefined;
      let permissions: RolePermissions | undefined;

      if (row.papeis) {
        const papel = Array.isArray(row.papeis) ? row.papeis[0] : row.papeis;
        if (papel) {
          roleType = (papel.tipo as RoleTipo) ?? undefined;
          permissions = papel.permissoes as RolePermissions | undefined;
        }
      }

      return {
        role: "usuario" as const,
        empresaId: row.empresa_id,
        empresaNome: empresa.nome,
        empresaSlug: empresa.slug,
        isAdmin,
        isOwner,
        roleType, // deprecated, kept for compatibility
        permissions,
      };
    });
  }

  /**
   * Verifica se existe vínculo de aluno em usuarios_empresas para este usuário.
   */
  private async checkAlunoExists(
    userId: string,
    email?: string | null,
  ): Promise<boolean> {
    const { data: byId, error: idError } = await this.client
      .from("usuarios_empresas")
      .select("id")
      .eq("usuario_id", userId)
      .eq("papel_base", "aluno")
      .eq("ativo", true)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (idError) {
      console.error(
        "[UserRoleIdentifier] Error checking aluno by id:",
        idError,
      );
    }

    if (byId?.id) {
      return true;
    }

    if (!email) {
      return false;
    }

    // Email fallback: find usuario by email, then check vinculos
    const { data: usuario, error: emailError } = await this.client
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailError || !usuario?.id) {
      return false;
    }

    const { data: byEmail } = await this.client
      .from("usuarios_empresas")
      .select("id")
      .eq("usuario_id", usuario.id)
      .eq("papel_base", "aluno")
      .eq("ativo", true)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    return Boolean(byEmail?.id);
  }

  /**
   * Detalhes de aluno por empresa.
   * Checks usuarios_empresas for aluno bindings,
   * then falls back to alunos_cursos -> cursos -> empresas for legacy data.
   */
  private async checkAlunoRoleDetails(
    userId: string,
    empresaId?: string,
  ): Promise<UserRoleDetail[]> {
    const empresaMap = new Map<string, UserRoleDetail>();

    // Check usuarios_empresas for aluno bindings with empresa details
    let vinculoQuery = this.client
      .from("usuarios_empresas")
      .select(
        `
        empresa_id,
        empresas!inner (
          id,
          nome,
          slug
        )
      `,
      )
      .eq("usuario_id", userId)
      .eq("papel_base", "aluno")
      .eq("ativo", true)
      .is("deleted_at", null);

    if (empresaId) {
      vinculoQuery = vinculoQuery.eq("empresa_id", empresaId);
    }

    const { data: vinculos, error: vinculoError } = await vinculoQuery;

    if (vinculoError) {
      console.error(
        "[UserRoleIdentifier] Error checking aluno empresas:",
        vinculoError,
      );
    }

    type VinculoQueryRow = {
      empresa_id: string;
      empresas:
        | { id: string; nome: string; slug: string }
        | { id: string; nome: string; slug: string }[];
    };

    for (const row of (vinculos || []) as VinculoQueryRow[]) {
      const empresa = Array.isArray(row.empresas)
        ? row.empresas[0]
        : row.empresas;

      if (!empresaMap.has(row.empresa_id)) {
        empresaMap.set(row.empresa_id, {
          role: "aluno" as const,
          empresaId: row.empresa_id,
          empresaNome: empresa.nome,
          empresaSlug: empresa.slug,
        });
      }
    }

    // Also check via alunos_cursos -> cursos -> empresas (legacy structure)
    const query = this.client
      .from("alunos_cursos")
      .select(
        `
        usuario_id,
        cursos!inner (
          empresa_id,
          empresas!inner (
            id,
            nome,
            slug
          )
        )
      `,
      )
      .eq("usuario_id", userId);

    const { data, error } = await query;

    if (error) {
      console.error(
        "[UserRoleIdentifier] Error checking aluno role details via cursos:",
        error,
      );
    }

    for (const row of data || []) {
      const cursoRaw = row.cursos as unknown as {
        empresa_id: string;
        empresas:
          | { id: string; nome: string; slug: string }
          | { id: string; nome: string; slug: string }[];
      };

      const empresaRaw = Array.isArray(cursoRaw.empresas)
        ? cursoRaw.empresas[0]
        : cursoRaw.empresas;

      const curso = {
        empresa_id: cursoRaw.empresa_id,
        empresas: empresaRaw,
      };

      if (empresaId && curso.empresa_id !== empresaId) {
        continue;
      }

      if (!empresaMap.has(curso.empresa_id)) {
        empresaMap.set(curso.empresa_id, {
          role: "aluno" as const,
          empresaId: curso.empresa_id,
          empresaNome: curso.empresas.nome,
          empresaSlug: curso.empresas.slug,
        });
      }
    }

    return Array.from(empresaMap.values());
  }

  private determinePrimaryRole(roles: PapelBase[]): PapelBase {
    // Priority: usuario > professor > aluno
    if (roles.includes("usuario")) {
      return "usuario";
    }
    if (roles.includes("professor")) {
      return "professor";
    }
    if (roles.includes("aluno")) {
      return "aluno";
    }
    // Default to aluno if no roles found (shouldn't happen)
    return "aluno";
  }
}

/**
 * Create a user role identifier service instance
 */
export function createUserRoleIdentifier(
  client: SupabaseClient,
): UserRoleIdentifierService {
  return new UserRoleIdentifierService(client);
}
