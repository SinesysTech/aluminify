# Índice de Documentação - Área do Aluno

Este diretório contém toda a documentação técnica do projeto Área do Aluno.

## 📚 Documentação por Categoria

### 🚀 Início Rápido

- [README Principal](../README.md) - Visão geral do projeto
- [Variáveis de Ambiente](../ENV_VARIABLES.md) - Configuração completa
- [Guia de Deploy](../DEPLOY.md) - Como fazer deploy na Vercel

### 🔐 Autenticação e Segurança

- [Sistema de Autenticação](./authentication.md) - JWT, API Keys, tipos de usuários
- [Primeiro Professor Superadmin](./first-professor-superadmin.md) - Como criar o primeiro superadmin

### 📡 API e Backend

- [Documentação da API](./API.md) - Todos os endpoints disponíveis
- [Schema do Banco de Dados](./schema/schema.md) - Estrutura completa do banco

### 💬 Chat e IA

- [Simplificação do Chat](./SIMPLIFICACAO_CHAT.md) - Arquitetura simplificada do chat
- [Revisão do Backend de Chat](./CHAT_BACKEND_REVISION.md) - Histórico e decisões técnicas
- [Configuração do N8N](./N8N_SETUP.md) - Como configurar o workflow N8N
- [Acesso a Anexos no N8N](./N8N_ATTACHMENT_ACCESS.md) - Como acessar anexos no workflow
- [Debug de Erros PDF no N8N](./N8N_DEBUG_PDF_ERROR.md) - Troubleshooting
- [Configuração do Extract from PDF](./N8N_EXTRACT_PDF_CONFIG.md) - Configuração avançada

### ⚙️ Infraestrutura

- [Configuração do Redis Upstash](./UPSTASH_REDIS_SETUP.md) - Cache distribuído
- [Setup do Supabase MCP](./MCP_SUPABASE_SETUP.md) - Configuração do Model Context Protocol

### 📋 Fluxos e Funcionalidades

- [Fluxo de Geração de Cronograma](../FLUXO_GERACAO_CRONOGRAMA.md) - Como funciona a geração
- [Fluxo de Calendário](../FLUXO_CALENDARIO.md) - Visualização e interação com calendário

### 🛠️ Guias Técnicos

- [Guia de Instalação do Supabase CLI](../GUIA_INSTALACAO_SUPABASE_CLI.md) - Setup local do Supabase

## 🔍 Busca Rápida

### Por Funcionalidade

**Autenticação**
- Como fazer login? → [authentication.md](./authentication.md)
- Como criar API Key? → [authentication.md](./authentication.md#2-autenticação-via-api-key-requisições-diretas)
- Como criar superadmin? → [first-professor-superadmin.md](./first-professor-superadmin.md)

**API**
- Todos os endpoints → [API.md](./API.md)
- Schema do banco → [schema/schema.md](./schema/schema.md)

**Chat**
- Como funciona? → [SIMPLIFICACAO_CHAT.md](./SIMPLIFICACAO_CHAT.md)
- Como configurar N8N? → [N8N_SETUP.md](./N8N_SETUP.md)
- Problemas com PDF? → [N8N_DEBUG_PDF_ERROR.md](./N8N_DEBUG_PDF_ERROR.md)

**Cronogramas**
- Como funciona? → [FLUXO_GERACAO_CRONOGRAMA.md](../FLUXO_GERACAO_CRONOGRAMA.md)
- Calendário → [FLUXO_CALENDARIO.md](../FLUXO_CALENDARIO.md)

**Infraestrutura**
- Variáveis de ambiente → [../ENV_VARIABLES.md](../ENV_VARIABLES.md)
- Redis → [UPSTASH_REDIS_SETUP.md](./UPSTASH_REDIS_SETUP.md)
- Deploy → [../DEPLOY.md](../DEPLOY.md)

## 📝 Contribuindo com a Documentação

Ao atualizar ou criar nova funcionalidade:

1. Atualize a documentação relevante nesta pasta
2. Atualize o README.md principal se necessário
3. Mantenha este índice atualizado
4. Use exemplos de código quando possível
5. Inclua screenshots ou diagramas quando apropriado

## 🔗 Links Úteis

- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/api/docs`
- **Dashboard Supabase**: [app.supabase.com](https://app.supabase.com)
- **Console Upstash**: [console.upstash.com](https://console.upstash.com)

---

**Última atualização:** Janeiro 2025




