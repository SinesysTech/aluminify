# Cronogramas e Agendamentos

<cite>
**Arquivos Referenciados neste Documento**  
- [cronograma.service.ts](file://backend/services/cronograma/cronograma.service.ts)
- [cronograma.types.ts](file://backend/services/cronograma/cronograma.types.ts)
- [errors.ts](file://backend/services/cronograma/errors.ts)
- [route.ts](file://app/api/cronograma/route.ts)
- [distribuicao-dias/route.ts](file://app/api/cronograma/[id]/distribuicao-dias/route.ts)
- [ical/route.ts](file://app/api/agendamentos/[id]/ical/route.ts)
- [cronograma-export-utils.ts](file://lib/cronograma-export-utils.ts)
- [agendamento-validations.ts](file://lib/agendamento-validations.ts)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql)
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Endpoints de Cronogramas](#endpoints-de-cronogramas)
   - [Criação de Cronograma (POST /api/cronograma)](#criação-de-cronograma-post-apicronograma)
   - [Obtenção de Cronograma (GET /api/cronograma/{id})](#obtenção-de-cronograma-get-apicronogramaid)
   - [Atualização da Distribuição de Dias (PUT /api/cronograma/{id}/distribuicao-dias)](#atualização-da-distribuição-de-dias-put-apicronogramaiddistribuicao-dias)
3. [Endpoint de Exportação iCal (GET /api/agendamentos/{id}/ical)](#endpoint-de-exportação-ical-get-apiagendamentosidical)
4. [Regras de Negócio e Validações](#regras-de-negócio-e-validações)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Considerações Finais](#considerações-finais)

## Introdução

Este documento fornece uma documentação completa dos endpoints relacionados a cronogramas e agendamentos no sistema Área do Aluno. Os endpoints cobertos incluem a criação, obtenção e atualização de cronogramas de estudo, além da exportação de agendamentos em formato iCal. O foco está em detalhar os parâmetros, regras de negócio, esquemas de resposta, validações e exemplos de uso para garantir uma integração clara e eficiente com o sistema.

**Seção fontes**
- [cronograma.service.ts](file://backend/services/cronograma/cronograma.service.ts#L50-L258)
- [cronograma.types.ts](file://backend/services/cronograma/cronograma.types.ts#L6-L22)

## Endpoints de Cronogramas

### Criação de Cronograma (POST /api/cronograma)

O endpoint `POST /api/cronograma` é responsável por criar um novo cronograma de estudo personalizado para um aluno. Ele valida os dados de entrada, verifica a viabilidade do plano com base na disponibilidade de tempo e nas aulas selecionadas, e persiste o cronograma no banco de dados.

#### Parâmetros da Requisição

A requisição espera um corpo JSON com os seguintes campos:

| Parâmetro | Tipo | Obrigatório | Descrição |
|---------|------|-----------|-----------|
| `aluno_id` | string | Sim | ID do aluno para o qual o cronograma está sendo criado. Deve corresponder ao usuário autenticado. |
| `data_inicio` | string (ISO 8601) | Sim | Data de início do cronograma (ex: "2025-01-01"). |
| `data_fim` | string (ISO 8601) | Sim | Data de término do cronograma (ex: "2025-12-31"). |
| `ferias` | Array<{inicio: string, fim: string}> | Não | Lista de períodos de férias onde não haverá estudo. |
| `horas_dia` | number | Sim | Número de horas disponíveis para estudo por dia útil. |
| `dias_semana` | number | Sim | Número de dias por semana disponíveis para estudo (ex: 5). |
| `prioridade_minima` | number | Não | Nível de prioridade mínimo (1-5) para incluir aulas no cronograma. Padrão é 1. |
| `disciplinas_ids` | string[] | Sim | Lista de IDs das disciplinas a serem incluídas no cronograma. |
| `modalidade` | 'paralelo' \| 'sequencial' | Sim | Modalidade de estudo: 'paralelo' (várias frentes simultaneamente) ou 'sequencial' (uma frente por vez). |
| `curso_alvo_id` | string | Não | ID opcional do curso alvo, usado para filtrar aulas e módulos específicos. |
| `nome` | string | Não | Nome personalizado para o cronograma. Padrão é "Meu Cronograma". |
| `ordem_frentes_preferencia` | string[] | Não | Lista de IDs de frentes em ordem de preferência, usada apenas no modo sequencial. |
| `modulos_ids` | string[] | Não | Lista de IDs de módulos específicos a serem incluídos. Se não fornecida, todos os módulos das disciplinas são considerados. |
| `excluir_aulas_concluidas` | boolean | Não | Se `true`, exclui aulas já marcadas como concluídas. Padrão é `true`. |
| `velocidade_reproducao` | number | Não | Fator de velocidade de reprodução das aulas (ex: 1.0, 1.5). Afeta o cálculo do tempo necessário. |

#### Fluxo de Processamento

1.  **Validação de Autenticação e Autorização**: Verifica se o `aluno_id` fornecido corresponde ao usuário autenticado.
2.  **Validação de Dados Básicos**: Confirma que campos obrigatórios (`aluno_id`, `data_inicio`, `data_fim`) estão presentes e que as datas são válidas.
3.  **Criação do Registro do Aluno**: Se o aluno não existir no banco de dados, um registro básico é criado.
4.  **Exclusão de Cronograma Anterior**: Qualquer cronograma anterior do aluno é deletado para garantir um plano único ativo.
5.  **Busca de Aulas Concluídas**: Se `excluir_aulas_concluidas` for `true`, as aulas já concluídas pelo aluno são identificadas.
6.  **Cálculo de Capacidade**: Determina o tempo total disponível para estudo, descontando os períodos de férias.
7.  **Busca e Filtragem de Aulas**: Busca todas as aulas relevantes com base nas disciplinas, curso alvo, prioridade mínima e módulos selecionados. Aulas concluídas são filtradas se necessário.
8.  **Cálculo de Custo Real**: Calcula o tempo necessário para cada aula, ajustado pela `velocidade_reproducao` e multiplicado por um fator (1.5x) para incluir tempo de estudo e anotações.
9.  **Verificação de Viabilidade**: Compara o tempo total necessário com a capacidade disponível. Se o tempo for insuficiente, um erro específico é retornado.
10. **Distribuição de Aulas**: Aplica o algoritmo de distribuição com base na modalidade escolhida (`paralelo` ou `sequencial`).
11. **Persistência**: Salva o cronograma e seus itens no banco de dados.

#### Esquema de Resposta

Em caso de sucesso, o endpoint retorna um objeto com `success: true`, o cronograma gerado e estatísticas.

```json
{
  "success": true,
  "cronograma": {
    "id": "uuid",
    "aluno_id": "uuid",
    "curso_alvo_id": "uuid | null",
    "nome": "string",
    "data_inicio": "string",
    "data_fim": "string",
    "dias_estudo_semana": number,
    "horas_estudo_dia": number,
    "periodos_ferias": [{"inicio": "string", "fim": "string"}],
    "prioridade_minima": number,
    "modalidade_estudo": "paralelo" | "sequencial",
    "disciplinas_selecionadas": ["string"],
    "ordem_frentes_preferencia": ["string"] | null,
    "modulos_selecionados": ["string"] | null,
    "excluir_aulas_concluidas": boolean,
    "velocidade_reproducao": number,
    "created_at": "string",
    "updated_at": "string"
  },
  "estatisticas": {
    "total_aulas": number,
    "total_semanas": number,
    "semanas_uteis": number,
    "capacidade_total_minutos": number,
    "custo_total_minutos": number,
    "frentes_distribuidas": number
  }
}
```

**Seção fontes**
- [cronograma.service.ts](file://backend/services/cronograma/cronograma.service.ts#L50-L258)
- [cronograma.types.ts](file://backend/services/cronograma/cronograma.types.ts#L6-L22)
- [route.ts](file://app/api/cronograma/route.ts#L52-L113)

### Obtenção de Cronograma (GET /api/cronograma/{id})

Este endpoint retorna os detalhes de um cronograma específico, incluindo sua configuração e estatísticas. Embora o código fornecido não mostre a implementação do `GET`, a estrutura do serviço e o banco de dados indicam que é possível obter um cronograma pelo seu ID.

**Seção fontes**
- [cronograma.types.ts](file://backend/services/cronograma/cronograma.types.ts#L74-L93)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql#L8-L35)

### Atualização da Distribuição de Dias (PUT /api/cronograma/{id}/distribuicao-dias)

O endpoint `PUT /api/cronograma/{id}/distribuicao-dias` permite ao aluno atualizar os dias da semana em que pretende estudar, recalculando automaticamente as datas previstas para cada aula.

#### Parâmetros da Requisição

A requisição espera um corpo JSON com os seguintes campos:

| Parâmetro | Tipo | Obrigatório | Descrição |
|---------|------|-----------|-----------|
| `dias_semana` | number[] | Sim | Array de números (0-6) representando os dias da semana em que o aluno estudará (0 = Domingo, 1 = Segunda, ..., 6 = Sábado). |

#### Fluxo de Processamento

1.  **Autenticação e Autorização**: Verifica se o usuário autenticado é o dono do cronograma.
2.  **Validação de Entrada**: Confirma que `dias_semana` é um array válido.
3.  **Atualização da Configuração**: Atualiza a configuração de dias de estudo no cronograma.
4.  **Recálculo de Datas**: Recalcula as datas previstas (`data_prevista`) para todos os itens do cronograma com base na nova distribuição de dias.
5.  **Retorno**: Retorna a nova configuração de distribuição.

#### Esquema de Resposta

```json
{
  "success": true,
  "distribuicao": {
    "id": "string",
    "cronograma_id": "string",
    "dias_semana": [number],
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**Seção fontes**
- [distribuicao-dias/route.ts](file://app/api/cronograma/[id]/distribuicao-dias/route.ts#L91-L167)
- [cronograma.types.ts](file://backend/services/cronograma/cronograma.types.ts#L116-L119)

## Endpoint de Exportação iCal (GET /api/agendamentos/{id}/ical)

O endpoint `GET /api/agendamentos/{id}/ical` gera e retorna um arquivo de calendário (ICS) para um agendamento específico, permitindo que o usuário o importe em seu calendário pessoal (Google Calendar, Outlook, etc.).

### Funcionamento

1.  **Autenticação e Autorização**: O usuário deve estar autenticado. Ele só pode acessar o arquivo ICS se for o aluno ou o professor envolvido no agendamento.
2.  **Busca do Agendamento**: O sistema busca os detalhes do agendamento, incluindo as informações do professor e do aluno.
3.  **Geração do Evento iCal**: Usa a biblioteca `ical-generator` para criar um evento com:
    *   **Título (summary)**: "Mentoria com [Nome do Professor]" (para o aluno) ou "Mentoria - [Nome do Aluno]" (para o professor).
    *   **Descrição (description)**: Inclui o nome da outra parte, status do agendamento, observações e o link da reunião.
    *   **Localização (location)**: O link da reunião ou "Área do Aluno".
    *   **Data e Hora**: Baseadas nos campos `data_inicio` e `data_fim`.
4.  **Download**: O arquivo ICS é retornado como uma resposta HTTP com o cabeçalho `Content-Disposition` configurado para download.

### Formato iCal Gerado

O arquivo gerado segue o padrão iCalendar (RFC 5545). Um exemplo de conteúdo gerado é:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Área do Aluno//Agendamentos//PT
NAME:Agendamento de Mentoria
TIMEZONE:America/Sao_Paulo
BEGIN:VEVENT
UID:...
DTSTAMP:...
DTSTART:20250120T140000
DTEND:20250120T150000
SUMMARY:Mentoria com Dr. Silva
DESCRIPTION:Professor: Dr. Silva\\nStatus: confirmado\\nObservações: Discussão sobre plano de estudos\\nLink da reunião: https://meet.example.com/abc123
LOCATION:https://meet.example.com/abc123
URL:https://meet.example.com/abc123
CATEGORIES:Mentoria
END:VEVENT
END:VCALENDAR
```

**Seção fontes**
- [ical/route.ts](file://app/api/agendamentos/[id]/ical/route.ts#L8-L128)
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql#L11-L22)

## Regras de Negócio e Validações

O sistema implementa várias regras de negócio para garantir a integridade e viabilidade dos cronogramas:

*   **Prioridade Mínima**: Aulas com nível de prioridade inferior ao especificado em `prioridade_minima` são excluídas do cronograma. Isso permite ao aluno focar em conteúdos mais importantes.
*   **Exclusão de Aulas Concluídas**: Por padrão, aulas já marcadas como concluídas são automaticamente removidas do novo cronograma, evitando redundância.
*   **Modalidade de Estudo**:
    *   **Paralelo**: O algoritmo distribui aulas de várias frentes/diferentes disciplinas ao longo das semanas, promovendo uma abordagem equilibrada.
    *   **Sequencial**: O algoritmo tenta completar uma frente (ou módulo) antes de avançar para a próxima, seguindo a ordem definida em `ordem_frentes_preferencia`.
*   **Viabilidade de Tempo**: O sistema calcula rigorosamente o tempo total necessário (`custo_total_minutos`) e compara com o tempo disponível (`capacidade_total_minutos`). Se o tempo for insuficiente, um erro `CronogramaTempoInsuficienteError` é retornado com detalhes sobre as horas necessárias e disponíveis.
*   **Validações de Dados**:
    *   Datas de início e fim devem ser válidas e `data_fim` deve ser posterior a `data_inicio`.
    *   O `aluno_id` na requisição deve corresponder ao usuário autenticado.
    *   As aulas selecionadas devem pertencer às disciplinas e ao curso alvo especificados.

**Seção fontes**
- [cronograma.service.ts](file://backend/services/cronograma/cronograma.service.ts#L66-L208)
- [errors.ts](file://backend/services/cronograma/errors.ts#L1-L20)

## Exemplos de Uso

### Exemplo 1: Criação de um Cronograma (curl)

```bash
curl -X POST https://api.areadoaluno.com/api/cronograma \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "aluno_id": "auth0|1234567890",
    "nome": "Plano de Estudos OAB",
    "data_inicio": "2025-02-01",
    "data_fim": "2025-06-30",
    "ferias": [
      {"inicio": "2025-04-18", "fim": "2025-04-21"}
    ],
    "horas_dia": 3,
    "dias_semana": 6,
    "prioridade_minima": 3,
    "disciplinas_ids": ["disc1", "disc2", "disc3"],
    "modalidade": "paralelo",
    "curso_alvo_id": "curso_oab_2025",
    "modulos_ids": ["modulo1", "modulo2"],
    "excluir_aulas_concluidas": true,
    "velocidade_reproducao": 1.25
  }'
```

### Exemplo 2: Atualização da Distribuição de Dias (Frontend - JavaScript)

```javascript
async function atualizarDiasEstudo(cronogramaId, novosDias) {
  const response = await fetch(`/api/cronograma/${cronogramaId}/distribuicao-dias`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      dias_semana: novosDias // ex: [1, 2, 3, 4, 5] para segunda a sexta
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  console.log('Distribuição de dias atualizada:', data.distribuicao);
}
```

### Exemplo 3: Exportação de Agendamento para iCal

Para exportar um agendamento, o usuário pode simplesmente acessar a URL diretamente no navegador ou fazer uma requisição GET:

```bash
curl -X GET https://api.areadoaluno.com/api/agendamentos/abc123-xyz456/ical \
  -H "Authorization: Bearer <seu_token>" \
  --output "mentoria.ics"
```

## Tratamento de Erros

O sistema utiliza classes de erro personalizadas para fornecer feedback claro ao cliente.

| Código de Status HTTP | Tipo de Erro | Mensagem de Exemplo | Causa Provável |
|----------------------|------------|-------------------|--------------|
| `400` | `CronogramaValidationError` | "Campos obrigatórios: aluno_id, data_inicio, data_fim" | Dados de entrada inválidos ou ausentes. |
| `400` | `CronogramaTempoInsuficienteError` | "Tempo insuficiente" | O tempo necessário para as aulas excede o tempo disponível. Detalhes incluem `horas_necessarias` e `horas_disponiveis`. |
| `401` | - | "Unauthorized" | Token de autenticação ausente ou inválido. |
| `403` | - | "Forbidden" | O usuário não tem permissão para acessar o recurso (ex: tentar acessar um agendamento de outro usuário). |
| `404` | - | "Agendamento não encontrado" | O recurso com o ID fornecido não existe. |
| `409` | `CronogramaConflictError` | "Conflito de agendamento" | (Implícito) Um conflito foi detectado (ex: datas sobrepostas). |
| `500` | - | "Internal server error" | Erro inesperado no servidor. Detalhes podem ser fornecidos em ambiente de desenvolvimento. |

**Seção fontes**
- [errors.ts](file://backend/services/cronograma/errors.ts#L1-L37)
- [route.ts](file://app/api/cronograma/route.ts#L10-L49)

## Considerações Finais

Os endpoints de cronogramas e agendamentos fornecem uma base robusta para a gestão de estudos e reuniões no sistema Área do Aluno. A combinação de validações rigorosas, regras de negócio claras e respostas detalhadas permite uma experiência de usuário previsível e confiável. A funcionalidade de exportação iCal é um recurso valioso para a integração com ferramentas de calendário externas, aumentando a utilidade do sistema.