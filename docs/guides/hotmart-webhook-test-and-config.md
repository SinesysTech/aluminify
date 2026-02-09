# Testar webhook Hotmart e configurar uso dos dados

Este guia explica como **testar** se os dados enviados pela Hotmart estão chegando corretamente e como **configurar** o uso desses dados na plataforma (transações, alunos, matrículas em cursos).

---

## 1. Obter o `empresaId` do usuário

A URL do webhook inclui o parâmetro `empresaId`. Para o usuário **brenomeira@salinhadobreno.com.br** (ou qualquer outro), o `empresa_id` vem da empresa à qual ele está vinculado.

**Opção A – Pelo Supabase (SQL)**

No SQL Editor do Supabase, execute:

```sql
-- Por email do usuário (professor/admin da empresa)
SELECT u.id, u.email, u.empresa_id, e.nome AS empresa_nome
FROM usuarios u
LEFT JOIN empresas e ON e.id = u.empresa_id
WHERE u.email = 'brenomeira@salinhadobreno.com.br';
```

Se esse usuário for acessar pela **área do tenant** (subdomínio/rota), o `empresa_id` retornado é o que deve ser usado na URL do webhook.

**Opção B – Pela URL na plataforma**

1. Faça login como **brenomeira@salinhadobreno.com.br**.
2. Vá em **Financeiro → Integrações** (ou onde está a tela da integração Hotmart).
3. A URL do webhook exibida já contém o `empresaId` correto, por exemplo:  
   `https://seu-dominio.com/api/webhooks/hotmart?empresaId=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`

Use esse valor de `empresaId` em todos os testes abaixo.

---

## 2. Testar se os dados estão chegando

### 2.1 Verificar se o endpoint está no ar (GET)

```bash
curl -s "https://SEU_DOMINIO/api/webhooks/hotmart"
```

Resposta esperada: JSON com `status: "ok"`, lista de eventos suportados e uso do POST.

### 2.2 Testar recebimento com um payload de exemplo (POST)

O webhook exige:

- **Query:** `empresaId=<uuid_da_empresa>`
- **Header:** `X-HOTMART-HOTTOK` = mesmo valor do Hottok configurado na integração Hotmart (e salvo em `payment_providers.webhook_secret`).
- **Body:** JSON no formato da Hotmart (ex.: evento de compra).

Exemplo mínimo de **PURCHASE_APPROVED**:

```bash
export WEBHOOK_URL="https://SEU_DOMINIO/api/webhooks/hotmart"
export EMPRESA_ID="uuid-da-empresa-aqui"
export HOTTOK="seu-hottok-da-hotmart"

curl -X POST "${WEBHOOK_URL}?empresaId=${EMPRESA_ID}" \
  -H "Content-Type: application/json" \
  -H "X-HOTMART-HOTTOK: ${HOTTOK}" \
  -d '{
    "id": "test-event-uuid-123",
    "creation_date": 1738000000000,
    "event": "PURCHASE_APPROVED",
    "version": "2.0.0",
    "data": {
      "product": { "id": 123456, "name": "Curso Teste", "ucode": "ABC123" },
      "buyer": {
        "email": "aluno-teste@exemplo.com",
        "name": "Aluno Teste",
        "document": "12345678900"
      },
      "purchase": {
        "transaction": "TX-TEST-001",
        "status": "APPROVED",
        "approved_date": 1738000000000,
        "payment": { "type": "PIX", "installments_number": 1 },
        "price": { "value": 197.00, "currency_code": "BRL" }
      }
    }
  }'
```

- **200** e `success: true`: payload aceito e processado.
- **400**: falta `empresaId` ou body inválido.
- **401**: falta header `X-HOTMART-HOTTOK` ou Hottok não confere com o cadastrado para essa empresa.

### 2.3 Usar o script de teste (recomendado)

Há scripts que montam o POST para você.

**Linux/macOS (Bash):**

```bash
export WEBHOOK_BASE_URL="https://SEU_DOMINIO"   # ou http://localhost:3000
export EMPRESA_ID="uuid-da-empresa"
export HOTTOK="seu-hottok"
./scripts/integracoes/test-hotmart-webhook.sh
```

**Windows (PowerShell):**

```powershell
$env:WEBHOOK_BASE_URL = "https://SEU_DOMINIO"
$env:EMPRESA_ID = "uuid-da-empresa"
$env:HOTTOK = "seu-hottok"
.\scripts\integracoes\test-hotmart-webhook.ps1
```

### 2.4 Conferir nos logs

- **Vercel:** Vercel Dashboard → projeto → Logs (requests para `/api/webhooks/hotmart`).
- **Local:** saída no terminal onde o `next dev` está rodando.

Mensagens úteis:

- `[Hotmart Webhook] Received:` — evento recebido (event, eventId, transaction).
- `[Hotmart Webhook] Processed:` — resultado (success, transactionId, etc.).
- Erros 401/400 aparecem com mensagens como "Missing empresaId", "Invalid webhook signature".

Se esses logs aparecerem com o payload de teste, **os dados estão chegando** e sendo aceitos pelo endpoint.

---

## 2.5 Se eu enviar um teste pela Hotmart, como verifico se deu certo?

Quando você dispara um **teste de webhook** no painel da Hotmart, use estes três pontos para conferir:

### Na própria Hotmart

- Na tela de configuração do webhook (Ferramentas → Webhook), a Hotmart costuma mostrar o **último envio** e o **resultado** (ex.: HTTP 200 = sucesso, 401/500 = falha).
- Se aparecer **HTTP 200** e algo como `{"success":true,"message":"...","transactionId":"..."}`, o endpoint recebeu e processou.

### Na plataforma (Área do Aluno)

1. **Financeiro → Transações**  
   Deve aparecer uma **nova transação** com:
   - Provider **Hotmart**
   - E-mail do comprador do payload de teste
   - Status conforme o evento (ex.: aprovado para PURCHASE_APPROVED)
   - Data/hora recente  

   Filtre por “Hotmart” e pela data de hoje para achar rápido.

2. **Usuários / Alunos** (se o evento foi de compra aprovada)  
   Se o e-mail do teste ainda não existia na empresa, deve ter sido criado um **novo aluno** com origem “Hotmart”. Procure pelo e-mail que veio no payload.

3. **Cursos e matrículas**  
   Se você tiver um **produto** cadastrado (Hotmart + ID do produto + curso vinculado) igual ao do payload de teste, o aluno deve aparecer **matriculado** nesse curso.

### Nos logs do servidor (Vercel ou local)

- **Vercel:** Dashboard do projeto → **Logs** → filtre por `/api/webhooks/hotmart` ou por “Hotmart Webhook”.
- **Local:** no terminal onde está rodando `npm run dev` (ou `next dev`), procure por:
  - `[Hotmart Webhook] Received:` → confirma que o POST chegou
  - `[Hotmart Webhook] Processed: success: true` → confirma que foi processado sem erro

**Resumo:** teste na Hotmart → veja HTTP 200 na Hotmart → confira nova transação em **Financeiro → Transações** e, se for compra aprovada, aluno em **Usuários** e matrícula (se produto/curso estiver configurado). Em caso de dúvida, use os logs do servidor.

---

## 3. Como os dados são usados na plataforma

O que acontece quando um evento Hotmart é processado com sucesso:

| Etapa | O que a plataforma faz |
|-------|-------------------------|
| 1. Transação | Cria ou atualiza um registro em **Financeiro → Transações** (provider Hotmart, status conforme o evento: aprovado, cancelado, reembolsado etc.). |
| 2. Aluno | Em eventos de compra aprovada (**PURCHASE_APPROVED** / **PURCHASE_COMPLETE**), se o e-mail do comprador ainda não existir na empresa, é criado um **usuário/aluno** (auth + `usuarios` + `profiles`) com origem "hotmart" e `hotmart_id` preenchido. |
| 3. Matrícula em curso | Se existir um **curso** com o **ID do produto Hotmart** (ou um dos IDs) igual ao `product.id` do webhook, o aluno é **matriculado automaticamente** nesse curso. |

Ou seja: os dados são usados para **transações**, **criação/atualização de alunos** e **matrícula automática** conforme o cadastro de produtos.

---

## 4. Configurar como os dados serão usados

Para que uma venda Hotmart vire **transação + aluno + matrícula no curso certo**, é obrigatório cadastrar o **produto** na plataforma e vincular ao **curso**.

### 4.1 (Recomendado) Vincular IDs da Hotmart diretamente no curso

1. Acesse **Cursos → (Editar/Criação do curso)**.
2. Na seção **Integrações**, preencha **IDs do Produto Hotmart**.\n+   - Você pode informar **mais de um ID** (um por linha ou separados por vírgula).\n+   - Isso é importante para casos como **produto avulso + assinatura** apontando para o mesmo curso.
3. Salve.

Assim, quando chegar um **PURCHASE_APPROVED** (ou **PURCHASE_COMPLETE**) com esse `product.id`:

- A transação é criada/atualizada.
- O aluno é criado (se não existir) ou atualizado (ex.: `hotmart_id`).
- O aluno é matriculado no curso que contém aquele `product.id` na lista de IDs Hotmart.

### 4.2 (Compatibilidade) Vincular via Financeiro → Produtos

Ainda é possível usar **Financeiro → Produtos** para vincular `provider_product_id` (Hotmart) a um `curso_id`. Esse modo continua suportado como fallback, mas a forma recomendada é o vínculo direto no curso (seção 4.1), pois suporta múltiplos IDs por curso sem redundância.

### 4.2 Onde ver o ID do produto na Hotmart

No painel da Hotmart, o ID do produto aparece na URL ou na configuração do produto (ex.: número tipo `123456`). Esse é o valor que deve ser usado em **ID do Produto no Provider** e que a Hotmart envia em `data.product.id` no webhook.

### 4.3 Resumo do fluxo

```
Hotmart envia webhook (PURCHASE_APPROVED)
    → API valida empresaId + X-HOTMART-HOTTOK
    → Busca curso na plataforma: empresa_id + hotmart_product_id = product.id (lista do curso)
    → Se achar curso_id: cria/atualiza aluno e matricula no curso
    → (Fallback) Se não achar: tenta Financeiro → Produtos (provider_product_id)
    → Sempre: cria/atualiza transação em financeiro/transacoes
```

---

## 5. Checklist rápido

- [ ] Obter `empresaId` (SQL ou pela URL em Financeiro → Integrações).
- [ ] Configurar na Hotmart a URL: `https://SEU_DOMINIO/api/webhooks/hotmart?empresaId=<empresaId>`.
- [ ] Configurar na Hotmart o mesmo Hottok que está em **Integrações Hotmart** na plataforma (campo salvo como webhook_secret).
- [ ] Testar com GET e depois com POST (curl ou script).
- [ ] Cadastrar cada produto Hotmart em **Financeiro → Produtos** com provider Hotmart, ID do produto e curso desejado.
- [ ] Verificar logs e **Financeiro → Transações** após um evento real ou de teste.

Se algo falhar (401, 400, ou transação sem matrícula), use a seção 2.4 (logs) e a seção 4 (produto/curso) para checar empresaId, Hottok e vínculo produto–curso.
