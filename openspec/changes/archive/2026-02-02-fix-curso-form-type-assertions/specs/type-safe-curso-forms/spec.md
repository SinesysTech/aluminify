## ADDED Requirements

### Requirement: Formulários de curso usam zodResolver sem type assertions
O `cursoSchema` SHALL produzir tipos de entrada e saída compatíveis, de modo que `zodResolver(cursoSchema)` possa ser passado diretamente ao `useForm<CursoFormValues>` sem necessidade de `as any` ou qualquer outro type assertion.

#### Scenario: createForm usa zodResolver sem cast
- **WHEN** o `createForm` é inicializado com `useForm<CursoFormValues>({ resolver: zodResolver(cursoSchema) })`
- **THEN** o TypeScript compila sem erros e sem comentários `eslint-disable`

#### Scenario: editForm usa zodResolver sem cast
- **WHEN** o `editForm` é inicializado com `useForm<CursoFormValues>({ resolver: zodResolver(cursoSchema) })`
- **THEN** o TypeScript compila sem erros e sem comentários `eslint-disable`

#### Scenario: Coerção numérica preservada nos campos year e accessMonths
- **WHEN** o formulário é submetido com valores para `year` e `accessMonths`
- **THEN** os valores são validados como números válidos pelo schema Zod, mantendo as constraints existentes (year: min 2020, max 2100)

### Requirement: Nenhum type assertion `as any` no módulo curso-table
O arquivo `curso-table.tsx` SHALL NOT conter `as any` em resolvers de formulário nem comentários `eslint-disable-next-line @typescript-eslint/no-explicit-any` associados a esses resolvers.

#### Scenario: Arquivo passa lint sem disable comments para resolvers
- **WHEN** o ESLint roda sobre `curso-table.tsx`
- **THEN** não há comentários `eslint-disable-next-line @typescript-eslint/no-explicit-any` nas linhas de `resolver:`

#### Scenario: Typecheck passa sem erros
- **WHEN** `npm run typecheck` é executado
- **THEN** o arquivo `curso-table.tsx` não apresenta erros de tipo
