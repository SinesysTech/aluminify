# 🔧 Correção Rápida: Erro "No password given" no N8N

## ⚡ Solução Rápida (Tente nesta ordem)

### 1️⃣ Trocar "Extract from File" por "Extract from PDF"

O nó "Extract from File" pode ter bugs. Use especificamente **"Extract from PDF"**:

1. Delete o nó "Extract from File"
2. Adicione um novo nó chamado **"Extract from PDF"** (não "Extract from File")
3. Configure:
   - Binary Property: `data`
   - Password: **deixe completamente vazio**
4. Teste

### 2️⃣ Usar "Download File" ao invés de "HTTP Request"

Algumas versões do N8N processam melhor com Download File:

1. Delete o nó HTTP Request
2. Adicione nó **"Download File"**
3. Configure:
   - URL: `{{ $json.attachments_metadata[0].url }}`
   - Authentication: None
4. Conecte ao Extract from PDF
5. Teste

### 3️⃣ Verificar se o Campo Password Está Realmente Vazio

1. Abra o nó Extract from PDF
2. Vá em "Options" ou "Advanced"
3. Localize "Password"
4. **Selecione todo o conteúdo do campo e delete** (pode ter espaços invisíveis)
5. Salve
6. Teste

### 4️⃣ Recriar o Nó do Zero

1. **Anote as configurações atuais**
2. **Delete completamente o nó** Extract from File/PDF
3. **Crie um novo nó** "Extract from PDF"
4. Configure apenas:
   - Binary Property: `data`
   - **NÃO toque no campo Password** (deixe como está por padrão)
5. Teste

## 🔍 Diagnóstico Rápido

### Pergunta 1: Qual nó você está usando?
- [ ] "Extract from File" → **Troque para "Extract from PDF"**
- [ ] "Extract from PDF" → Continue para próxima pergunta

### Pergunta 2: Como você está baixando o arquivo?
- [ ] HTTP Request → **Tente usar "Download File"**
- [ ] Download File → Continue para próxima pergunta

### Pergunta 3: O PDF abre sem senha no seu computador?
- [ ] Sim, abre normalmente → O problema é no N8N, use Solução Alternativa
- [ ] Não, pede senha → Você precisa fornecer a senha no campo Password

### Pergunta 4: Qual versão do N8N você está usando?
- [ ] N8N Cloud → Use Solução Alternativa com API externa
- [ ] N8N Self-hosted → Pode usar pdf-parse (veja N8N_EXTRACT_PDF_ALTERNATIVE.md)

## ✅ Solução Mais Provável

**90% dos casos**: O problema é usar "Extract from File" ao invés de "Extract from PDF"

**Solução:**
1. Delete "Extract from File"
2. Adicione "Extract from PDF"
3. Configure Binary Property: `data`
4. Deixe Password vazio
5. Teste

## 🆘 Se Nada Funcionar

Use a solução alternativa com nó Code:
- Veja: [N8N_EXTRACT_PDF_ALTERNATIVE.md](./N8N_EXTRACT_PDF_ALTERNATIVE.md)

## 📞 Informações para Debug

Se ainda não funcionar, colete estas informações:

1. **Versão do N8N**: (ex: 1.45.0)
2. **Tipo de instalação**: Cloud ou Self-hosted
3. **Nome exato do nó**: "Extract from File" ou "Extract from PDF"
4. **Configuração do nó anterior**: (HTTP Request ou Download File)
5. **Mensagem de erro completa**: (copie e cole)
6. **O PDF abre no seu computador?**: Sim/Não

Com essas informações, podemos identificar a causa exata.



