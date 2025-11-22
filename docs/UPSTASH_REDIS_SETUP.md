# Configuração do Upstash Redis

## Por que usar Upstash Redis?

O sistema de chat com N8N utiliza um **armazenamento temporário** para receber as respostas do agente via callback e disponibilizá-las para o streaming.

### ❌ Problema com Map em Memória

Inicialmente, o sistema usava um `Map` em memória JavaScript. **Isso NÃO funciona em ambientes serverless** (Vercel, AWS Lambda, Netlify, etc.) porque:

1. Cada requisição pode rodar em uma **instância serverless diferente**
2. O callback do N8N armazena dados em uma instância
3. O streaming lê dados de outra instância
4. **Resultado:** Os dados nunca são encontrados!

### ✅ Solução: Upstash Redis

Upstash Redis é um banco de dados Redis serverless que:
- ✅ Funciona perfeitamente em ambientes serverless
- ✅ Compartilha dados entre todas as instâncias
- ✅ Tem plano gratuito generoso
- ✅ Configuração em 2 minutos

## Passo a Passo de Configuração

### 1. Criar conta no Upstash

1. Acesse [https://console.upstash.com/](https://console.upstash.com/)
2. Crie uma conta gratuita (pode usar GitHub, Google, etc.)

### 2. Criar banco de dados Redis

1. No dashboard, clique em **"Create Database"**
2. Configure:
   - **Name:** `areadoaluno-chat` (ou o nome que preferir)
   - **Region:** Escolha a região mais próxima do seu servidor (ex: `us-east-1` para Vercel US)
   - **Type:** `Regional` (para melhor latência) ou `Global` (para múltiplas regiões)
   - **Eviction:** `allkeys-lru` (limpa dados antigos automaticamente)
3. Clique em **"Create"**

### 3. Obter credenciais

1. No dashboard do banco criado, vá para a aba **"REST API"**
2. Você verá duas informações importantes:
   - **UPSTASH_REDIS_REST_URL** (algo como `https://xxx-xxx-xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (um token longo)

### 4. Configurar variáveis de ambiente

#### Desenvolvimento Local

Edite o arquivo `.env.local` e adicione:

```env
UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

#### Produção (Vercel)

1. Acesse o dashboard do projeto na Vercel
2. Vá em **Settings → Environment Variables**
3. Adicione as duas variáveis:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Clique em **Save**
5. Faça um novo deploy ou redeploy do projeto

#### Produção (AWS Lambda, Netlify, etc.)

Configure as variáveis de ambiente na plataforma correspondente.

### 5. Testar a configuração

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Verifique os logs ao iniciar - você deve ver:
   ```
   [Response Store] ✅ Upstash Redis configurado - usando Redis para armazenamento
   ```

3. Se não configurado, verá:
   ```
   [Response Store] ⚠️  AVISO: Upstash Redis não configurado!
   [Response Store] ⚠️  Usando Map em memória - NÃO funcionará em ambientes serverless
   ```

### 6. Testar o chat

1. Acesse a página do TobIAs (`/tobias`)
2. Envie uma mensagem
3. Verifique os logs - você deve ver:
   ```
   [Chat Callback] ✅ Chunk adicionado para sessionId: session-xxx
   [Chat API] 📦 Novos chunks disponíveis: 1
   [Chat API] 📤 Enviando text-delta chunk
   ```

## Plano Gratuito

O plano gratuito do Upstash inclui:
- ✅ 10.000 comandos por dia
- ✅ 256 MB de armazenamento
- ✅ Sem necessidade de cartão de crédito

**Isso é mais que suficiente para:**
- Desenvolvimento
- Testes
- Aplicações pequenas e médias

## Troubleshooting

### Erro: "Redis connection failed"

**Causa:** Credenciais incorretas ou URL inválida

**Solução:**
1. Verifique se copiou corretamente as credenciais do Upstash
2. Certifique-se de que não há espaços extras
3. Reinicie o servidor após adicionar as variáveis

### Mensagens não aparecem no chat

**Causa:** Redis não configurado ou callback não está salvando dados

**Solução:**
1. Verifique os logs do servidor
2. Confirme que vê `[Response Store] ✅ Upstash Redis configurado`
3. Verifique se o callback do N8N está chamando a URL correta
4. Teste manualmente o callback:
   ```bash
   curl -X POST http://localhost:3000/api/chat/callback \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-123",
       "output": "Teste de resposta",
       "isComplete": true
     }'
   ```

### Fallback para Map em memória

Se você não configurar o Upstash Redis:
- ✅ **Funcionará em desenvolvimento local** (single process)
- ❌ **NÃO funcionará em produção serverless** (multiple processes)

## Alternativas

Se você não quiser usar Upstash Redis, pode usar:

1. **Vercel KV** (se estiver usando Vercel)
2. **Redis tradicional** (se tiver servidor próprio)
3. **Supabase Realtime** (menos eficiente, mas já está no projeto)

## Segurança

- ✅ Mantenha suas credenciais em `.env.local` (já está no `.gitignore`)
- ✅ NUNCA comite credenciais no Git
- ✅ Use variáveis de ambiente na produção
- ✅ Considere rotacionar tokens periodicamente

## Monitoramento

No dashboard do Upstash você pode:
- 📊 Ver número de comandos executados
- 💾 Verificar uso de memória
- 🔍 Visualizar dados armazenados
- ⏱️ Monitorar latência

## Suporte

- 📚 [Documentação oficial do Upstash](https://docs.upstash.com/)
- 💬 [Discord do Upstash](https://discord.gg/upstash)
- 📧 [Suporte via email](mailto:support@upstash.com)
