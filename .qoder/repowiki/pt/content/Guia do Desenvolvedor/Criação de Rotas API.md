# Criação de Rotas API

<cite>
**Arquivos Referenciados neste Documento**   
- [route.ts](file://app/api/atividade/route.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)
- [middleware.ts](file://backend/auth/middleware.ts)
- [api-client.ts](file://lib/api-client.ts)
- [atividade.service.ts](file://backend/services/atividade/atividade.service.ts)
- [atividade.types.ts](file://backend/services/atividade/atividade.types.ts)
- [atividade.repository.ts](file://backend/services/atividade/atividade.repository.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura de Rotas com App Router](#estrutura-de-rotas-com-app-router)
3. [Manipulação de Métodos HTTP](#manipulação-de-métodos-http)
4. [Validação de Entrada](#validação-de-entrada)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Padrão de Resposta e Serialização](#padrão-de-resposta-e-serialização)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Rotas Dinâmicas e Aninhadas](#rotas-dinâmicas-e-aninhadas)
9. [Depuração e Testes](#depuração-e-testes)
10. [Conclusão](#conclusão)

## Introdução

Este guia fornece instruções práticas para criar novas rotas API no diretório `app/api/` utilizando o App Router do Next.js. O sistema implementa uma arquitetura robusta com manipulação de requisições HTTP, validação de entrada, autenticação baseada em JWT e API keys, tratamento padronizado de erros e padrões consistentes de resposta. O guia abrange desde a estrutura básica de rotas até funcionalidades avançadas como rotas dinâmicas, middleware de autorização e estratégias de depuração.

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

## Estrutura de Rotas com App Router

O App Router do Next.js permite criar rotas API através de arquivos `route.ts` em diretórios específicos. Cada arquivo `route.ts` exporta funções nomeadas correspondentes aos métodos HTTP suportados (GET, POST, PUT, DELETE). A estrutura de diretórios define automaticamente o caminho da rota.

```mermaid
graph TB
A[app/api/] --> B[atividade/]
A --> C[auth/]
A --> D[conversations/]
B --> E[route.ts]
B --> F[[id]/]
F --> G[route.ts]
C --> H[signin/]
H --> I[route.ts]
style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#bbf,stroke:#333
style D fill:#bbf,stroke:#333
style E fill:#dfd,stroke:#333
style F fill:#f96,stroke:#333
style G fill:#dfd,stroke:#333
style H fill:#f96,stroke:#333
style I fill:#dfd,stroke:#333
```

**Diagram sources**
- [route.ts](file://app/api/atividade/route.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

## Manipulação de Métodos HTTP

As rotas API implementam manipuladores para diferentes métodos HTTP, exportando funções nomeadas correspondentes. Cada manipulador recebe um objeto `NextRequest` e opcionalmente um contexto com parâmetros de rota.

### Exemplo de Manipulação de Métodos

```mermaid
sequenceDiagram
participant Cliente
participant RotaAPI
participant Serviço
participant Repositório
Cliente->>RotaAPI : GET /api/atividade?modulo_id=123
RotaAPI->>Serviço : listByModulo("123")
Serviço->>Repositório : query atividades por módulo
Repositório-->>Serviço : retorna atividades
Serviço-->>RotaAPI : retorna atividades serializadas
RotaAPI-->>Cliente : 200 OK {data : [atividades]}
Cliente->>RotaAPI : POST /api/atividade
RotaAPI->>RotaAPI : valida autorização
RotaAPI->>Serviço : create(novaAtividade)
Serviço->>Repositório : insere nova atividade
Repositório-->>Serviço : retorna atividade criada
Serviço-->>RotaAPI : retorna atividade com ID
RotaAPI-->>Cliente : 201 Created {data : novaAtividade}
```

**Diagram sources**
- [route.ts](file://app/api/atividade/route.ts)
- [atividade.service.ts](file://backend/services/atividade/atividade.service.ts)

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

## Validação de Entrada

A validação de entrada é implementada tanto com validações manuais quanto com integração de bibliotecas especializadas. O sistema utiliza classes de erro personalizadas para diferentes tipos de falhas de validação.

### Estratégias de Validação

```mermaid
flowchart TD
A[Requisição Recebida] --> B{Método HTTP}
B --> |POST/PUT| C[Parse JSON do corpo]
C --> D{Parse bem-sucedido?}
D --> |Não| E[Retorna 400 Bad Request]
D --> |Sim| F[Valida campos obrigatórios]
F --> G{Campos válidos?}
G --> |Não| H[Retorna 400 com mensagem de erro]
G --> |Sim| I[Chama serviço de negócio]
I --> J[Manipulador de negócio]
J --> K[Retorna resposta]
```

**Diagram sources**
- [route.ts](file://app/api/atividade/route.ts)
- [atividade.service.ts](file://backend/services/atividade/atividade.service.ts)

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [atividade.types.ts](file://backend/services/atividade/atividade.types.ts)

## Autenticação e Autorização

O sistema implementa um sistema de autenticação robusto com suporte a JWT e API keys, utilizando middleware para proteger rotas e verificar permissões de usuário.

### Fluxo de Autenticação

```mermaid
sequenceDiagram
participant Cliente
participant RotaAPI
participant Middleware
participant Supabase
Cliente->>RotaAPI : Requisição com Authorization : Bearer token
RotaAPI->>Middleware : requireAuth(handler)
Middleware->>Supabase : getUser(token)
Supabase-->>Middleware : dados do usuário
Middleware->>Middleware : valida role e permissões
Middleware->>RotaAPI : anexa usuário à requisição
RotaAPI->>RotaAPI : executa manipulador protegido
RotaAPI-->>Cliente : resposta
alt Token inválido
Middleware-->>Cliente : 401 Unauthorized
end
alt Permissão negada
Middleware-->>Cliente : 403 Forbidden
end
```

**Diagram sources**
- [middleware.ts](file://backend/auth/middleware.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

**Section sources**
- [middleware.ts](file://backend/auth/middleware.ts)
- [route.ts](file://app/api/atividade/[id]/route.ts)

## Padrão de Resposta e Serialização

O sistema utiliza um padrão consistente de resposta com serialização de dados para JSON, garantindo que todos os endpoints retornem uma estrutura uniforme.

### Estrutura de Resposta

```mermaid
erDiagram
RESPONSE ||--o{ DATA : contains
RESPONSE ||--o{ ERROR : contains
RESPONSE {
object data
string error
}
DATA {
string id
string titulo
string tipo
datetime createdAt
datetime updatedAt
}
ERROR {
string error
string details
}
```

**Diagram sources**
- [route.ts](file://app/api/atividade/route.ts)
- [api-client.ts](file://lib/api-client.ts)

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [api-client.ts](file://lib/api-client.ts)

## Tratamento de Erros

O tratamento de erros é padronizado com códigos HTTP apropriados e mensagens descritivas, facilitando a depuração e a experiência do desenvolvedor.

### Mapeamento de Erros

| Tipo de Erro | Código HTTP | Exemplo de Mensagem |
|--------------|-----------|-------------------|
| Validação | 400 | "modulo_id or frente_id query parameter is required" |
| Não Autorizado | 401 | "Unauthorized" |
| Proibido | 403 | "Forbidden" |
| Não Encontrado | 404 | "Atividade não encontrada" |
| Conflito | 409 | "Aluno com este CPF já existe" |
| Erro Interno | 500 | "Internal server error" |

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [atividade.service.ts](file://backend/services/atividade/atividade.service.ts)

## Rotas Dinâmicas e Aninhadas

O sistema suporta rotas dinâmicas com parâmetros entre colchetes (`[id]`) e rotas aninhadas para organizar endpoints relacionados.

### Exemplos de Rotas

```mermaid
graph TD
A[/api/atividade] --> B[GET: Listar atividades]
A --> C[POST: Criar atividade]
D[/api/atividade/[id]] --> E[GET: Obter atividade por ID]
D --> F[PUT: Atualizar atividade]
D --> G[DELETE: Remover atividade]
H[/api/atividade/aluno/[alunoId]] --> I[GET: Listar atividades do aluno]
J[/api/conversations/[id]] --> K[GET: Obter conversa]
J --> L[PUT: Atualizar conversa]
J --> M[DELETE: Remover conversa]
style A fill:#bbf,stroke:#333
style D fill:#f96,stroke:#333
style H fill:#f96,stroke:#333
style J fill:#f96,stroke:#333
```

**Diagram sources**
- [route.ts](file://app/api/atividade/[id]/route.ts)
- [route.ts](file://app/api/atividade/aluno/[alunoId]/route.ts)
- [route.ts](file://app/api/conversations/[id]/route.ts)

**Section sources**
- [route.ts](file://app/api/atividade/[id]/route.ts)
- [route.ts](file://app/api/atividade/aluno/[alunoId]/route.ts)

## Depuração e Testes

O sistema inclui práticas recomendadas para depuração e testes de rotas API, facilitando o desenvolvimento e a manutenção.

### Estratégias de Depuração

```mermaid
flowchart LR
A[console.log] --> B[Logs de requisição]
A --> C[Logs de erro detalhados]
A --> D[Informações de contexto]
E[Next.js DevTools] --> F[Inspeção de requisições]
E --> G[Visualização de estado]
E --> H[Depuração de renderização]
I[Testes] --> J[curl]
I --> K[Postman]
I --> L[Scripts de teste]
```

**Section sources**
- [route.ts](file://app/api/conversations/[id]/route.ts)
- [api-client.ts](file://lib/api-client.ts)

## Conclusão

A criação de rotas API no sistema segue padrões consistentes e bem definidos, utilizando o App Router do Next.js com arquivos `route.ts`. O sistema implementa autenticação robusta, validação de entrada, tratamento padronizado de erros e padrões consistentes de resposta. As rotas dinâmicas e aninhadas permitem uma organização lógica dos endpoints, enquanto as práticas de depuração e testes facilitam o desenvolvimento e manutenção. Para criar novas rotas, siga os padrões estabelecidos nos exemplos existentes, garantindo consistência e qualidade no código.

**Section sources**
- [route.ts](file://app/api/atividade/route.ts)
- [middleware.ts](file://backend/auth/middleware.ts)
- [api-client.ts](file://lib/api-client.ts)