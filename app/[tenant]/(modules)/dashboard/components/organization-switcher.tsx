"use client";

import * as React from "react";
import Image from "next/image";
import { Building2, Check, ChevronDown, Layers } from "lucide-react";
import { cn } from "@/app/shared/library/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useStudentOrganizations,
  type StudentOrganization,
} from "@/components/providers/student-organizations-provider";

interface OrganizationSwitcherProps {
  /** Additional CSS classes */
  className?: string;
  /** Variant for the trigger button */
  variant?: "default" | "compact" | "minimal";
  /** Alignment of the dropdown */
  align?: "start" | "center" | "end";
}

/**
 * Organization Switcher component for multi-org students.
 *
 * Allows students enrolled in multiple organizations to:
 * - View all their organizations
 * - Select a specific organization to filter content
 * - Select "All Organizations" to see everything
 *
 * This component is only rendered if the student is enrolled in multiple organizations.
 */
export function OrganizationSwitcher({
  className,
  variant = "default",
  align = "start",
}: OrganizationSwitcherProps) {
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isMultiOrg,
    loading,
  } = useStudentOrganizations();

  // Don't render if not multi-org
  if (!isMultiOrg || loading) {
    return null;
  }

  const totalCourses = organizations.reduce(
    (sum, org) => sum + org.courseCount,
    0
  );

  const handleSelectOrg = (org: StudentOrganization | null) => {
    setActiveOrganization(org);
  };

  const triggerContent = () => {
    if (variant === "minimal") {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
          aria-label="Trocar organização"
        >
          <Building2 className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      );
    }

    if (variant === "compact") {
      return (
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 max-w-[200px]", className)}
        >
          {activeOrganization ? (
            <>
              {activeOrganization.logoUrl ? (
                <Image
                  src={activeOrganization.logoUrl}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded object-contain"
                />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <span className="truncate">{activeOrganization.nome}</span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              <span>Todas</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50 ml-auto" />
        </Button>
      );
    }

    // Default variant
    return (
      <Button
        variant="outline"
        role="combobox"
        className={cn(
          "justify-between gap-2 min-w-[200px] max-w-[300px]",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeOrganization ? (
            <>
              {activeOrganization.logoUrl ? (
                <Image
                  src={activeOrganization.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded object-contain shrink-0"
                />
              ) : (
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{activeOrganization.nome}</span>
              <Badge variant="secondary" className="ml-1 shrink-0">
                {activeOrganization.courseCount}
              </Badge>
            </>
          ) : (
            <>
              <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span>Todas as Organizações</span>
              <Badge variant="secondary" className="ml-1 shrink-0">
                {totalCourses}
              </Badge>
            </>
          )}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerContent()}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Suas Organizações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* All Organizations option */}
        <DropdownMenuItem
          onClick={() => handleSelectOrg(null)}
          className="flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>Todas as Organizações</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalCourses} cursos
            </Badge>
            {activeOrganization === null && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Individual organizations */}
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              {org.logoUrl ? (
                <Image
                  src={org.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded object-contain shrink-0"
                />
              ) : (
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{org.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {org.courseCount}
              </Badge>
              {activeOrganization?.id === org.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Badge component to show organization name on course cards.
 * Used to indicate which organization a course belongs to.
 */
export function OrganizationBadge({
  organization,
  className,
}: {
  organization: { nome: string; logoUrl?: string | null };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {organization.logoUrl ? (
        <Image
          src={organization.logoUrl}
          alt=""
          width={12}
          height={12}
          className="rounded object-contain"
        />
      ) : (
        <Building2 className="h-3 w-3" />
      )}
      <span className="truncate max-w-[120px]">{organization.nome}</span>
    </div>
  );
}
