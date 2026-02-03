## Context

O componente `tenant-login-page-client.tsx` contém 13 chamadas `console.log('[DEBUG]...')` inseridas durante o desenvolvimento do fluxo de login com autenticação Supabase + validação de tenant + identificação de role. Esses logs cobrem todo o ciclo do `handleSubmit`: início, validação de campos, criação de cliente Supabase, resultado de signIn, validação de tenant, identificação de role e redirecionamento final. Há também um `console.error('[DEBUG]...')` no bloco catch (linha 298) que mistura debug com tratamento legítimo de erro.

## Goals / Non-Goals

**Goals:**
- Remover todas as chamadas `console.log('[DEBUG]...')` do método `handleSubmit`
- Preservar o tratamento de erro no bloco catch, convertendo o `console.error('[DEBUG]...')` para `console.error(...)` sem o prefixo de debug
- Zero alteração na lógica de autenticação

**Non-Goals:**
- Introduzir um sistema de logging estruturado (ex: logger service, log levels)
- Adicionar logging em outros componentes de auth
- Modificar o fluxo de autenticação ou tratamento de erros

## Decisions

### Decisão 1: Remoção pura, sem substituição por logger

**Abordagem:** Deletar as linhas de `console.log('[DEBUG]...')` sem substituí-las por outro mecanismo de logging.

**Alternativas consideradas:**
- Substituir por um logger com níveis (debug/info/warn/error) — descartado porque adiciona complexidade desnecessária para um componente client-side. Se logging estruturado for necessário no futuro, será uma change separada.
- Condicionar os logs a `process.env.NODE_ENV === 'development'` — descartado porque poluiria o código com condicionais para logs temporários.

**Rationale:** Os logs são artefatos de debug temporários, não telemetria operacional. A remoção pura é a abordagem mais simples e alinhada com o princípio YAGNI.

### Decisão 2: Manter `console.error` no catch, sem prefixo `[DEBUG]`

**Abordagem:** A linha 298 (`console.error('[DEBUG] Erro inesperado no login:', error)`) será convertida para `console.error('Erro inesperado no login:', error)` — removendo apenas o prefixo `[DEBUG]`.

**Rationale:** O `console.error` no bloco catch é tratamento legítimo de erro (não debug), mas o prefixo `[DEBUG]` o descaracteriza. Remover o prefixo preserva a utilidade diagnóstica sem expor que era um log de debug.

## Risks / Trade-offs

- **Perda de visibilidade em debug futuro** → Mitigação: os logs podem ser re-adicionados pontualmente quando necessário, ou um sistema de logging pode ser introduzido como change separada.
- **Risco de remoção acidental de lógica** → Mitigação: as linhas de `console.log` são statements independentes (não fazem parte de condicionais ou retornos). Remoção é segura.
