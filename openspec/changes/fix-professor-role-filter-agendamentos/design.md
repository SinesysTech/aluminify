## Context

The scheduling module's `getProfessoresDisponiveis` function in `professor-selection-actions.ts` queries professors using `.eq("papeis.tipo", "professor")`. The system has three teaching role types defined in `TEACHING_ROLES`: `professor`, `professor_admin`, and `monitor`. The admin-facing function `getTeachersForAdminSelector` in `admin-helpers.ts` already correctly uses `.in("papeis.tipo", ["professor", "professor_admin", "monitor"])`.

In production, both professors who configured availability (Breno Meira at CDF, Felipe Vilanova at Jana Rabelo) have `professor_admin` role, making them invisible to all students.

## Goals / Non-Goals

**Goals:**
- Ensure all teaching roles are included in the student-facing professor listing
- Align the student-facing filter with the existing admin-facing filter

**Non-Goals:**
- Refactoring the role system or TEACHING_ROLES constant
- Changing RLS policies (they already work correctly)
- Modifying the availability creation flow (it works correctly)

## Decisions

**Use inline array instead of importing TEACHING_ROLES constant**

The filter is a PostgREST query parameter (`.in("papeis.tipo", [...])`) that requires a literal string array. While `TEACHING_ROLES` exists as a TypeScript constant, the query runs server-side and the array must be passed directly. Use `["professor", "professor_admin", "monitor"]` to match the existing pattern in `admin-helpers.ts:83`.

Alternative considered: importing and using `TEACHING_ROLES`. This would add a dependency for a single-line fix and the constant is typed as `RoleTipo[]` which may not align with the Supabase filter type. The inline array matches the established pattern.

## Risks / Trade-offs

- **Risk**: If new teaching roles are added in the future, this filter must be updated manually in two places → Acceptable for now; a future refactor could centralize the filter pattern
- **Risk**: None for existing functionality — this is strictly additive (more professors visible, not fewer)
