## ADDED Requirements

### Requirement: O fluxo de login não emite logs de debug

O componente `tenant-login-page-client.tsx` NÃO DEVE conter chamadas `console.log` com prefixo `[DEBUG]` no método `handleSubmit`. Logs de debug são artefatos de desenvolvimento que expõem detalhes internos do fluxo de autenticação (credenciais parciais, status de sessão, roles, URLs de redirecionamento) no console do navegador.

#### Scenario: Submissão de login sem logs de debug no console

- **WHEN** o usuário submete o formulário de login (método `handleSubmit`)
- **THEN** nenhuma mensagem com prefixo `[DEBUG]` é emitida no `console.log`

#### Scenario: Tratamento de erro mantém log legítimo

- **WHEN** ocorre um erro inesperado durante o fluxo de login (bloco `catch`)
- **THEN** o sistema DEVE registrar o erro via `console.error` para fins de diagnóstico
- **AND** o `console.error` NÃO DEVE usar o prefixo `[DEBUG]`

#### Scenario: Lógica de autenticação permanece inalterada

- **WHEN** o usuário submete credenciais válidas
- **THEN** o fluxo de autenticação (signIn, validação de tenant, identificação de role, redirecionamento) DEVE funcionar exatamente como antes da remoção dos logs
