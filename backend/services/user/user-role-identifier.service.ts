import { SupabaseClient } from "@supabase/supabase-js";
import type { AppUserRole } from "@/types/shared";
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
    options: IdentifyRolesOptions = {}
  ): Promise<UserRoleIdentification> {
    const { empresaId, includeDetails = true } = options;

    const roleDetails: UserRoleDetail[] = [];
    const rolesSet = new Set<Exclude<AppUserRole, "empresa">>();
    const empresaIdsSet = new Set<string>();

    // Check for superadmin role first
    const isSuperadmin = await this.checkSuperadmin(userId);
    if (isSuperadmin) {
      rolesSet.add("superadmin");
    }

    // Check for professor role
    const professorRoles = await this.checkProfessorRoles(userId, empresaId);
    for (const role of professorRoles) {
      rolesSet.add("professor");
      empresaIdsSet.add(role.empresaId);
      if (includeDetails) {
        roleDetails.push(role);
      }
    }

    // Check for aluno role
    const alunoRoles = await this.checkAlunoRoles(userId, empresaId);
    for (const role of alunoRoles) {
      rolesSet.add("aluno");
      empresaIdsSet.add(role.empresaId);
      if (includeDetails) {
        roleDetails.push(role);
      }
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
    empresaId?: string
  ): Promise<Exclude<AppUserRole, "empresa">> {
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
    empresaId: string
  ): Promise<{
    valid: boolean;
    roles: Array<Exclude<AppUserRole, "empresa">>;
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
    newRole: AppUserRole,
    empresaId?: string
  ): Promise<SwitchRoleResult> {
    // Validate that user has the requested role
    const identification = await this.identifyUserRoles(userId, {
      empresaId,
      includeDetails: false,
    });

    if (
      !identification.roles.includes(newRole as Exclude<AppUserRole, "empresa">)
    ) {
      return {
        success: false,
        newRole,
        error: `Usuário não possui o papel ${newRole}`,
      };
    }

    // Update user_metadata.role using admin client
    // Note: This requires the service role key which can only be used server-side
    const { error } = await this.client.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: newRole,
        empresa_id: empresaId,
      },
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

  private async checkSuperadmin(userId: string): Promise<boolean> {
    // Check user_metadata.role for superadmin
    const { data: userData } = await this.client.auth.admin.getUserById(userId);

    if (userData?.user?.user_metadata?.role === "superadmin") {
      return true;
    }

    // Also could check a superadmins table if one exists
    return false;
  }

  private async checkProfessorRoles(
    userId: string,
    empresaId?: string
  ): Promise<UserRoleDetail[]> {
    let query = this.client
      .from("professores")
      .select(
        `
        id,
        empresa_id,
        is_admin,
        empresas!inner (
          id,
          nome,
          slug
        )
      `
      )
      .eq("id", userId);

    if (empresaId) {
      query = query.eq("empresa_id", empresaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[UserRoleIdentifier] Error checking professor roles:",
        error
      );
      return [];
    }

    return (data || []).map(
      (row: {
        id: string;
        empresa_id: string;
        is_admin: boolean;
        empresas:
          | { id: string; nome: string; slug: string }
          | { id: string; nome: string; slug: string }[];
      }) => {
        const empresa = Array.isArray(row.empresas)
          ? row.empresas[0]
          : row.empresas;
        return {
          role: "professor" as const,
          empresaId: row.empresa_id,
          empresaNome: empresa.nome,
          empresaSlug: empresa.slug,
          isAdmin: row.is_admin,
        };
      }
    );
  }

  private async checkAlunoRoles(
    userId: string,
    empresaId?: string
  ): Promise<UserRoleDetail[]> {
    // Alunos are linked to empresas through alunos_cursos -> cursos -> empresa_id
    const query = this.client
      .from("alunos_cursos")
      .select(
        `
        aluno_id,
        cursos!inner (
          empresa_id,
          empresas!inner (
            id,
            nome,
            slug
          )
        )
      `
      )
      .eq("aluno_id", userId);

    const { data, error } = await query;

    if (error) {
      console.error("[UserRoleIdentifier] Error checking aluno roles:", error);
      return [];
    }

    // Deduplicate by empresa_id since a student may be in multiple courses of the same empresa
    const empresaMap = new Map<string, UserRoleDetail>();

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

      // Filter by empresaId if provided
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

  private determinePrimaryRole(
    roles: Array<Exclude<AppUserRole, "empresa">>
  ): Exclude<AppUserRole, "empresa"> {
    // Priority: superadmin > professor > aluno
    if (roles.includes("superadmin")) {
      return "superadmin";
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
  client: SupabaseClient
): UserRoleIdentifierService {
  return new UserRoleIdentifierService(client);
}
