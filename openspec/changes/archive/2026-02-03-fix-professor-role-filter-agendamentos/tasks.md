## 1. Fix Role Filter

- [ ] 1.1 In `professor-selection-actions.ts`, change `.eq("papeis.tipo", "professor")` to `.in("papeis.tipo", ["professor", "professor_admin", "monitor"])` on line 63

## 2. Verification

- [ ] 2.1 Run `npm run typecheck` to confirm no type errors
- [ ] 2.2 Run `npm run lint` to confirm no lint issues
- [ ] 2.3 Run `npm run test` to confirm existing tests pass
