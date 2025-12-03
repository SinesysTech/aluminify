# Debug: Erro "Invalid PDF structure" no N8N

## 🔴 Erro
```
"Invalid PDF structure."
```

## 🔍 Causa
O N8N está recebendo algo que não é um PDF válido. Isso geralmente acontece quando:
1. HTTP Request retorna JSON/HTML ao invés do arquivo binário
2. O arquivo binário está corrompido ou mal formatado
3. O binary data não está na estrutura esperada

## ✅ Solução Passo a Passo

### Passo 1: Verificar o Output do HTTP Request

Adicione um nó **Code** entre HTTP Request e Extract from PDF:

```javascript
const item = $input.item(0);

// Verificar se há erro no JSON
if (item.json && item.json.error) {
  console.log('❌ ERRO RETORNADO:', item.json.error);
  return {
    error: true,
    message: item.json.error,
    hasBinary: !!item.binary
  };
}

// Verificar se há binary data
if (!item.binary) {
  console.log('❌ Nenhum binary data encontrado!');
  console.log('Keys disponíveis:', Object.keys(item));
  return {
    error: true,
    message: 'Nenhum binary data encontrado',
    availableKeys: Object.keys(item)
  };
}

// Verificar se tem a propriedade 'data'
if (!item.binary.data) {
  console.log('❌ Binary data não tem propriedade "data"');
  console.log('Binary keys:', Object.keys(item.binary));
  return {
    error: true,
    message: 'Binary data não tem propriedade "data"',
    binaryKeys: Object.keys(item.binary)
  };
}

// Verificar o conteúdo
const binaryData = item.binary.data;
console.log('✅ Binary data encontrado!');
console.log('MIME Type:', binaryData.mimeType);
console.log('File Name:', binaryData.fileName);
console.log('Data type:', typeof binaryData.data);
console.log('Data length:', binaryData.data?.length || 0);

// Verificar se é base64 ou buffer
if (typeof binaryData.data === 'string') {
  // Verificar se começa com PDF signature
  const firstBytes = binaryData.data.substring(0, 10);
  console.log('Primeiros bytes (string):', firstBytes);
  
  // PDF deve começar com "%PDF" quando decodificado
  try {
    const decoded = Buffer.from(binaryData.data, 'base64').toString('utf8', 0, 10);
    console.log('Primeiros bytes (decodificado):', decoded);
    if (decoded.startsWith('%PDF')) {
      console.log('✅ Parece ser um PDF válido!');
    } else {
      console.log('❌ Não parece ser um PDF válido');
    }
  } catch (e) {
    console.log('Erro ao decodificar:', e.message);
  }
} else if (Buffer.isBuffer(binaryData.data)) {
  const firstBytes = binaryData.data.toString('utf8', 0, 10);
  console.log('Primeiros bytes (buffer):', firstBytes);
  if (firstBytes.startsWith('%PDF')) {
    console.log('✅ Parece ser um PDF válido!');
  } else {
    console.log('❌ Não parece ser um PDF válido');
  }
}

return item;
```

### Passo 2: Verificar Configuração do HTTP Request

Certifique-se de que está **EXATAMENTE** assim:

```
Method: GET
URL: {{ $json.body.attachments_metadata[0].url }}
Authentication: None
Options → Response → Response Format: File ⚠️
```

### Passo 3: Testar a URL Manualmente

1. Copie a URL do log:
   ```
   https://areadoaluno-xi.vercel.app/api/chat/attachments/d1ed4bd6-9b9e-4b69-a444-48fdbee3a2ea/Metodologia%20CDF%20-%202026.pdf?token=47af6eea-7766-4ad3-815e-38629625c563
   ```

2. Cole no navegador
3. Deve fazer **download do PDF**, não mostrar página de login ou JSON

### Passo 4: Verificar Logs do Servidor

Verifique os logs da Vercel para ver se:
- A requisição está chegando
- O arquivo está sendo encontrado
- Há algum erro sendo retornado

## 🔧 Soluções Alternativas

### Solução 1: Usar "Download File" Node

Se o HTTP Request não funcionar, tente usar o nó **Download File**:

```
1. Download File Node
   - URL: {{ $json.body.attachments_metadata[0].url }}
   - Authentication: None
   
2. Extract from PDF
   - Input Binary Field: data
```

### Solução 2: Converter Base64 Manualmente

Se o binary data estiver em base64, converta antes:

```javascript
// Nó Code antes do Extract from PDF
const item = $input.item(0);
const binaryData = item.binary.data;

if (typeof binaryData.data === 'string') {
  // Converter base64 para buffer
  const buffer = Buffer.from(binaryData.data, 'base64');
  
  return {
    binary: {
      data: {
        data: buffer,
        mimeType: 'application/pdf',
        fileName: binaryData.fileName || 'document.pdf'
      }
    }
  };
}

return item;
```

### Solução 3: Verificar se o Arquivo Está Corrompido

Teste baixar o arquivo manualmente e verificar se abre corretamente no leitor de PDF.

## 📋 Checklist de Debug

- [ ] HTTP Request Response Format = `File`
- [ ] URL testada no navegador e funciona
- [ ] Nó Code mostra que binary.data existe
- [ ] Primeiros bytes do arquivo começam com `%PDF`
- [ ] Arquivo não expirou (menos de 10 minutos)
- [ ] Token está correto na URL

## 🆘 Se Nada Funcionar

1. **Verifique a versão do N8N:** Versões muito antigas podem ter problemas
2. **Tente outro método:** Use "Download File" ao invés de HTTP Request
3. **Verifique o servidor:** Veja se o arquivo está sendo servido corretamente nos logs










