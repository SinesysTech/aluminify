# 🔧 Correção: Erro ao Baixar Imagens no N8N Analyzer

## 🔴 Problema

Ao enviar imagens pelo agente do app, o nó "Analyzer de Imagem" no N8N apresenta o erro:

```
Bad request - please check your parameters

Error while downloading http://localhost:3000/api/chat/attachments/...
```

## 🔍 Causa

O problema ocorre porque:

1. A URL dos anexos está sendo gerada com `localhost:3000`
2. O N8N (que pode estar em um container Docker ou servidor diferente) não consegue acessar `localhost:3000` do host
3. O N8N precisa de uma URL acessível para baixar os arquivos

## ✅ Solução

### Opção 1: Configurar Variável de Ambiente (Recomendado)

Adicione uma das seguintes variáveis de ambiente no seu `.env.local` ou na Vercel:

```env
# Para desenvolvimento local com Docker
NEXT_PUBLIC_API_URL=http://host.docker.internal:3000

# Para desenvolvimento local com ngrok
NEXT_PUBLIC_API_URL=https://seu-subdominio.ngrok.io

# Para produção
NEXT_PUBLIC_API_URL=https://seu-dominio.com
```

**Ou use:**
```env
PUBLIC_API_URL=https://seu-dominio.com
```

### Opção 2: Usar ngrok para Desenvolvimento Local

Se você está desenvolvendo localmente e o N8N está em outro servidor:

1. Instale o ngrok: https://ngrok.com/download
2. Execute: `ngrok http 3000`
3. Copie a URL HTTPS fornecida (ex: `https://abc123.ngrok.io`)
4. Adicione no `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
   ```

### Opção 3: Configurar Docker Network (Se N8N estiver em Docker)

Se o N8N estiver rodando em um container Docker:

1. Use `host.docker.internal` para acessar o host:
   ```env
   NEXT_PUBLIC_API_URL=http://host.docker.internal:3000
   ```

2. Ou configure uma rede Docker compartilhada entre os containers

## 🔄 O que foi Corrigido

O código agora:

1. **Prioriza variável de ambiente**: Se `NEXT_PUBLIC_API_URL` ou `PUBLIC_API_URL` estiver configurada, usa ela
2. **Usa headers da requisição**: Tenta usar `x-forwarded-host` ou `host` da requisição
3. **Fallback inteligente**: Se nada funcionar, usa a URL da requisição (mas pode não funcionar com localhost)

## 📋 Verificação

Para verificar se está funcionando:

1. Envie uma imagem pelo chat
2. Verifique os logs do servidor - você deve ver:
   ```
   [Chat API] URL base pública: https://seu-dominio.com
   [Chat API] URL do anexo gerada: https://seu-dominio.com/api/chat/attachments/...
   ```
3. Teste a URL no navegador - deve fazer download da imagem
4. O N8N deve conseguir baixar a imagem sem erros

## 🆘 Troubleshooting

### Erro persiste mesmo após configurar a variável

1. **Verifique se a variável está sendo lida:**
   - Reinicie o servidor Next.js após adicionar a variável
   - Verifique os logs para ver qual URL base está sendo usada

2. **Teste a URL manualmente:**
   - Copie a URL do log do N8N
   - Cole no navegador
   - Se não funcionar, o problema pode ser com o token ou arquivo expirado

3. **Verifique se o N8N consegue acessar a URL:**
   - Se estiver em Docker, use `host.docker.internal`
   - Se estiver em outro servidor, use a URL pública (ngrok ou domínio real)

### Ainda aparece localhost:3000

- Certifique-se de que a variável de ambiente está configurada corretamente
- Reinicie o servidor Next.js
- Verifique se não há cache (limpe o cache do navegador se necessário)

## 📚 Referências

- [Documentação de Variáveis de Ambiente](./ENV_VARIABLES.md)
- [Configuração do N8N para Anexos](./N8N_ATTACHMENT_ACCESS.md)

---

**Última atualização:** Janeiro 2025









