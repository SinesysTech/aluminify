# Configuração de Variáveis de Ambiente

<cite>
**Arquivos Referenciados neste Documento**  
- [README.md](file://README.md)
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md)
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md)
- [docs/DEPLOY.md](file://docs/DEPLOY.md)
- [backend/services/chat/chat.service.ts](file://backend/services/chat/chat.service.ts)
- [lib/client.ts](file://lib/client.ts)
- [lib/server.ts](file://lib/server.ts)
- [lib/middleware.ts](file://lib/middleware.ts)
- [backend/clients/database-auth.ts](file://backend/clients/database-auth.ts)
- [app/api/chat/route.ts](file://app/api/chat/route.ts)
- [backend/services/cache/cache.service.ts](file://backend/services/cache/cache.service.ts)
- [backend/services/cache/response-store.ts](file://backend/services/cache/response-store.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Variáveis Públicas vs. Privadas](#variáveis-públicas-vs-privadas)
3. [Variáveis do Supabase](#variáveis-do-supabase)
4. [Configuração do Upstash Redis](#configuração-do-upstash-redis)
5. [Integração com N8N](#integração-com-n8n)
6. [Exemplo de Arquivo .env.local](#exemplo-de-arquivo-envlocal)
7. [Configuração na Vercel](#configuração-na-vercel)
8. [Boas Práticas de Segurança](#boas-práticas-de-segurança)
9. [Troubleshooting](#troubleshooting)

## Introdução

Este documento detalha a configuração de variáveis de ambiente para o sistema Área do Aluno, com foco nas variáveis essenciais para o funcionamento do Supabase, Upstash Redis e integração com N8N. A correta configuração dessas variáveis é fundamental para garantir o funcionamento seguro e eficiente do sistema, especialmente em ambientes serverless como a Vercel.

**Seção fontes**  
- [README.md](file://README.md#L95-L110)
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L1-L5)

## Variáveis Públicas vs. Privadas

No Next.js, variáveis de ambiente com prefixo `NEXT_PUBLIC_` são expostas ao cliente (navegador), enquanto as demais são acessíveis apenas no servidor. Essa distinção é crucial para a segurança do sistema.

As variáveis públicas são usadas para configurações que precisam ser acessadas pelo código frontend, como a URL do Supabase para autenticação. Já as variáveis privadas armazenam dados sensíveis, como chaves secretas, que nunca devem ser expostas ao cliente.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L9-L22)
- [lib/client.ts](file://lib/client.ts#L5-L6)
- [lib/server.ts](file://lib/server.ts#L12-L13)

## Variáveis do Supabase

### Variáveis Públicas

As variáveis públicas do Supabase são necessárias para a autenticação no cliente:

- **NEXT_PUBLIC_SUPABASE_URL**: URL do projeto Supabase, usada para conectar-se ao banco de dados.
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY**: Chave pública ou anônima do Supabase, usada para operações no cliente.

Essas variáveis são utilizadas nas funções de criação de cliente Supabase nos arquivos `lib/client.ts`, `lib/server.ts` e `lib/middleware.ts`.

### Variáveis Privadas

As variáveis privadas do Supabase são usadas apenas no servidor:

- **SUPABASE_URL**: URL do Supabase para uso no servidor, redundante com a variável pública, mas mantida para clareza.
- **SUPABASE_SECRET_KEY**: Chave secreta do Supabase (service_role key), usada para operações administrativas que contornam as políticas de segurança (RLS).

A `SUPABASE_SECRET_KEY` é extremamente sensível e nunca deve ser exposta ao cliente. Ela é usada no arquivo `backend/clients/database-auth.ts` para criar clientes com privilégios elevados.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L7-L30)
- [backend/clients/database-auth.ts](file://backend/clients/database-auth.ts#L8-L9)
- [lib/client.ts](file://lib/client.ts#L5-L6)

## Configuração do Upstash Redis

O Upstash Redis é usado para cache e armazenamento temporário de respostas do chat, sendo altamente recomendado para produção, especialmente em ambientes serverless.

### Variáveis de Configuração

- **UPSTASH_REDIS_REST_URL**: URL do Redis Upstash.
- **UPSTASH_REDIS_REST_TOKEN**: Token de autenticação do Redis Upstash.

Se essas variáveis não forem configuradas, o sistema usa um fallback em memória, que não funciona em ambientes serverless, pois cada requisição pode rodar em uma instância diferente.

### Implementação

O serviço de cache é implementado em `backend/services/cache/cache.service.ts` e `backend/services/cache/response-store.ts`. O `response-store.ts` gerencia o armazenamento temporário de respostas do chat, usando Redis quando disponível ou um Map em memória como fallback.

**Seção fontes**  
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L1-L10)
- [backend/services/cache/cache.service.ts](file://backend/services/cache/cache.service.ts#L19-L20)
- [backend/services/cache/response-store.ts](file://backend/services/cache/response-store.ts#L32-L33)

## Integração com N8N

Para integrar o chat com IA via N8N, é necessário configurar a URL do webhook.

### Variável de Configuração

- **N8N_WEBHOOK_URL**: URL do webhook do N8N para chat com IA (opcional).

Atualmente, a URL do webhook está hardcoded no arquivo `backend/services/chat/chat.service.ts`, mas recomenda-se mover para variável de ambiente para maior flexibilidade.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L109-L119)
- [backend/services/chat/chat.service.ts](file://backend/services/chat/chat.service.ts#L4)

## Exemplo de Arquivo .env.local

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta

# Upstash Redis (opcional, mas recomendado para produção)
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis

# URL do webhook do N8N para chat com IA (opcional)
N8N_WEBHOOK_URL=https://webhook.sinesys.app/webhook/...
```

O arquivo `.env.local` está no `.gitignore` e nunca deve ser commitado no repositório.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L69-L78)
- [README.md](file://README.md#L97-L109)

## Configuração na Vercel

Na Vercel, configure as variáveis de ambiente em **Settings > Environment Variables**. Você pode configurar diferentes valores para:

- **Production** (produção)
- **Preview** (branches e PRs)
- **Development** (local)

Certifique-se de configurar todas as variáveis necessárias antes do deploy, especialmente a `SUPABASE_SECRET_KEY`, que é sensível e nunca deve ser exposta no cliente.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L82-L91)
- [docs/DEPLOY.md](file://docs/DEPLOY.md#L89-L96)

## Boas Práticas de Segurança

- Nunca exponha a `SUPABASE_SECRET_KEY` no cliente.
- Nunca commite arquivos `.env` ou `.env.local` no repositório.
- Use variáveis de ambiente na Vercel para valores sensíveis.
- Mantenha as credenciais do Upstash Redis em `.env.local`, que já está no `.gitignore`.
- Considere rotacionar tokens periodicamente.

**Seção fontes**  
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L93-L99)
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L158-L163)

## Troubleshooting

### Erro: "Redis connection failed"

**Causa**: Credenciais incorretas ou URL inválida.

**Solução**: Verifique se copiou corretamente as credenciais do Upstash e reinicie o servidor após adicionar as variáveis.

### Mensagens não aparecem no chat

**Causa**: Redis não configurado ou callback não está salvando dados.

**Solução**: Verifique os logs do servidor para confirmar que o Redis está configurado e que o callback do N8N está chamando a URL correta.

### Fallback para Map em memória

Se o Upstash Redis não estiver configurado, o sistema usará um Map em memória, que funciona em desenvolvimento local, mas não em produção serverless.

**Seção fontes**  
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L114-L149)
- [backend/services/cache/response-store.ts](file://backend/services/cache/response-store.ts#L51-L54)