# Deploy e Configuração

<cite>
**Arquivos Referenciados neste Documento**  
- [README.md](file://README.md)
- [package.json](file://package.json)
- [vercel.json](file://vercel.json)
- [ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md)
- [DEPLOY.md](file://docs/DEPLOY.md)
- [GUIA_INSTALACAO_SUPABASE_CLI.md](file://docs/GUIA_INSTALACAO_SUPABASE_CLI.md)
- [UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md)
- [N8N_SETUP.md](file://docs/N8N_SETUP.md)
- [supabase/config.toml](file://supabase/config.toml)
- [scripts/apply-rls-policies.js](file://scripts/apply-rls-policies.js)
</cite>

## Sumário
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
3. [Instalação e Execução em Desenvolvimento](#instalação-e-execução-em-desenvolvimento)
4. [Build e Deploy na Vercel](#build-e-deploy-na-vercel)
5. [Setup do Supabase CLI e Migrações](#setup-do-supabase-cli-e-migrações)
6. [Aplicação de Políticas RLS](#aplicação-de-políticas-rls)
7. [Deploy em Outros Provedores](#deploy-em-outros-provedores)
8. [Scripts de Verificação de Saúde](#scripts-de-verificação-de-saúde)
9. [Troubleshooting](#troubleshooting)

## Pré-requisitos

Antes de começar a configuração e deploy do sistema Área do Aluno, é necessário garantir que os seguintes pré-requisitos estejam atendidos:

- **Node.js 18+**: O sistema foi desenvolvido com base no Node.js versão 18 ou superior. Certifique-se de que a versão correta está instalada no ambiente.
- **Conta Supabase**: É necessário ter uma conta ativa no Supabase para gerenciar o banco de dados, autenticação e armazenamento.
- **Instância Upstash Redis (opcional, mas recomendada)**: Para ambientes de produção, especialmente em plataformas serverless como Vercel, o uso do Upstash Redis é altamente recomendado para cache e armazenamento temporário.
- **Acesso ao N8N**: O sistema utiliza o N8N para automação de fluxos de chat com IA. É necessário configurar os webhooks correspondentes.

**Seção fontes**
- [README.md](file://README.md#L87-L91)

## Configuração de Variáveis de Ambiente

A configuração correta das variáveis de ambiente é essencial para o funcionamento do sistema. Todas as variáveis devem ser definidas em um arquivo `.env.local` na raiz do projeto.

### Variáveis Obrigatórias

As variáveis a seguir são obrigatórias para o funcionamento do sistema:

```env
# Configuração Supabase
NEXT_PUBLIC_SUPABASE_URL=seu-projeto-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua-chave-publica-ou-anon
SUPABASE_URL=seu-projeto-url
SUPABASE_SECRET_KEY=sb_secret_...  # Recomendado para backend
```

### Variáveis Opcionais (Recomendadas para Produção)

```env
# Upstash Redis (opcional, mas recomendado para produção)
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-redis

# N8N Webhook (opcional)
N8N_WEBHOOK_URL=https://webhook.sinesys.app/webhook/...
```

### Instruções de Configuração

1. Crie um arquivo `.env.local` na raiz do projeto.
2. Preencha com as variáveis conforme indicado acima.
3. As variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente. As demais são usadas apenas no servidor.
4. Nunca comite o arquivo `.env.local` no repositório, pois ele está listado no `.gitignore`.

**Seção fontes**
- [ENV_VARIABLES.md](file://docs/ENV_VARIABLES.md#L1-L138)
- [README.md](file://README.md#L95-L109)

## Instalação e Execução em Desenvolvimento

### Instalação de Dependências

Execute o seguinte comando para instalar todas as dependências do projeto:

```bash
npm install
```

Este comando instala todas as dependências listadas no `package.json`, incluindo bibliotecas como React, Next.js, Supabase, Tailwind CSS, entre outras.

### Execução em Desenvolvimento

Após a instalação, inicie o servidor de desenvolvimento com:

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`. A API e a interface web serão servidas localmente, permitindo testes e desenvolvimento.

**Seção fontes**
- [package.json](file://package.json#L5-L10)
- [README.md](file://README.md#L113-L123)

## Build e Deploy na Vercel

### Build de Produção

Para gerar o build de produção, execute:

```bash
npm run build
```

Este comando gera os arquivos otimizados para produção no diretório `.next`.

### Configuração na Vercel

O projeto está configurado para deploy na Vercel. O arquivo `vercel.json` contém as configurações necessárias:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Passos para Deploy

1. Conecte seu repositório Git à Vercel.
2. Configure as variáveis de ambiente no painel da Vercel (Settings > Environment Variables).
3. Certifique-se de que todas as variáveis obrigatórias e opcionais estejam definidas.
4. Clique em "Deploy" para iniciar o processo.
5. Após o sucesso, a aplicação estará disponível na URL fornecida pela Vercel.

**Seção fontes**
- [vercel.json](file://vercel.json#L1-L9)
- [DEPLOY.md](file://docs/DEPLOY.md#L1-L191)

## Setup do Supabase CLI e Migrações

### Instalação do Supabase CLI

O Supabase CLI pode ser instalado globalmente via npm:

```bash
npm install -g supabase
```

Verifique a instalação com:

```bash
supabase --version
```

### Conexão ao Projeto Remoto

1. Faça login no Supabase:
   ```bash
   supabase login
   ```
2. Conecte ao projeto:
   ```bash
   supabase link --project-ref wtqgfmtucqmpheghcvxo
   ```

### Migrações

As migrações SQL estão localizadas em `supabase/migrations/`. Para aplicar as migrações ao banco de dados remoto:

```bash
supabase db push
```

Para criar uma nova migração:

```bash
supabase migration new nome_da_migracao
```

**Seção fontes**
- [GUIA_INSTALACAO_SUPABASE_CLI.md](file://docs/GUIA_INSTALACAO_SUPABASE_CLI.md#L1-L220)
- [supabase/migrations/](file://supabase/migrations/)

## Aplicação de Políticas RLS

O sistema utiliza Row Level Security (RLS) para controlar o acesso aos dados. As políticas RLS são definidas nas migrações SQL e aplicadas automaticamente.

### Políticas Aplicadas

- **Alunos**: Podem visualizar apenas seus próprios dados.
- **Professores**: Podem gerenciar recursos educacionais.
- **Superadmin**: Acesso total ao sistema.

### Aplicação Manual (Se Necessário)

Se as políticas não forem aplicadas automaticamente, use o script `apply-rls-policies.js`:

```bash
node scripts/apply-rls-policies.js
```

Alternativamente, execute o SQL diretamente no SQL Editor do Supabase.

**Seção fontes**
- [scripts/apply-rls-policies.js](file://scripts/apply-rls-policies.js#L1-L120)
- [SOLUCAO_ERRO_RLS_MATRICULAS.md](file://docs/SOLUCAO_ERRO_RLS_MATRICULAS.md#L1-L124)

## Deploy em Outros Provedores

Embora o sistema esteja otimizado para Vercel, ele pode ser implantado em outros provedores como Netlify, AWS, ou servidores próprios.

### Considerações Gerais

- Certifique-se de que as variáveis de ambiente estão configuradas corretamente.
- Para provedores serverless, configure o Upstash Redis ou alternativa (Vercel KV, Redis tradicional).
- Ajuste os comandos de build e start conforme necessário.

**Seção fontes**
- [DEPLOY.md](file://docs/DEPLOY.md#L82-L97)

## Scripts de Verificação de Saúde

Após o deploy, verifique a saúde do sistema com os seguintes passos:

1. Acesse a aplicação e verifique se carrega corretamente.
2. Teste a autenticação (login, cadastro).
3. Verifique se as rotas da API respondem (ex: `/api/auth/me`).
4. Confirme que o Redis está funcionando (logs devem mostrar "Upstash Redis configurado").
5. Teste o chat com IA (TobIAs) para garantir que o fluxo com N8N está funcionando.

**Seção fontes**
- [DEPLOY.md](file://docs/DEPLOY.md#L72-L80)
- [UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L73-L100)

## Troubleshooting

### Erro: Variáveis de Ambiente não Encontradas

- Verifique se todas as variáveis estão definidas na Vercel.
- Confira os nomes (sensíveis a maiúsculas/minúsculas).

### Build Falhou

- Verifique os logs de build.
- Certifique-se de que todas as dependências estão no `package.json`.
- Execute `npm run build` localmente para testar.

### Problemas com Autenticação

- Verifique `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`.
- Confira as URLs de redirect no Supabase.

### Problemas com Redis

- Se não configurado, o sistema usa fallback em memória (não recomendado para produção).
- Verifique `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.

**Seção fontes**
- [DEPLOY.md](file://docs/DEPLOY.md#L123-L144)
- [UPSTASH_REDIS_SETUP.md](file://docs/UPSTASH_REDIS_SETUP.md#L114-L149)