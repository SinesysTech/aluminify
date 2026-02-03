## Why

Students cannot see professors who have configured availability in the scheduling module. The `getProfessoresDisponiveis` function filters professors using `.eq("papeis.tipo", "professor")`, which excludes users with `professor_admin` and `monitor` roles. In production, 100% of professors who configured availability have the `professor_admin` role, making the scheduling feature completely non-functional for students.

## What Changes

- Fix the professor role filter in `getProfessoresDisponiveis` to include all teaching roles (`professor`, `professor_admin`, `monitor`), matching the correct pattern already used in `getTeachersForAdminSelector`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `scheduling`: The "Professor Selection" requirement needs to explicitly state that all teaching role types must be included when listing professors for students

## Impact

- **Code**: `app/[tenant]/(modules)/agendamentos/lib/professor-selection-actions.ts` line 63 — single filter change
- **Users affected**: All students in empresas where professors have `professor_admin` or `monitor` roles (confirmed: CDF with 41 students, Jana Rabelo with 379 students)
- **Risk**: Minimal — aligns student-facing query with the admin-facing query that already works correctly
