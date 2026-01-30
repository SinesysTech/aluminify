/**
 * Resolve empresa ID from tenant slug (for Server Components).
 * Uses x-tenant-id header when set by middleware, otherwise queries DB.
 */
import { headers } from "next/headers";
import { getDatabaseClient } from "@/app/shared/core/database/database";

export async function resolveEmpresaIdFromTenant(
  tenantSlug: string,
): Promise<string | null> {
  const slug = (tenantSlug || "").toLowerCase();
  if (!slug) return null;

  const h = await headers();
  const headerId = h.get("x-tenant-id");
  if (headerId) return headerId;

  const admin = getDatabaseClient();
  const { data } = await admin
    .from("empresas")
    .select("id")
    .or(`slug.eq.${slug},subdomain.eq.${slug}`)
    .eq("ativo", true)
    .maybeSingle();

  return data?.id ?? null;
}
