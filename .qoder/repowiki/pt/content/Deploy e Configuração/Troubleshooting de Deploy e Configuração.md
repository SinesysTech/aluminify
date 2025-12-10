# Troubleshooting de Deploy e Configuração

<cite>
**Arquivos Referenciados neste Documento**   
- [README.md](file://README.md)
- [DEPLOY.md](file://docs/DEPLOY.md)
- [ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md)
- [vercel.json](file://vercel.json)
- [database.ts](file://backend/clients/database.ts)
- [cache.service.ts](file://backend/services/cache/cache.service.ts)
- [cache-monitor.service.ts](file://backend/services/cache/cache-monitor.service.ts)
- [index.ts](file://index.ts)
- [first-access-form.tsx](file://components/first-access-form.tsx)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Erros Comuns de Deploy](#erros-comuns-de-deploy)
4. [Problemas de Autenticação JWT](#problemas-de-autenticação-jwt)
5. [Falhas de Conexão com Supabase e Redis](#falhas-de-conexão-com-supabase-e-redis)
6. [Erros de RLS no Banco de Dados](#erros-de-rls-no-banco-de-dados)
7. [Verificação de Logs na Vercel](#verificação-de-logs-na-vercel)
8. [Teste Manual de Rotas de API](#teste-manual-de-rotas-de-api)
9. [Validação de Configurações de CORS no Supabase](#validação-de-configurações-de-cors-no-supabase)
10. [Scripts de Verificação de Saúde do Sistema](#scripts-de-verificação-de-saúde-do-sistema)
11. [Modo de Depuração](#modo-de-depuração)
12. [Soluções para Problemas Específicos](#soluções-para-problemas-específicos)
13. [Conclusão](#conclusão)

## Introdução
Este guia fornece uma abordagem abrangente para o troubleshooting de problemas comuns durante o deploy e configuração do sistema Área do Aluno. O documento aborda desde erros de variáveis de ambiente até problemas complexos de segurança em nível de linha (RLS), passando por falhas de autenticação JWT, conexão com serviços externos como Supabase e Redis, além de fornecer orientações sobre como verificar logs, testar rotas manualmente e validar configurações críticas.

O sistema Área do Aluno é uma aplicação moderna baseada em Next.js, Supabase e Upstash Redis, com arquitetura API-First e foco em segurança e escalabilidade. Este guia foi desenvolvido com base na análise direta do código-fonte, documentação existente e estrutura de configuração do projeto, garantindo precisão técnica e relevância prática para desenvolvedores e administradores.

## Variáveis de Ambiente
As variáveis de ambiente são fundamentais para o funcionamento correto do sistema, especialmente em ambientes de produção como a Vercel. A ausência ou configuração incorreta dessas variáveis é uma das causas mais comuns de falhas durante o deploy.

### Variáveis Obrigatórias
As seguintes variáveis são essenciais para o funcionamento do sistema:

```env
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública/anônima do Supabase (para uso no cliente)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon

# URL do Supabase (para uso no servidor)
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave secreta do Supabase (para operações administrativas)
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta
```

**Nota Importante**: A variável `SUPABASE_SECRET_KEY` é sensível e nunca deve ser exposta no cliente. Variáveis que começam com `NEXT_PUBLIC_` são automaticamente expostas ao navegador.

### Variáveis Opcionais (mas Recomendadas)
Para produção, especialmente em ambientes serverless, as seguintes variáveis são altamente recomendadas:

```env
# URL do Redis Upstash
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io

# Token de autenticação do Redis Upstash
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

**Aviso Crítico**: Se essas variáveis não estiverem configuradas, o sistema usará um fallback em memória, que **não funciona** em ambientes serverless como Vercel, pois cada requisição pode ser executada em uma instância diferente.

### Configuração Local
Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto com todas as variáveis necessárias. Este arquivo está no `.gitignore` e nunca deve ser commitado.

### Configuração na Vercel
Na Vercel, configure as variáveis de ambiente em **Settings > Environment Variables**, podendo definir valores diferentes para os ambientes:
- **Production** (produção)
- **Preview** (branches e PRs)
- **Development** (local)

**Seção fontes**
- [README.md](file://README.md#L95-L110)
- [ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L1-L91)
- [DEPLOY.md](file://docs/DEPLOY.md#L32-L49)

## Erros Comuns de Deploy
Durante o processo de deploy na Vercel, vários erros podem ocorrer. Esta seção detalha os mais comuns e suas soluções.

### Erro: "Environment variables not found"
Este erro ocorre quando o sistema não consegue encontrar as variáveis de ambiente necessárias.

**Diagnóstico**:
- Verifique se todas as variáveis de ambiente foram configuradas na Vercel
- Confirme que os nomes das variáveis estão corretos (sensíveis a maiúsculas/minúsculas)
- Valide se a variável `SUPABASE_SECRET_KEY` está configurada, pois é crítica para operações administrativas

**Solução**:
1. Acesse **Settings > Environment Variables** na Vercel
2. Adicione todas as variáveis obrigatórias e recomendadas
3. Certifique-se de que `SUPABASE_SECRET_KEY` está presente e correta
4. Redeploy o projeto

### Erro: "Build failed"
Falhas no build são geralmente causadas por problemas de dependência ou configuração.

**Diagnóstico**:
- Verifique os logs de build na Vercel
- Confirme se todas as dependências estão no `package.json`
- Verifique se há erros de TypeScript ou lint
- Valide se o comando de build (`npm run build`) funciona localmente

**Solução**:
1. Execute `npm run build` localmente para reproduzir o erro
2. Corrija quaisquer erros de compilação ou lint
3. Atualize as dependências se necessário
4. Commit as alterações e redeploy

### Configurações de Build na Vercel
A Vercel detecta automaticamente:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Se necessário, ajuste essas configurações em **Settings > General**.

**Seção fontes**
- [DEPLOY.md](file://docs/DEPLOY.md#L124-L134)
- [vercel.json](file://vercel.json#L1-L8)
- [README.md](file://README.md#L211-L221)

## Problemas de Autenticação JWT
A autenticação JWT é um componente crítico do sistema, usado para proteger rotas e validar identidade de usuários.

### Erros Comuns
- **Token inválido ou expirado**: O token JWT fornecido não é válido ou já expirou
- **Auth session missing**: A sessão de autenticação não foi encontrada
- **Erro na validação de autenticação**: Problema interno ao validar o token

### Diagnóstico
O sistema valida manualmente o JWT do usuário, pois o `verify_jwt` está desabilitado com as novas chaves publishable/secret. O processo envolve:

1. Obter o token do header `Authorization`
2. Criar cliente Supabase com ANON_KEY e contexto de autenticação
3. Chamar `supabase.auth.getUser()` para validar o token
4. Extrair o `userId` do usuário autenticado

### Solução
1. Verifique se o header `Authorization` está presente e formatado corretamente (`Bearer <token>`)
2. Confirme se as variáveis `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
3. Valide se o token JWT é válido e não expirou
4. Consulte os logs para mensagens detalhadas de erro

**Seção fontes**
- [index.ts](file://index.ts#L92-L182)
- [auth.spec.ts](file://backend/swagger/auth.spec.ts#L55-L259)

## Falhas de Conexão com Supabase e Redis
Problemas de conexão com bancos de dados e serviços de cache são críticos e podem paralisar o sistema.

### Conexão com Supabase
O cliente de banco de dados é criado com credenciais do ambiente:

```typescript
function getDatabaseCredentials() {
  const DATABASE_URL = process.env.SUPABASE_URL;
  const DATABASE_KEY =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!DATABASE_URL || !DATABASE_KEY) {
    throw new Error('Database credentials are not configured.');
  }
  return { DATABASE_URL, DATABASE_KEY };
}
```

**Diagnóstico de Falha**:
- Variáveis `SUPABASE_URL` ou `SUPABASE_SECRET_KEY` não configuradas
- Chaves incorretas ou expiradas
- Problemas de rede ou firewall

**Solução**:
1. Verifique se `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estão configuradas na Vercel
2. Confirme os valores no Supabase Dashboard > Settings > API
3. Teste a conexão localmente antes do deploy

### Conexão com Redis (Upstash)
O serviço de cache tenta se conectar ao Redis Upstash:

```typescript
private initialize() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      this.redis = new Redis({ url: redisUrl, token: redisToken });
      this.enabled = true;
    } catch (error) {
      console.error('[Cache Service] ❌ Erro ao configurar Redis:', error);
      this.enabled = false;
    }
  } else {
    console.warn('[Cache Service] ⚠️ Redis não configurado - cache desabilitado');
    this.enabled = false;
  }
}
```

**Diagnóstico de Falha**:
- Variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` não configuradas
- Token inválido ou expirado
- Problemas de rede

**Solução**:
1. Configure as variáveis de ambiente na Vercel
2. Verifique os valores no Upstash Console
3. Confirme se o Redis está habilitado e funcionando

**Seção fontes**
- [database.ts](file://backend/clients/database.ts#L5-L21)
- [cache.service.ts](file://backend/services/cache/cache.service.ts#L18-L39)

## Erros de RLS no Banco de Dados
O Row Level Security (RLS) do Supabase é essencial para a segurança dos dados, mas pode causar erros comuns.

### Erro de Permissão (42501)
O erro PostgreSQL 42501 ("permission denied") ocorre quando uma operação viola as políticas de RLS.

**Exemplo de Mensagem**:
```
new row violates row-level security policy
```

**Causas Comuns**:
- Usuário tentando acessar dados que não pertencem a ele
- Políticas de RLS mal configuradas
- Falta de permissão para inserir/atualizar registros

### Diagnóstico
O sistema já trata esse erro especificamente em alguns componentes:

```typescript
if (errorCode === '42501' || message?.toLowerCase().includes('permission denied') || 
    message?.toLowerCase().includes('permission') || message?.toLowerCase().includes('policy') || 
    message?.toLowerCase().includes('rls')) {
  return 'Você não tem permissão para atualizar esta informação. Entre em contato com o suporte.'
}
```

### Solução
1. Verifique as políticas de RLS no Supabase Dashboard
2. Confirme se o usuário tem permissão para a operação
3. Valide se o `created_by` está sendo definido corretamente
4. Teste as políticas com o usuário correto

**Seção fontes**
- [first-access-form.tsx](file://components/first-access-form.tsx#L60-L63)
- [MELHORIAS_TRATAMENTO_ERROS_SALA_ESTUDOS.md](file://docs/MELHORIAS_TRATAMENTO_ERROS_SALA_ESTUDOS.md#L110-L113)

## Verificação de Logs na Vercel
Os logs são essenciais para diagnosticar problemas em produção.

### Acesso aos Logs
1. Acesse o projeto na Vercel
2. Vá para a aba **Logs** ou **Deploy**
3. Selecione o deploy específico
4. Visualize os logs de build e runtime

### Mensagens de Log Importantes
O sistema gera logs detalhados para debugging:

- `[Cache Service] ✅ Redis configurado - cache habilitado`
- `[Cache Service] ❌ Erro ao configurar Redis:`
- `[Cache Service] ⚠️ Redis não configurado - cache desabilitado`
- `=== ERRO NA VALIDAÇÃO DE AUTENTICAÇÃO ===`
- `=== ERRO AO FAZER PARSE DO BODY ===`

### Estratégia de Logging
O sistema utiliza console.log para:
- Monitorar status de conexão com Redis
- Diagnosticar erros de autenticação
- Validar fluxo de requisições
- Registrar operações de cache (hit/miss)

**Seção fontes**
- [cache.service.ts](file://backend/services/cache/cache.service.ts#L29-L38)
- [index.ts](file://index.ts#L164-L168)

## Teste Manual de Rotas de API
Testar rotas manualmente é crucial para validar o funcionamento do sistema.

### Autenticação
Teste o login com curl:

```bash
curl -X POST https://seu-projeto.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha"}'
```

### Obter Usuário Atual
```bash
curl -X GET https://seu-projeto.vercel.app/api/auth/me \
  -H "Authorization: Bearer seu-token-jwt"
```

### Testar Conexão com Supabase
```bash
curl -X POST https://seu-projeto.vercel.app/api/test-connection \
  -H "Authorization: Bearer seu-token-jwt"
```

### Verificar Status do Cache
```bash
curl -X GET https://seu-projeto.vercel.app/api/cache/stats \
  -H "Authorization: Bearer seu-token-jwt"
```

**Seção fontes**
- [README.md](file://README.md#L225-L258)
- [auth.spec.ts](file://backend/swagger/auth.spec.ts#L80-L258)

## Validação de Configurações de CORS no Supabase
O CORS (Cross-Origin Resource Sharing) deve estar configurado corretamente.

### Configuração Recomendada
No Supabase Dashboard > Settings > API:

1. **Allowed Origins**: Adicione todos os domínios permitidos
   - `http://localhost:3000`
   - `https://seu-dominio.vercel.app`
   - `https://www.seu-dominio.com`

2. **Allowed Headers**: Garanta que inclui
   - `authorization`
   - `x-client-info`
   - `apikey`
   - `content-type`

3. **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`

### Validação
Teste uma requisição OPTIONS para verificar o CORS:

```bash
curl -X OPTIONS https://seu-projeto.vercel.app/api/auth/me \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

A resposta deve incluir:
- `Access-Control-Allow-Origin: *` ou seu domínio
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

**Seção fontes**
- [index.ts](file://index.ts#L45-L55)
- [DEPLOY.md](file://docs/DEPLOY.md#L156-L157)

## Scripts de Verificação de Saúde do Sistema
Scripts de health check são essenciais para monitorar a saúde do sistema.

### Health Check Básico
Crie um endpoint `/api/health` que verifica:

```typescript
// Exemplo de implementação
export async function GET() {
  try {
    // Testar conexão com Supabase
    const { data, error } = await supabase.from('test').select('id').limit(1);
    if (error) throw error;

    // Testar cache (se configurado)
    if (cacheService.isEnabled()) {
      await cacheService.set('health-check', 'ok', 10);
      const value = await cacheService.get('health-check');
      if (value !== 'ok') throw new Error('Cache read failed');
    }

    return Response.json({ status: 'healthy', cache: cacheService.isEnabled() });
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 });
  }
}
```

### Monitoramento de Cache
O sistema inclui um serviço de monitoramento de cache:

```typescript
// cache-monitor.service.ts
getStats(): CacheStats & { hitRate: number; totalOperations: number }
```

Este serviço fornece:
- Hits e misses
- Taxa de acerto (hit rate)
- Operações totais
- Erros

**Seção fontes**
- [cache-monitor.service.ts](file://backend/services/cache/cache-monitor.service.ts#L1-L113)
- [cache.service.ts](file://backend/services/cache/cache.service.ts#L1-L165)

## Modo de Depuração
O sistema possui recursos de depuração integrados.

### Logs Detalhados
O sistema gera logs extensivos para diagnóstico:

- `=== INÍCIO DA REQUISIÇÃO ===`
- `Iniciando validação do JWT...`
- `Chamando supabase.auth.getUser()...`
- `Resposta do getUser():`
- `Fazendo parse do body...`

### Variáveis de Ambiente para Depuração
Adicione variáveis para habilitar logs detalhados:

```env
# Habilitar logs detalhados
DEBUG=true
LOG_LEVEL=debug
```

### Erros com Detalhes
O sistema captura e loga erros com informações completas:

```typescript
console.error("=== ERRO NA VALIDAÇÃO DE AUTENTICAÇÃO ===");
console.error("Tipo:", authErr?.constructor?.name);
console.error("Mensagem:", authErr?.message);
console.error("Stack:", authErr?.stack);
console.error("Erro completo:", JSON.stringify(authErr, Object.getOwnPropertyNames(authErr)));
```

**Seção fontes**
- [index.ts](file://index.ts#L164-L168)
- [cache.service.ts](file://backend/services/cache/cache.service.ts#L69-L75)

## Soluções para Problemas Específicos

### Fallback Incorreto do Redis em Serverless
**Problema**: O fallback em memória não funciona em ambientes serverless como Vercel.

**Causa**: Em serverless, cada requisição pode ser executada em uma instância diferente, tornando o cache em memória ineficaz.

**Solução**:
1. Configure obrigatoriamente o Redis Upstash em produção
2. Use `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
3. Valide a conexão durante o startup
4. Implemente fallback gracioso apenas para desenvolvimento

### Erros de Migração de Banco de Dados
**Problema**: Falhas ao aplicar migrações no Supabase.

**Diagnóstico**:
- Migrações no diretório `supabase/migrations/`
- Scripts SQL com dependências de ordem
- Conflitos de schema

**Solução**:
1. Execute migrações localmente primeiro: `supabase db push`
2. Valide o status com `supabase db status`
3. Corrija scripts com erros de sintaxe
4. Aplique em produção com `supabase db push --db-url <production-url>`

### Problemas de RLS em Operações de Escrita
**Problema**: Erros 42501 ao inserir ou atualizar registros.

**Solução**:
1. Verifique se o `created_by` está sendo definido
2. Confirme se o usuário tem permissão na política RLS
3. Teste com usuário correto
4. Use cliente com service role para operações administrativas

**Seção fontes**
- [ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L45-L47)
- [IMPLEMENTACAO_CACHE_COMPLETA.md](file://docs/IMPLEMENTACAO_CACHE_COMPLETA.md#L150-L153)
- [database.ts](file://backend/clients/database.ts#L129)

## Conclusão
Este guia de troubleshooting fornece uma abordagem abrangente para resolver os problemas mais comuns durante o deploy e configuração do Área do Aluno. A partir da análise do código-fonte e documentação, identificamos que os principais pontos de falha estão relacionados a:

1. **Variáveis de ambiente**: A configuração incorreta ou ausência de variáveis críticas como `SUPABASE_SECRET_KEY` e `UPSTASH_REDIS_REST_URL` é a causa mais comum de falhas.

2. **Autenticação JWT**: O sistema requer validação manual do token devido às novas chaves publishable/secret, exigindo atenção especial aos headers e credenciais.

3. **Cache em serverless**: O fallback em memória não é viável em ambientes serverless, tornando o Redis Upstash essencial para produção.

4. **Segurança RLS**: As políticas de Row Level Security são fundamentais mas podem causar erros de permissão se não configuradas corretamente.

Recomendamos seguir rigorosamente o checklist de deploy, garantir que todas as variáveis de ambiente estejam configuradas, e utilizar os scripts de health check para monitorar continuamente a saúde do sistema. O sistema foi projetado com fallbacks e logs detalhados para facilitar o diagnóstico, mas a prevenção através de configuração correta é a melhor estratégia.