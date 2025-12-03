# Solução Alternativa: Extrair Texto de PDF sem "Extract from File"

Se o erro "No password given" persistir mesmo com o campo Password vazio, use esta solução alternativa que contorna o problema usando um nó Code.

## 🔄 Solução: Usar Nó Code com pdf-parse

### Pré-requisitos

1. **N8N Self-hosted**: Você precisa ter acesso para instalar pacotes npm
2. **Instalar pdf-parse**: Execute no servidor do N8N:
   ```bash
   npm install pdf-parse
   ```

### Workflow Alternativo

```
1. Webhook (recebe dados)
   ↓
2. HTTP Request
   - Method: GET
   - URL: {{ $json.attachments_metadata[0].url }}
   - Response Format: File
   ↓
3. Code (extrair texto do PDF)
   ↓
4. Process Text
```

### Código para o Nó Code

```javascript
// Extrair texto de PDF usando pdf-parse
const pdf = require('pdf-parse');
const item = $input.item(0);

// Verificar se há binary data
if (!item.binary || !item.binary.data) {
  throw new Error('Nenhum arquivo binário encontrado');
}

const binaryData = item.binary.data;
let pdfBuffer;

// Converter para buffer se necessário
if (typeof binaryData.data === 'string') {
  // Se for base64 string
  pdfBuffer = Buffer.from(binaryData.data, 'base64');
} else if (Buffer.isBuffer(binaryData.data)) {
  // Se já for buffer
  pdfBuffer = binaryData.data;
} else {
  throw new Error('Formato de dados binários não suportado');
}

// Verificar se é um PDF válido
const firstBytes = pdfBuffer.slice(0, 4).toString();
if (firstBytes !== '%PDF') {
  throw new Error('Arquivo não é um PDF válido');
}

// Extrair texto do PDF
try {
  const pdfData = await pdf(pdfBuffer);
  
  return {
    json: {
      text: pdfData.text,
      numPages: pdfData.numpages,
      info: pdfData.info,
      metadata: pdfData.metadata,
      fileName: binaryData.fileName || 'document.pdf'
    }
  };
} catch (error) {
  // Se o erro for relacionado a senha, tenta sem senha primeiro
  if (error.message && error.message.includes('password')) {
    throw new Error('PDF pode estar protegido por senha. Erro: ' + error.message);
  }
  throw error;
}
```

## 🔄 Solução 2: Usar API Externa (Sem Instalação)

Se você não pode instalar pacotes, use uma API externa:

### Workflow com API Externa

```
1. Webhook
   ↓
2. HTTP Request (baixar PDF)
   - Method: GET
   - URL: {{ $json.attachments_metadata[0].url }}
   - Response Format: File
   ↓
3. HTTP Request (extrair texto via API)
   - Method: POST
   - URL: https://api.pdf.co/v1/pdf/convert/to/text
   - Headers:
     - x-api-key: SEU_API_KEY
   - Body: Form-data
     - file: {{ $binary.data }}
   ↓
4. Process Text
```

### Código para Preparar o Request (Opcional)

Se precisar converter o binary para base64 antes de enviar:

```javascript
// Nó Code antes do HTTP Request da API
const item = $input.item(0);
const binaryData = item.binary.data;

let base64Data;
if (typeof binaryData.data === 'string') {
  base64Data = binaryData.data;
} else {
  base64Data = binaryData.data.toString('base64');
}

return {
  json: {
    fileBase64: base64Data,
    fileName: binaryData.fileName || 'document.pdf'
  }
};
```

## 🔄 Solução 3: Usar Download File + Extract from PDF

Algumas versões do N8N processam melhor com "Download File":

```
1. Webhook
   ↓
2. Code (preparar URL)
   ```javascript
   return {
     url: $json.attachments_metadata[0].url
   };
   ```
   ↓
3. Download File
   - URL: {{ $json.url }}
   - Authentication: None
   ↓
4. Extract from PDF
   - Binary Property: data
   - Password: (VAZIO)
   ↓
5. Process Text
```

## 🔄 Solução 4: Converter PDF para Texto no Servidor

Se você tem controle sobre o servidor, pode criar um endpoint que converte PDF para texto:

### Endpoint no Next.js (exemplo)

```typescript
// app/api/pdf/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);

    return NextResponse.json({
      text: pdfData.text,
      numPages: pdfData.numpages,
      info: pdfData.info
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar PDF' },
      { status: 500 }
    );
  }
}
```

### Workflow no N8N

```
1. Webhook
   ↓
2. HTTP Request (baixar PDF)
   - Method: GET
   - URL: {{ $json.attachments_metadata[0].url }}
   - Response Format: File
   ↓
3. HTTP Request (extrair texto)
   - Method: POST
   - URL: https://seu-dominio.com/api/pdf/extract-text
   - Body: Form-data
     - file: {{ $binary.data }}
   ↓
4. Process Text (usa $json.text)
```

## 📋 Comparação das Soluções

| Solução | Requer Instalação | Requer API Externa | Complexidade | Recomendação |
|---------|------------------|-------------------|--------------|--------------|
| pdf-parse (Code) | ✅ Sim | ❌ Não | Média | ⭐⭐⭐⭐ Melhor para self-hosted |
| API Externa | ❌ Não | ✅ Sim | Baixa | ⭐⭐⭐ Para N8N Cloud |
| Download File | ❌ Não | ❌ Não | Baixa | ⭐⭐⭐⭐ Tente primeiro |
| Endpoint Próprio | ✅ Sim | ❌ Não | Alta | ⭐⭐⭐ Para controle total |

## 🎯 Recomendação

1. **Primeiro**: Tente a Solução 3 (Download File) - é a mais simples
2. **Se não funcionar**: Use Solução 1 (pdf-parse) se tiver N8N self-hosted
3. **Se não tiver acesso**: Use Solução 2 (API Externa)
4. **Para produção**: Considere Solução 4 (Endpoint próprio) para mais controle

## 🔧 Troubleshooting

### Erro: "Cannot find module 'pdf-parse'"

**Solução**: Instale o pacote no servidor N8N:
```bash
cd /path/to/n8n
npm install pdf-parse
```

### Erro: "PDF está protegido por senha"

**Solução**: Se o PDF realmente tem senha, você precisará:
1. Obter a senha do usuário
2. Passar a senha no código:
```javascript
const pdfData = await pdf(pdfBuffer, { password: 'senha123' });
```

### Erro: "Timeout ao processar PDF grande"

**Solução**: Aumente o timeout do nó Code ou processe em chunks.

## 📚 Documentação Relacionada

- [Erro "No password given"](./N8N_PDF_PASSWORD_ERROR.md)
- [Configuração do Extract from PDF](./N8N_EXTRACT_PDF_CONFIG.md)
- [Debug de Erros de PDF](./N8N_DEBUG_PDF_ERROR.md)



