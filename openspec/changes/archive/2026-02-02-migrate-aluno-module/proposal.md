
# Migrate Aluno Module

## Status
Proposed

## Goal
Migrate the 'aluno' module specific code to a self-contained structure within 'app/[tenant]/(modules)/aluno'.

## Scope
- Move 'app/(modules)/aluno' contents (dashboard, cronograma, etc.) to 'app/[tenant]/(modules)/aluno'.
- Move 'components/aluno/*' to 'app/[tenant]/(modules)/aluno/components/'.
- Move 'components/dashboard/*' (student specific) to 'app/[tenant]/(modules)/aluno/components/dashboard/'.
- Move 'lib/services/dashboardService.ts' to 'app/[tenant]/(modules)/aluno/services/dashboard.service.ts'.
- Move 'types/dashboard.ts' to 'app/[tenant]/(modules)/aluno/types/dashboard.ts'.
- Update all imports to use relative paths where possible or specific absolute paths.
- Remove legacy directories.

## Design
- strict encapsulation: 'aluno' features should not rely on 'admin' components unless they are in 'components/ui' or 'components/shared'.
- no legacy support: straight move and refactor.

