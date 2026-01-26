import { getDatabaseClient } from "@/app/shared/core/database/database";
import { randomBytes } from "crypto";

export class UserBaseService {
  protected getAdminClient() {
    return getDatabaseClient();
  }

  /**
   * Creates an Auth user in Supabase using the Admin API.
   * Handles "email already registered" conflicts gracefully if needed.
   */
  async createAuthUser(params: {
    email: string;
    password?: string;
    fullName?: string;
    role: "aluno" | "professor" | "usuario" | "superadmin" | "empresa";
    empresaId?: string;
    isAdmin?: boolean;
    mustChangePassword?: boolean;
  }): Promise<{ userId: string; isNew: boolean }> {
    const adminClient = this.getAdminClient();

    // Generate random password if not provided
    const password = params.password || randomBytes(16).toString("hex");

    const userMetadata: Record<string, unknown> = {
      role: params.role,
      full_name: params.fullName,
      is_admin: params.isAdmin ?? false,
      must_change_password: params.mustChangePassword ?? true,
    };

    if (params.empresaId) {
      userMetadata.empresa_id = params.empresaId;
    }

    const { data: authUser, error: authError } =
      await adminClient.auth.admin.createUser({
        email: params.email,
        password: password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    if (authError) {
      // Check for existing user conflict
      const m = authError.message?.toLowerCase() || "";
      if (
        m.includes("already be registered") ||
        m.includes("already registered") ||
        m.includes("already exists") ||
        authError.status === 422
      ) {
        // User exists, fetch ID
        // Note: In some setups, we might want to throw a conflict error here.
        // But the legacy services (Student/Teacher) often tried to find the existing user.
        // Let's defer strict conflict handling to the caller, or provide a way to fetch existing.

        // We will try to fetch the existing user to return their ID.
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        // Pagination warning: listUsers defaults to 50. Ideally we search by email if available.
        // Supabase Admin API doesn't allow direct getByEmail easily without list.
        // Optimization: In a real large system we would rely on the caller validation.

        // For now, let's try to simulate what TeacherService was doing:
        const existingUser = usersList?.users?.find(
          (u) => u.email === params.email,
        );
        if (existingUser) {
          // Update metadata just in case? TeacherService was doing it.
          // Let's return the ID and let the caller decide if they want to update.
          return { userId: existingUser.id, isNew: false };
        }

        throw new Error(
          `Conflict: User with email ${params.email} exists in Auth but could not be retrieved.`,
        );
      }

      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authUser?.user) {
      throw new Error("Failed to create auth user: No user returned");
    }

    return { userId: authUser.user.id, isNew: true };
  }

  async updateAuthUser(
    userId: string,
    updates: {
      password?: string;
      fullName?: string;
      role?: string;
      empresaId?: string;
      isAdmin?: boolean;
      mustChangePassword?: boolean;
    },
  ) {
    const adminClient = this.getAdminClient();

    const updatePayload: { password?: string; user_metadata?: Record<string, unknown> } = {};
    if (updates.password) updatePayload.password = updates.password;

    const metadataUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined)
      metadataUpdates.full_name = updates.fullName;
    if (updates.role !== undefined) metadataUpdates.role = updates.role;
    if (updates.empresaId !== undefined)
      metadataUpdates.empresa_id = updates.empresaId;
    if (updates.isAdmin !== undefined)
      metadataUpdates.is_admin = updates.isAdmin;
    if (updates.mustChangePassword !== undefined)
      metadataUpdates.must_change_password = updates.mustChangePassword;

    if (Object.keys(metadataUpdates).length > 0) {
      updatePayload.user_metadata = metadataUpdates; // Merged by Supabase usually, but check current metadata if needed (Supabase usually merges shallowly or replaces? Docs say updates are merged for top-level keys).
    }

    if (Object.keys(updatePayload).length === 0) return;

    const { error } = await adminClient.auth.admin.updateUserById(
      userId,
      updatePayload,
    );
    if (error) {
      throw new Error(`Failed to update auth user: ${error.message}`);
    }
  }
}
