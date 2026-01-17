"use server";

import { createClient } from "@/lib/server";
import { createUserRoleIdentifier } from "@/backend/services/user/user-role-identifier.service";

export type IdentifyRoleResult = {
  success: boolean;
  redirectUrl?: string;
  error?: string;
};

export async function identifyUserRoleAction(
  userId: string
): Promise<IdentifyRoleResult> {
  try {
    const supabase = await createClient();
    const roleIdentifier = createUserRoleIdentifier(supabase);

    const { primaryRole } = await roleIdentifier.identifyUserRoles(userId, {
      includeDetails: false,
    });

    let redirectUrl = "/protected"; // Fallback

    switch (primaryRole) {
      case "superadmin":
        redirectUrl = "/admin"; // Or superadmin specific dashboard
        break;
      case "professor":
        redirectUrl = "/professor/dashboard";
        break;
      case "aluno":
        redirectUrl = "/aluno/dashboard";
        break;
      default:
        console.warn(
          `[identifyUserRoleAction] Unknown role: ${primaryRole} for user ${userId}`
        );
        redirectUrl = "/protected";
    }

    return { success: true, redirectUrl };
  } catch (error) {
    console.error("[identifyUserRoleAction] Error:", error);
    return { success: false, error: "Failed to identify user role" };
  }
}
