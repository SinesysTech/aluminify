## Why

O componente `curso-table.tsx` utiliza `as any` em dois resolvers de formulário (`createForm` e `editForm`) para contornar incompatibilidade de tipos entre o Zod schema e o React Hook Form. Isso suprime erros de tipo legítimos e reduz a segurança do TypeScript no módulo de cursos, além de exigir comentários `eslint-disable` que poluem o código.

## What Changes

- Corrigir a tipagem do `zodResolver(cursoSchema)` nos dois formulários (`createForm` e `editForm`)
- Remover as anotações `as any` e os comentários `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Alinhar o schema Zod (`cursoSchema`) com o tipo `CursoFormValues` para que o resolver resolva sem cast forçado

## Capabilities

### New Capabilities
- `type-safe-curso-forms`: Garantir tipagem correta nos formulários de criação e edição de cursos

### Modified Capabilities
<!-- Nenhuma capability existente é modificada -->

## Impact

- `app/[tenant]/(modules)/curso/components/curso-table.tsx`: Remoção de 2x `as any` + 2x `eslint-disable`
- Pode exigir ajuste no `cursoSchema` ou em `CursoFormValues` se houver mismatch de tipos
- Sem breaking changes — comportamento em runtime permanece idêntico
