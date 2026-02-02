## Context

O componente `curso-table.tsx` utiliza `as any` em dois `useForm` hooks (linhas 179 e 201) para contornar incompatibilidade de tipos entre `zodResolver(cursoSchema)` e `useForm<CursoFormValues>`.

**Versões atuais:** `@hookform/resolvers@5.2.2`, `react-hook-form@7.71.1`, `zod@3.25.76`.

**Causa raiz:** O `cursoSchema` usa `z.coerce.number()` para os campos `year` e `accessMonths`. Com `z.coerce`, o tipo de entrada (`z.input`) difere do tipo de saída (`z.output`) — a entrada aceita `unknown` enquanto a saída é `number`. Como `CursoFormValues = z.infer<typeof cursoSchema>` resolve para o tipo de **saída**, o `zodResolver` retorna um `Resolver` cujo tipo de entrada não coincide com `CursoFormValues`, gerando erro de tipagem.

## Goals / Non-Goals

**Goals:**
- Eliminar os 2 type assertions `as any` nos formulários `createForm` e `editForm`
- Remover os 2 comentários `eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Manter comportamento idêntico em runtime (coerção de strings para números continua funcionando)

**Non-Goals:**
- Refatorar lógica de negócio do componente
- Alterar validações ou mensagens de erro
- Modificar outros componentes do módulo curso

## Decisions

### Decisão 1: Substituir `z.coerce.number()` por `z.number()` com `.or(z.string()).pipe(z.coerce.number())`

**Alternativa considerada:** Usar `z.input<typeof cursoSchema>` como tipo genérico do `useForm` em vez de `z.infer<typeof cursoSchema>`. Rejeitada porque `z.input` com coerce inclui `unknown` no tipo, perdendo autocomplete e type safety nos campos do formulário.

**Alternativa considerada:** Passar generics explícitos ao `zodResolver<CursoFormValues>()`. Rejeitada porque o resolver v5 infere automaticamente e generics forçados também requerem cast.

**Abordagem escolhida:** Ajustar o schema para que `z.input` e `z.output` sejam compatíveis. Substituir `z.coerce.number()` por `z.number()` nos campos `year` e `accessMonths`, adicionando `.transform()` ou `.preprocess()` apenas se necessário. Como os `defaultValues` já fornecem valores numéricos e os inputs do formulário podem ser controlados, `z.number()` direto resolve o mismatch de tipos. Se os inputs enviarem strings, usar `z.preprocess(val => Number(val), z.number())` que mantém input/output types alinhados.

### Decisão 2: Manter `CursoFormValues` como `z.infer<typeof cursoSchema>`

A inferência via `z.infer` continua sendo a abordagem padrão. A correção no schema garante que `z.infer` e `z.input` produzam tipos compatíveis, eliminando o mismatch.

## Risks / Trade-offs

- **Risco: Campos numéricos recebem strings do DOM** → Mitigação: Validar se os inputs usam `valueAsNumber` ou se o `defaultValues` garante tipo numérico. Se necessário, usar `z.preprocess` para converter.
- **Risco: Regressão em validação** → Mitigação: Testar criação e edição de cursos após a mudança. O comportamento de coerção deve ser preservado.
