"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useStudentOrganizations } from "@/components/providers/student-organizations-provider";

/**
 * Keeps the UI scoped to the currently selected organization (empresa) for multi-org students.
 *
 * Behavior:
 * - If the student is multi-org and no org is selected yet, auto-select the org matching the current tenant slug.
 * - When the selected org changes, navigate to the same path under the selected org's tenant slug.
 *
 * This ensures:
 * - The user sees the correct tenant branding/modules/content.
 * - Cross-tenant navigation is explicit and predictable.
 */
export function StudentTenantCoordinator() {
  // const router = useRouter(); // Unused
  // const pathname = usePathname(); // Unused
  const params = useParams<{ tenant?: string | string[] }>();

  const tenantSlug = useMemo(() => {
    const raw = params?.tenant;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return (value ?? "").toString();
  }, [params]);

  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isMultiOrg,
    loading,
  } = useStudentOrganizations();

  // const lastNavigatedToSlug = useRef<string | null>(null); // Unused

  useEffect(() => {
    // We only care if we are in a multi-org scenario and not loading
    if (!isMultiOrg || loading) return;

    // If there is no tenant slug in the URL, we can't do anything
    if (!tenantSlug) return;

    // Se a org ativa não bate com a URL (ex: localStorage tinha CDF, usuário está em /terra-negra), limpar
    if (activeOrganization && activeOrganization.slug !== tenantSlug) {
      const match = organizations.find((o) => o.slug === tenantSlug);
      if (match) {
        setActiveOrganization(match);
      } else {
        setActiveOrganization(null);
      }
      return;
    }

    // Find the organization that matches the current URL slug
    const match = organizations.find((o) => o.slug === tenantSlug);

    // If we found a matching organization, and it's different from the active one, update state
    if (match && activeOrganization?.id !== match.id) {
      setActiveOrganization(match);
    }
  }, [
    tenantSlug,
    organizations,
    activeOrganization,
    isMultiOrg,
    loading,
    setActiveOrganization,
  ]);

  return null;
}

