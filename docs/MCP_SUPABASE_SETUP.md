# Configuração do MCP do Supabase no Cursor

Este guia explica como configurar o Model Context Protocol (MCP) do Supabase no Cursor IDE.

## Pré-requisitos

1. Ter um projeto no Supabase
2. Ter um Access Token do Supabase (Personal Access Token)

## Passo 1: Gerar Access Token no Supabase

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome ao token (ex: "Cursor MCP")
4. Copie o token gerado (você só verá ele uma vez!)

## Passo 2: Configurar o MCP no Cursor

O arquivo de configuração do MCP do Cursor está localizado em:
- **Windows**: `%USERPROFILE%\.cursor\mcp.json` ou `C:\Users\SEU_USUARIO\.cursor\mcp.json`
- **macOS/Linux**: `~/.cursor/mcp.json`

### Configuração Completa

Edite o arquivo `~/.cursor/mcp.json` e adicione/atualize a configuração do Supabase:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer SEU_ACCESS_TOKEN_AQUI",
        "x-supabase-project-ref": "wtqgfmtucqmpheghcvxo"
      }
    }
  }
}
```

**Substitua:**
- `SEU_ACCESS_TOKEN_AQUI` pelo token que você gerou no Passo 1
- `wtqgfmtucqmpheghcvxo` pelo seu project_ref (já está correto no seu caso)

### Alternativa: Usando project_ref na URL

Você também pode usar a URL com project_ref:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=wtqgfmtucqmpheghcvxo",
      "headers": {
        "Authorization": "Bearer SEU_ACCESS_TOKEN_AQUI"
      }
    }
  }
}
```

## Passo 3: Reiniciar o Cursor

Após editar o arquivo `mcp.json`:
1. Feche completamente o Cursor
2. Abra o Cursor novamente
3. O MCP do Supabase deve estar disponível

## Passo 4: Verificar se está funcionando

No Cursor, você pode verificar se o MCP está funcionando:
1. Abra o chat do Cursor
2. Tente usar comandos relacionados ao Supabase
3. O MCP deve aparecer na lista de recursos disponíveis

## Informações do seu projeto

Com base no seu `.env.local`:
- **Project Ref**: `wtqgfmtucqmpheghcvxo`
- **Supabase URL**: `https://wtqgfmtucqmpheghcvxo.supabase.co`

## Comandos úteis do MCP Supabase

Uma vez configurado, você pode usar comandos como:
- Executar SQL diretamente
- Listar tabelas
- Consultar dados
- Gerenciar migrações

## Troubleshooting

### MCP não aparece
1. Verifique se o token está correto
2. Verifique se o project_ref está correto
3. Reinicie o Cursor completamente
4. Verifique os logs do Cursor para erros

### Erro de autenticação
- Gere um novo token no Supabase
- Certifique-se de que o token não expirou
- Verifique se o token tem as permissões necessárias

## Referências

- [Documentação oficial do Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub - supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)


