# Configuração do Ambiente de Desenvolvimento

<cite>
**Arquivos Referenciados neste Documento**   
- [README.md](file://README.md)
- [.env.local](file://.env.local)
- [package.json](file://package.json)
- [supabase/config.toml](file://supabase/config.toml)
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md)
- [docs/GUIA_INSTALACAO_SUPABASE_CLI.md](file://docs/GUIA_INSTALACAO_SUPABASE_CLI.md)
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md)
- [docs/N8N_SETUP.md](file://docs/N8N_SETUP.md)
- [supabase/migrations](file://supabase/migrations)
- [scripts/apply-rls-policies.js](file://scripts/apply-rls-policies.js)
</cite>

## Sumário
1. [Pré-requisitos](#pré-requisitos)
2. [Clonagem e Instalação](#clonagem-e-instalação)
3. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
4. [Configuração do Supabase Local](#configuração-do-supabase-local)
5. [Configuração do Cache com Upstash Redis](#configuração-do-cache-com-upstash-redis)
6. [Conexão com a API do N8N](#conexão-com-a-api-do-n8n)
7. [Comandos de Execução](#comandos-de-execução)
8. [Solução de Problemas Comuns](#solução-de-problemas-comuns)
9. [Verificação do Ambiente](#verificação-do-ambiente)

## Pré-requisitos

Antes de configurar o ambiente de desenvolvimento para o projeto Área do Aluno, é necessário instalar as seguintes ferramentas:

- **Node.js 18+**: Utilizado como runtime para a aplicação. A versão recomendada é a 18 ou superior.
- **pnpm**: Gerenciador de pacotes para Node.js. Pode ser instalado via npm com o comando `npm install -g pnpm`.
- **Supabase CLI**: Ferramenta de linha de comando para gerenciar projetos Supabase localmente. Deve ser instalado globalmente via npm com `npm install -g supabase`.
- **Docker**: Plataforma de containers necessária para executar os serviços do Supabase localmente. O Docker Desktop é recomendado para Windows e macOS.
- **Upstash Redis**: Serviço de cache distribuído opcional, mas altamente recomendado para ambientes serverless. Utilizado para armazenamento temporário de respostas do chat.

**Fontes da seção**
- [README.md](file://README.md#L87-L90)
- [docs/GUIA_INSTALACAO_SUPABASE_CLI.md](file://docs/GUIA_INSTALACAO_SUPABASE_CLI.md#L1-L11)
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L1-L4)

## Clonagem e Instalação

Para configurar o ambiente de desenvolvimento, siga os passos abaixo:

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/areadoaluno.git
   cd areadoaluno
   ```

2. **Instale as dependências** utilizando pnpm:
   ```bash
   pnpm install
   ```
   Este comando instalará todas as dependências listadas no arquivo `package.json`, incluindo bibliotecas como Next.js, React, Tailwind CSS, Supabase JS Client, e outras essenciais para o funcionamento do projeto.

**Fontes da seção**
- [README.md](file://README.md#L115-L117)
- [package.json](file://package.json#L1-L113)

## Configuração de Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configurar conexões com serviços externos. Siga os passos abaixo para configurar o arquivo `.env.local`:

1. Crie um arquivo chamado `.env.local` na raiz do projeto.
2. Adicione as seguintes variáveis:

```env
# Configuração do Supabase
NEXT_PUBLIC_SUPABASE_URL=seu-projeto-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua-chave-publica-ou-anon
SUPABASE_URL=seu-projeto-url
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta

# Upstash Redis (opcional, mas recomendado para produção)
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-redis
```

As variáveis com prefixo `NEXT_PUBLIC_` são expostas no cliente, enquanto as demais são utilizadas apenas no servidor. Para obter os valores, acesse o painel do Supabase em **Settings > API** e do Upstash em **REST API**.

**Fontes da seção**
- [README.md](file://README.md#L97-L109)
- [docs/ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L1-L78)

## Configuração do Supabase Local

Para inicializar o Supabase localmente e aplicar as migrations:

1. **Inicie os serviços do Supabase**:
   ```bash
   supabase start
   ```
   Este comando inicia o banco de dados PostgreSQL, autenticação, storage e outras funcionalidades do Supabase em containers Docker.

2. **Aplique as migrations**:
   ```bash
   supabase db push
   ```
   Isso aplicará todas as migrations localizadas em `supabase/migrations/` ao banco de dados local, criando tabelas como `alunos`, `cursos`, `matriculas`, entre outras.

3. **Verifique as políticas RLS (Row Level Security)**:
   Algumas políticas de segurança estão definidas nas migrations, como em `20250129_add_alunos_cursos_rls_policies.sql`, que garante que alunos só possam visualizar suas próprias associações com cursos.

**Fontes da seção**
- [supabase/config.toml](file://supabase/config.toml#L1-L15)
- [supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql](file://supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql#L1-L39)
- [docs/GUIA_INSTALACAO_SUPABASE_CLI.md](file://docs/GUIA_INSTALACAO_SUPABASE_CLI.md#L126-L174)

## Configuração do Cache com Upstash Redis

O sistema utiliza Upstash Redis para armazenamento temporário de respostas do chat, especialmente em ambientes serverless. Para configurar:

1. **Crie uma conta no [Upstash Console](https://console.upstash.com/)**.
2. **Crie um banco de dados Redis** com nome como `areadoaluno-chat`.
3. **Obtenha as credenciais** em **REST API**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. **Adicione ao `.env.local`** conforme mostrado na seção anterior.

Ao iniciar o servidor, o sistema verificará a configuração do Redis e exibirá no log:
```
[Response Store] ✅ Upstash Redis configurado - usando Redis para armazenamento
```

**Fontes da seção**
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L1-L178)
- [package.json](file://package.json#L56)
- [README.md](file://README.md#L72-L73)

## Conexão com a API do N8N

O chat com IA é integrado via N8N, utilizando webhooks para processamento de mensagens. A URL do webhook está atualmente hardcoded, mas pode ser configurada via variável de ambiente:

1. **Configure o workflow no N8N**:
   - Adicione um nó **Webhook** com método POST.
   - Configure o **Response Mode** para "Respond to Webhook".
   - O payload esperado é:
     ```json
     {
       "input": "mensagem do usuário",
       "ids": {
         "sessionId": "session-123",
         "userId": "user-456"
       }
     }
     ```
   - A resposta deve estar no formato:
     ```json
     { "output": "Resposta do agente" }
     ```

2. **Teste o webhook manualmente**:
   ```bash
   curl -X POST https://webhook.sinesys.app/webhook/... \
     -H "Content-Type: application/json" \
     -d '{"input": "Olá", "ids": {"sessionId": "test", "userId": "test"}}'
   ```

**Fontes da seção**
- [docs/N8N_SETUP.md](file://docs/N8N_SETUP.md#L1-L114)
- [README.md](file://README.md#L75-L76)

## Comandos de Execução

Utilize os seguintes comandos para desenvolvimento, testes e linting:

- **Iniciar servidor de desenvolvimento**:
  ```bash
  npm run dev
  ```
  A aplicação estará disponível em `http://localhost:3000`.

- **Executar testes**:
  ```bash
  npm run test
  ```
  (Nota: O script de testes pode precisar ser configurado no `package.json`)

- **Executar linting**:
  ```bash
  npm run lint
  ```
  Verifica a qualidade do código com ESLint.

**Fontes da seção**
- [package.json](file://package.json#L5-L10)
- [README.md](file://README.md#L211-L221)

## Solução de Problemas Comuns

### Falhas de Conexão com o Banco
- Verifique se o Docker está em execução.
- Confirme que o `supabase start` foi executado com sucesso.
- Valide as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`.

### Políticas RLS (Row Level Security)
- Se ocorrer erro de permissão, verifique as políticas RLS no Supabase Dashboard.
- Para tabelas como `alunos_cursos`, utilize funções RPC como `get_matriculas_aluno` para evitar conflitos com RLS.

### Erros de Autenticação
- Certifique-se de que o token JWT está sendo enviado corretamente no cabeçalho `Authorization: Bearer <token>`.
- Use `supabase.auth.getSession()` para verificar a sessão antes de requisições sensíveis.

**Fontes da seção**
- [docs/SOLUCAO_ERRO_RLS_MATRICULAS.md](file://docs/SOLUCAO_ERRO_RLS_MATRICULAS.md#L1-L124)
- [scripts/apply-rls-policies.js](file://scripts/apply-rls-policies.js#L1-L120)

## Verificação do Ambiente

Para garantir que o ambiente está funcionando corretamente:

1. **Teste a rota de autenticação**:
   - Acesse `/api/auth/me` com um token válido.
   - Deve retornar os dados do usuário autenticado.

2. **Teste o chat com IA**:
   - Acesse `/tobias` e envie uma mensagem.
   - Verifique os logs para confirmação do callback do N8N.

3. **Verifique o status do Supabase**:
   ```bash
   supabase status
   ```
   Confirme que todos os serviços estão ativos.

**Fontes da seção**
- [README.md](file://README.md#L225-L259)
- [docs/UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L74-L90)