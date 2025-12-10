# Check Simples (Conceituário)

<cite>
**Arquivos Referenciados neste Documento**   
- [atividade-checklist-row.tsx](file://components/atividade-checklist-row.tsx)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)
- [route.ts](file://app/api/progresso-atividade/atividade/[atividadeId]/route.ts)
- [atividade.types.ts](file://backend/services/atividade/atividade.types.ts)
- [types.ts](file://app/(dashboard)/aluno/sala-de-estudos/types.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Fluxo do Check Simples](#fluxo-do-check-simples)
3. [Comportamento do Componente AtividadeChecklistRow](#comportamento-do-componente-atividadechecklistrow)
4. [Requisição à API](#requisição-à-api)
5. [Processamento no Backend](#processamento-no-backend)
6. [Atualização da Interface](#atualização-da-interface)
7. [Exemplo de Requisição e Resposta](#exemplo-de-requisição-e-resposta)
8. [Integração com a Sala de Estudos](#integração-com-a-sala-de-estudos)

## Introdução

O sistema de marcação de progresso implementa dois tipos de verificação para atividades: **Check Simples** e **Check Qualificado**. Este documento detalha especificamente o **Check Simples**, utilizado em atividades conceituais, como "Conceituario" e "Revisao", onde o aluno apenas marca a conclusão da atividade sem registrar desempenho quantitativo.

Esse fluxo é otimizado para simplicidade, permitindo que o usuário conclua a atividade com um único clique no checkbox, sem a necessidade de abrir modais ou preencher dados adicionais. A ação dispara uma requisição direta à API, que atualiza o status no banco de dados e reflete a mudança na interface de forma imediata.

## Fluxo do Check Simples

O **Check Simples** é aplicado a atividades do tipo `Conceituario` e `Revisao`, conforme definido pela função `atividadeRequerDesempenho` no backend. Essa função determina que apenas esses dois tipos de atividade não exigem um registro de desempenho detalhado.

Quando o aluno clica no checkbox de uma atividade conceitual, o sistema executa o seguinte fluxo:
1.  O componente frontend `AtividadeChecklistRow` detecta o clique.
2.  Como o tipo de atividade não requer desempenho, ele chama diretamente a função `onStatusChange`.
3.  Uma requisição `PATCH` é enviada à rota `/api/progresso-atividade/atividade/{atividadeId}` com o status `Concluido`.
4.  O backend processa a requisição, atualiza o registro no banco de dados e retorna a resposta.
5.  A interface é atualizada para refletir o novo status, exibindo um badge de conclusão.

**Fontes da seção**
- [atividade.types.ts](file://backend/services/atividade/atividade.types.ts#L70-L74)
- [atividade-checklist-row.tsx](file://components/atividade-checklist-row.tsx#L60)

## Comportamento do Componente AtividadeChecklistRow

O componente `AtividadeChecklistRow` é o ponto de entrada da interação do usuário com o sistema de progresso. Ele é responsável por renderizar cada atividade na lista da Sala de Estudos e gerenciar as ações do usuário.

O comportamento ao clicar no checkbox é controlado pela função `handleCheckboxChange`. O fluxo é o seguinte:

```mermaid
flowchart TD
A[Usuário clica no checkbox] --> B{Atividade requer modal?}
B --> |Sim| C[Abrir RegistrarDesempenhoModal]
B --> |Não| D[Chamar handleStatusChange]
D --> E[Enviar PATCH para API]
E --> F[Atualizar UI]
```

A decisão de abrir ou não o modal é feita pela função `atividadeRequerDesempenho`, importada do serviço de atividades. Se a função retornar `false` (como é o caso de atividades `Conceituario` e `Revisao`), o componente executa `handleStatusChange` imediatamente, sem qualquer interação adicional do usuário.

**Fontes do diagrama**
- [atividade-checklist-row.tsx](file://components/atividade-checklist-row.tsx#L78-L95)

**Fontes da seção**
- [atividade-checklist-row.tsx](file://components/atividade-checklist-row.tsx#L49-L322)

## Requisição à API

A conclusão de uma atividade com Check Simples é realizada por uma requisição HTTP do tipo `PATCH` para a rota `/api/progresso-atividade/atividade/{atividadeId}`.

A estrutura da requisição é simples e contém apenas o novo status:

```json
{
  "status": "Concluido"
}
```

A rota é protegida por autenticação (`requireAuth`), garantindo que apenas o aluno autenticado possa atualizar seu próprio progresso. O `alunoId` é extraído automaticamente do token JWT do usuário logado, não sendo necessário enviá-lo no corpo da requisição.

**Fontes da seção**
- [route.ts](file://app/api/progresso-atividade/atividade/[atividadeId]/route.ts#L51-L125)

## Processamento no Backend

O processamento da requisição ocorre em várias camadas do backend:

1.  **Rota API (`route.ts`)**: Recebe a requisição, valida o status e verifica se o tipo de atividade exige um modal de desempenho. Como o corpo da requisição não contém o objeto `desempenho`, e o tipo de atividade é `Conceituario` ou `Revisao`, o fluxo segue para a atualização simples.
2.  **Serviço (`progresso-atividade.service.ts`)**: O método `updateStatus` é chamado. Ele verifica se já existe um registro de progresso para o aluno e a atividade. Se não existir, um novo registro é criado. Em seguida, o status é atualizado para `Concluido`, e a `dataConclusao` é definida como a data e hora atuais.
3.  **Repositório**: A camada de repositório executa a operação de atualização no banco de dados PostgreSQL.

O sistema de cache é invalidado automaticamente para garantir que as visualizações subsequentes mostrem os dados mais recentes.

**Fontes da seção**
- [route.ts](file://app/api/progresso-atividade/atividade/[atividadeId]/route.ts#L72-L114)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts#L40-L74)

## Atualização da Interface

Após a resposta bem-sucedida da API, o estado do componente `AtividadeChecklistRow` é atualizado. A interface reflete imediatamente a conclusão da atividade:

*   O ícone do checkbox muda de um círculo vazio para um ícone de círculo com uma marca de verificação verde (`CheckCircle2`).
*   Um badge com o texto "Concluido" é exibido ao lado do título da atividade, com uma cor de fundo verde.
*   A data de conclusão é exibida na linha abaixo do título.
*   O estado do componente é atualizado para refletir o novo status, evitando ações duplicadas durante o processamento.

Esse feedback visual imediato é crucial para a experiência do usuário, confirmando que a ação foi registrada com sucesso.

**Fontes da seção**
- [atividade-checklist-row.tsx](file://components/atividade-checklist-row.tsx#L143-L157)

## Exemplo de Requisição e Resposta

### Requisição (Check Simples)

```http
PATCH /api/progresso-atividade/atividade/cb8a7d9e-1f2a-4c3b-8d4e-5f6a7b8c9d0e
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

{
  "status": "Concluido"
}
```

### Resposta

```json
{
  "data": {
    "id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
    "alunoId": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
    "atividadeId": "cb8a7d9e-1f2a-4c3b-8d4e-5f6a7b8c9d0e",
    "status": "Concluido",
    "dataInicio": "2025-04-10T08:30:00Z",
    "dataConclusao": "2025-04-10T09:15:00Z",
    "questoesTotais": null,
    "questoesAcertos": null,
    "dificuldadePercebida": null,
    "anotacoesPessoais": null,
    "createdAt": "2025-04-10T08:30:00Z",
    "updatedAt": "2025-04-10T09:15:00Z"
  }
}
```

## Integração com a Sala de Estudos

O fluxo de Check Simples está totalmente integrado à visualização da **Sala de Estudos**. O componente `sala-estudos-client.tsx` é responsável por buscar todas as atividades do aluno, juntamente com seu progresso, e agrupá-las em uma estrutura hierárquica (Curso > Disciplina > Frente > Módulo).

Após a conclusão de uma atividade, a atualização do progresso no backend é refletida na próxima busca de dados. O componente `sala-estudos-client.tsx` realiza uma nova consulta (ou utiliza dados em cache atualizados) para exibir a lista de atividades com os status mais recentes. Isso garante que as estatísticas de progresso, como o número de atividades concluídas, sejam sempre precisas e atualizadas em tempo real.

**Fontes da seção**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L285-L707)
- [types.ts](file://app/(dashboard)/aluno/sala-de-estudos/types.ts#L4-L33)