"use client";

import { useEffect, useRef } from "react";
import { useStudentOrganizations } from "@/components/providers/student-organizations-provider";
import { useTenantBranding } from "@/components/providers/tenant-branding-provider";

/**
 * Coordinates branding changes for multi-org students.
 *
 * This component listens to the StudentOrganizationsProvider and
 * updates the TenantBrandingProvider when the active organization changes.
 *
 * - When a specific organization is selected: loads that org's branding
 * - When "All Organizations" is selected (null): resets to default theme
 */
export function StudentBrandingCoordinator() {
  const { activeOrganization, isMultiOrg } = useStudentOrganizations();
  const { loadBrandingForEmpresa } = useTenantBranding();

  // Track the previous active organization to avoid unnecessary updates
  const previousOrgId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Only coordinate branding for multi-org students
    if (!isMultiOrg) {
      return;
    }

    const currentOrgId = activeOrganization?.id ?? null;

    // Skip if the organization hasn't changed
    if (previousOrgId.current === currentOrgId) {
      return;
    }

    previousOrgId.current = currentOrgId;

    // Load branding for the selected organization (or reset to defaults if null)
    loadBrandingForEmpresa(currentOrgId);
  }, [activeOrganization, isMultiOrg, loadBrandingForEmpresa]);

  // This component doesn't render anything - it's purely for coordination
  return null;
}
