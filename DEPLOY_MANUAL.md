# 🚀 Deploy Manual na Vercel

## ⚠️ Projeto Já Existe na Vercel

Se o projeto já foi criado na Vercel, você tem duas opções:

## Opção 1: Conectar e Deploy via CLI (Recomendado)

```bash
# 1. Fazer login (abrirá o navegador)
vercel login

# 2. Conectar ao projeto existente na Vercel
vercel link

# 3. Fazer deploy de produção
vercel --prod
```

O comando `vercel link` irá:
- Listar seus projetos na Vercel
- Você escolhe qual projeto conectar
- Cria o arquivo `.vercel/project.json` com a conexão

## Opção 2: Via Dashboard da Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **Abra o projeto existente**
3. **Vá em:** Settings → Git
4. **Verifique se o repositório está conectado:**
   - Se não estiver: conecte o repositório `BrenoMeira/areadoaluno`
   - Se já estiver: verifique se está apontando para a branch `main`
5. **Faça o deploy:**
   - Clique em "Redeploy" na última versão, OU
   - Faça um novo commit/push para acionar deploy automático

## Opção 2: Via CLI

### Passo 1: Login
```bash
vercel login
```
- Isso abrirá o navegador para autenticação
- Autorize o acesso

### Passo 2: Deploy
```bash
# Deploy de preview (teste)
vercel

# Deploy de produção
vercel --prod
```

## ⚙️ Variáveis de Ambiente Necessárias

Configure estas variáveis na Vercel (Settings → Environment Variables):

### Obrigatórias:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua_chave_secreta
```

### Recomendadas:
```
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
N8N_WEBHOOK_URL=https://seu-webhook.n8n.io
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app
PUBLIC_API_URL=https://seu-dominio.vercel.app
```

## 📝 Após Conectar o Projeto

1. **Após `vercel link`:** O projeto local estará conectado ao projeto na Vercel
2. **Próximos deploys:** Use `vercel --prod` ou faça push para acionar deploy automático
3. **Deploy automático:** Se o Git estiver conectado, pushes na branch `main` farão deploy automático
4. **Verifique variáveis:** Certifique-se de que todas as variáveis de ambiente estão configuradas

## 🔄 Se o Deploy Automático Não Funcionar

1. Vá em **Settings → Git** no dashboard da Vercel
2. Verifique se o repositório está conectado corretamente
3. Verifique se está monitorando a branch `main`
4. Se necessário, desconecte e reconecte o repositório

## 🔗 Links Úteis

- Dashboard: https://vercel.com/dashboard
- Documentação: https://vercel.com/docs
- Status: https://vercel.com/status

