## Why

O arquivo `tenant-login-page-client.tsx` contém 13 chamadas `console.log('[DEBUG]...')` que foram deixadas após depuração do fluxo de login. Esses logs expõem detalhes internos do fluxo de autenticação no console do navegador em produção (ex: status de sessão, roles, URLs de redirecionamento), o que é um problema de higiene de código e potencial vazamento de informação.

## What Changes

- Remover todas as chamadas `console.log('[DEBUG]...')` do `handleSubmit` em `tenant-login-page-client.tsx`
- Manter o `console.error` existente na linha 298 (tratamento legítimo de erro no catch)
- Nenhuma alteração de lógica — apenas remoção de artefatos de depuração

## Capabilities

### New Capabilities
- `clean-login-logging`: Garantir que o fluxo de login não emita logs de debug em produção

### Modified Capabilities
<!-- Nenhuma capability existente é modificada -->

## Impact

- `app/[tenant]/auth/components/tenant-login-page-client.tsx`: Remoção de 13 linhas de `console.log`
- Sem impacto em APIs, dependências ou outros sistemas
- Sem breaking changes
