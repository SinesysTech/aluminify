
# Tasks

- [ ] Create directory structure 'app/[tenant]/(modules)/aluno/{components,hooks,lib,services,types}'
- [ ] Move 'components/aluno/*' to 'app/[tenant]/(modules)/aluno/components/'
- [ ] Move 'components/dashboard/*' (Student specific) to 'app/[tenant]/(modules)/aluno/components/dashboard/'
- [ ] Move 'types/dashboard.ts' to 'app/[tenant]/(modules)/aluno/types/dashboard.ts'
- [ ] Move 'lib/services/dashboardService.ts' to 'app/[tenant]/(modules)/aluno/services/dashboard.service.ts'
- [ ] Move 'app/(modules)/aluno/*' content to 'app/[tenant]/(modules)/aluno/'
- [ ] Update imports in new 'aluno' module to point to local components/services
- [ ] Create 'app/[tenant]/(modules)/aluno/layout.tsx' (adapt from legacy or create new)
- [ ] Delete legacy 'app/(modules)/aluno' directory
- [ ] Delete legacy 'components/aluno' directory
- [ ] Delete legacy 'components/dashboard' files (that were moved)
- [ ] Verify build and lint

