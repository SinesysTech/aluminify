# Como Acessar Anexos no N8N

## Problema
Quando o N8N tenta baixar um arquivo (PDF, imagem) através do HTTP Request, pode aparecer erro de "link privado" ou "precisa de autenticação".

## Solução

### 1. A URL já contém o token
A URL enviada para o N8N já inclui o token como query parameter:
```
https://areadoaluno-xi.vercel.app/api/chat/attachments/{id}/{filename}?token={token}
```

### 2. Configuração no N8N HTTP Request Node

**Método:** `GET`

**URL:** Use a URL completa que foi enviada no campo `url` do `attachments_metadata`:
```
{{ $json.attachments_metadata[0].url }}
```

**Ou manualmente:**
```
https://areadoaluno-xi.vercel.app/api/chat/attachments/{{ $json.attachments_metadata[0].id }}/{{ $json.attachments_metadata[0].name }}?token={{ $json.attachments_metadata[0].token }}
```

### 3. Headers (Opcional)
Não é necessário adicionar headers de autenticação. O token já está na URL.

Se necessário, adicione apenas:
```
Accept: */*
```

### 4. Response Format
- **Response Format:** `File**
- Ou deixe como **JSON** se quiser processar a resposta

### 5. Exemplo Completo no N8N

```json
{
  "method": "GET",
  "url": "{{ $json.attachments_metadata[0].url }}",
  "options": {
    "response": {
      "response": {
        "responseFormat": "file"
      }
    }
  }
}
```

### 6. Troubleshooting

**Erro 401 (Token não fornecido):**
- Verifique se a URL completa com `?token=...` está sendo usada
- O token deve estar na query string, não no header

**Erro 403 (Token inválido):**
- Verifique se o token está correto
- O token pode ter expirado (arquivos expiram em 10 minutos)

**Erro 404 (Arquivo não encontrado):**
- O arquivo pode ter sido removido
- Verifique se o ID do anexo está correto

**Erro CORS:**
- Os headers CORS já estão configurados no servidor
- Se ainda houver erro, verifique se está usando a URL completa

### 7. Exemplo de Workflow N8N

1. **Webhook Node** - Recebe a requisição do chat
2. **Extract Attachment URL** - Extrai a URL do anexo:
   ```javascript
   const attachment = $json.attachments_metadata?.[0];
   return {
     url: attachment?.url,
     filename: attachment?.name,
     mimeType: attachment?.mimeType
   };
   ```
3. **HTTP Request Node** - Baixa o arquivo:
   - Method: GET
   - URL: `{{ $json.url }}`
   - Response Format: File
4. **Process File** - Processa o arquivo baixado

### 8. Validação

Para testar se a URL está funcionando, você pode:
1. Copiar a URL completa do log do N8N
2. Colar no navegador (deve fazer download do arquivo)
3. Se funcionar no navegador, funcionará no N8N

### 9. Configuração do "Extract from PDF" no N8N

#### Passo a Passo:

**1. HTTP Request Node (ANTES do Extract from PDF):**

Configurações obrigatórias:
- **Method:** `GET`
- **URL:** `{{ $json.attachments_metadata[0].url }}` (ou a URL completa do anexo)
- **Response Format:** `File` ⚠️ **MUITO IMPORTANTE: Deve ser "File", não "JSON"!**
- **Options → Response → Response Format:** Selecione `File` no dropdown

**2. Extract from PDF Node:**

Configurações:
- **Binary Property:** Deixe como `data` (padrão) ou o nome da propriedade binária que vem do HTTP Request
- **Options → Pages:** Deixe vazio para extrair todas as páginas, ou especifique (ex: `1-3` para páginas 1 a 3)
- **Options → Include Page Numbers:** Marque se quiser incluir números de página

**3. Verificação do Fluxo de Dados:**

O HTTP Request deve retornar um objeto com propriedade binária. Verifique:
- O output do HTTP Request deve ter uma propriedade `data` (ou outra configurada)
- Essa propriedade deve conter o arquivo binário, não HTML ou JSON

**4. Exemplo de Configuração Visual:**

```
Webhook → HTTP Request (Response Format: File) → Extract from PDF → Process Text
```

**5. Troubleshooting Específico para Extract from PDF:**

**Erro: "This operation expects the node's input data to contain a binary file"**

Causas possíveis:
1. ❌ HTTP Request está retornando JSON ao invés de File
   - **Solução:** Mude "Response Format" para `File` no HTTP Request

2. ❌ HTTP Request está recebendo HTML (página de login)
   - **Solução:** Verifique se o middleware está permitindo acesso (já corrigido)
   - Teste a URL no navegador primeiro

3. ❌ Binary Property incorreta no Extract from PDF
   - **Solução:** Verifique qual propriedade binária o HTTP Request está retornando
   - Normalmente é `data`, mas pode ser `binary.data` dependendo da versão do N8N

4. ❌ URL incorreta ou token expirado
   - **Solução:** Verifique se a URL está completa com `?token=...`
   - Verifique se o arquivo não expirou (10 minutos)

**6. Como Verificar se o HTTP Request está Retornando o Arquivo Corretamente:**

Adicione um nó "Set" ou "Code" entre HTTP Request e Extract from PDF para inspecionar:

```javascript
// No nó Code, antes do Extract from PDF
const binaryData = $input.item(0).binary;
console.log('Binary keys:', Object.keys(binaryData));
console.log('Has data property:', !!binaryData.data);
console.log('Data type:', typeof binaryData.data);

// Se binaryData.data existir, está correto
return $input.all();
```

**7. Configuração Alternativa (Se ainda não funcionar):**

Se o Extract from PDF não reconhecer o arquivo, tente:
- No HTTP Request, adicione header: `Accept: application/pdf`
- No Extract from PDF, verifique se "Binary Property" está como `data`
- Se usar versão antiga do N8N, pode ser necessário usar `binary.data`

### 10. Notas Importantes

- ✅ O token está na URL, não precisa de autenticação adicional
- ✅ CORS está habilitado para todos os domínios
- ✅ O Content-Type é detectado automaticamente pela extensão
- ⚠️ Arquivos expiram em 10 minutos
- ⚠️ Use a URL completa com o token
- ⚠️ **CRÍTICO:** HTTP Request deve ter Response Format = `File`, não `JSON`
- ⚠️ Verifique se o arquivo binário está na propriedade correta antes do Extract from PDF

