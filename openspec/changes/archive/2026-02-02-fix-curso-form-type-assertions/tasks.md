## 1. Corrigir schema Zod

- [x] 1.1 Substituir `z.coerce.number()` no campo `year` por alternativa que alinhe input/output types (e.g., `z.preprocess(val => Number(val), z.number().min(2020).max(2100))`)
- [x] 1.2 Substituir `z.coerce.number()` no campo `accessMonths` por alternativa equivalente que alinhe input/output types

## 2. Remover type assertions

- [x] 2.1 Remover `as any` e o comentário `eslint-disable-next-line` do `createForm` resolver (linha ~179)
- [x] 2.2 Remover `as any` e o comentário `eslint-disable-next-line` do `editForm` resolver (linha ~201)

## 3. Validação

- [x] 3.1 Executar `npm run typecheck` e confirmar que `curso-table.tsx` compila sem erros
- [x] 3.2 Executar `npm run lint` e confirmar que não há warnings/errors relacionados no arquivo
