"use server";

import { requireUser } from "@/app/shared/core/auth";
import {
  saveOAuthCredentials,
  getOAuthCredentials,
  getOAuthClientId,
  getTenantOAuthStatus,
  deleteOAuthCredentials,
} from "@/app/shared/core/services/oauth-credentials";
import type { OAuthProvider } from "@/app/shared/core/services/oauth-credentials";
import { revalidatePath } from "next/cache";

// =============================================
// Admin Actions (OAuth App Credentials)
// =============================================

/**
 * Returns which OAuth providers are configured for the tenant.
 */
export async function getTenantOAuthConfig(empresaId: string) {
  return getTenantOAuthStatus(empresaId);
}

/**
 * Saves OAuth app credentials (client_id + client_secret) for a tenant.
 * Requires admin permissions.
 */
export async function saveTenantOAuthCredentials(
  empresaId: string,
  provider: OAuthProvider,
  clientId: string,
  clientSecret: string,
) {
  const user = await requireUser({ allowedRoles: ["usuario"] });

  if (!user.isAdmin || user.empresaId !== empresaId) {
    throw new Error("Sem permissão para configurar credenciais OAuth");
  }

  await saveOAuthCredentials(empresaId, provider, clientId, clientSecret, user.id);
  revalidatePath(`/${user.empresaSlug}/settings/integracoes`);
}

/**
 * Deletes OAuth app credentials for a tenant.
 * Requires admin permissions.
 */
export async function deleteTenantOAuthCredentials(
  empresaId: string,
  provider: OAuthProvider,
) {
  const user = await requireUser({ allowedRoles: ["usuario"] });

  if (!user.isAdmin || user.empresaId !== empresaId) {
    throw new Error("Sem permissão para deletar credenciais OAuth");
  }

  await deleteOAuthCredentials(empresaId, provider);
  revalidatePath(`/${user.empresaSlug}/settings/integracoes`);
}

// =============================================
// Professor Actions (OAuth Flow)
// =============================================

/**
 * Builds the OAuth authorization URL for a professor to connect their account.
 * Fetches the tenant's client_id from the database.
 * Returns null if the provider is not configured for the tenant.
 */
export async function getOAuthAuthorizationUrl(
  professorId: string,
  empresaId: string,
  tenantSlug: string,
  provider: OAuthProvider,
): Promise<string | null> {
  const clientId = await getOAuthClientId(empresaId, provider);

  if (!clientId) {
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const redirectUri = `${appUrl}/api/empresa/integracoes/${provider}/callback`;
  const state = encodeURIComponent(
    JSON.stringify({ professorId, empresaId, tenantSlug }),
  );

  if (provider === "google") {
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/calendar.events",
    );
    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`
    );
  }

  if (provider === "zoom") {
    return (
      `https://zoom.us/oauth/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${state}`
    );
  }

  return null;
}

/**
 * Fetches full decrypted credentials for use in OAuth token exchange (callbacks).
 * Should only be called from server-side API routes.
 */
export async function getOAuthCredentialsForCallback(
  empresaId: string,
  provider: OAuthProvider,
) {
  return getOAuthCredentials(empresaId, provider);
}
