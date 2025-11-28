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

### 9. Notas Importantes

- ✅ O token está na URL, não precisa de autenticação adicional
- ✅ CORS está habilitado para todos os domínios
- ✅ O Content-Type é detectado automaticamente pela extensão
- ⚠️ Arquivos expiram em 10 minutos
- ⚠️ Use a URL completa com o token

