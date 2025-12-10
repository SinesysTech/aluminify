# Entidade ProgressoAtividade

<cite>
**Arquivos Referenciados neste Documento**   
- [progresso-atividade.types.ts](file://backend/services/progresso-atividade/progresso-atividade.types.ts)
- [progresso-atividade.repository.ts](file://backend/services/progresso-atividade/progresso-atividade.repository.ts)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)
- [route.ts](file://app/api/progresso-atividade/atividade/[atividadeId]/route.ts)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)
- [CHECKLIST_FINAL_SALA_ESTUDOS.md](file://docs/CHECKLIST_FINAL_SALA_ESTUDOS.md)
- [IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md)
- [IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md)
- [PLANO_CHECK_QUALIFICADO.md](file://docs/PLANO_CHECK_QUALIFICADO.md)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Campos da Entidade](#campos-da-entidade)
3. [Relações com Outras Entidades](#relações-com-outras-entidades)
4. [Uso do Campo Desempenho](#uso-do-campo-desempenho)
5. [Exemplos de Dados](#exemplos-de-dados)
6. [Atualização via API](#atualização-via-api)
7. [Políticas RLS](#políticas-rls)

## Introdução

A entidade `ProgressoAtividade` é fundamental para o rastreamento do checklist de estudo do aluno por atividade no sistema. Ela armazena o estado de progresso de cada atividade realizada por um aluno, permitindo um acompanhamento detalhado do desempenho acadêmico. A entidade foi projetada para suportar tanto o registro simples de conclusão quanto o registro qualificado com métricas detalhadas, atendendo às necessidades de diferentes tipos de atividades.

A implementação completa da entidade foi verificada e documentada em múltiplos arquivos do projeto, garantindo que todos os aspectos funcionais e de segurança estejam corretamente configurados. O sistema permite que os alunos marquem atividades como pendentes, iniciadas ou concluídas, com a possibilidade de registrar métricas detalhadas como número de questões, acertos e dificuldade percebida.

**Seção fontes**
- [CHECKLIST_FINAL_SALA_ESTUDOS.md](file://docs/CHECKLIST_FINAL_SALA_ESTUDOS.md#L1-L153)

## Campos da Entidade

A entidade `ProgressoAtividade` possui os seguintes campos:

- **id**: Identificador único do registro de progresso (UUID)
- **aluno_id**: Chave estrangeira que referencia o aluno proprietário do progresso (UUID)
- **atividade_id**: Chave estrangeira que referencia a atividade associada ao progresso (UUID)
- **status**: Enum que representa o estado atual da atividade, com valores possíveis: "Pendente", "Iniciado", "Concluido"
- **data_inicio**: Data e hora em que o aluno iniciou a atividade
- **data_conclusao**: Data e hora em que o aluno concluiu a atividade
- **desempenho**: Campo opcional que armazena a avaliação de desempenho do aluno (1-5), embora a documentação mostre campos mais detalhados como `questoesTotais` e `dificuldadePercebida`
- **created_at**: Timestamp de criação do registro
- **updated_at**: Timestamp da última atualização do registro

Os campos `questoesTotais`, `questoesAcertos`, `dificuldadePercebida` e `anotacoesPessoais` foram adicionados para suportar o "Check Qualificado", permitindo um registro mais detalhado do desempenho do aluno em atividades que exigem essa abordagem.

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql#L75-L103)
- [progresso-atividade.types.ts](file://backend/services/progresso-atividade/progresso-atividade.types.ts#L10-L23)

## Relações com Outras Entidades

A entidade `ProgressoAtividade` estabelece relações importantes com outras entidades do sistema:

- **Relação com Aluno**: Através do campo `aluno_id`, que é uma chave estrangeira referenciando a tabela `alunos`. Esta relação garante que cada registro de progresso esteja vinculado a um aluno específico.
- **Relação com Atividade**: Através do campo `atividade_id`, que é uma chave estrangeira referenciando a tabela `atividades`. Esta relação vincula o progresso a uma atividade específica.

Essas relações são fundamentais para o funcionamento do sistema, pois permitem agrupar e filtrar os dados de progresso por aluno e por atividade. A combinação de `aluno_id` e `atividade_id` é única, garantindo que não existam registros duplicados de progresso para a mesma atividade e mesmo aluno.

As políticas de segurança (RLS) estão configuradas para garantir que apenas o aluno proprietário do progresso possa visualizar e modificar seus registros, reforçando a integridade e privacidade dos dados.

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql#L79-L82)
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql#L8-L21)

## Uso do Campo Desempenho

O campo `desempenho` (e campos relacionados) desempenha um papel crucial nas funcionalidades de "Check Qualificado" do sistema. Embora o campo `desempenho` seja mencionado como uma avaliação de 1-5, a implementação real utiliza campos mais detalhados para capturar métricas específicas:

- **questoesTotais**: Número total de questões na atividade
- **questoesAcertos**: Número de questões acertadas pelo aluno
- **dificuldadePercebida**: Avaliação subjetiva da dificuldade da atividade pelo aluno
- **anotacoesPessoais**: Anotações opcionais feitas pelo aluno sobre a atividade

Esses campos são utilizados em diferentes cenários:

- **Check Simples**: Para atividades do tipo "Conceituario" e "Revisao", o sistema permite a conclusão direta sem a necessidade de preencher métricas detalhadas.
- **Check Qualificado**: Para outros tipos de atividades (Nivel_1, Nivel_2, etc.), o sistema exige o preenchimento de métricas detalhadas através de um modal de desempenho.

O uso desses campos permite a geração de relatórios e visualizações ricas sobre o desempenho do aluno, incluindo badges com resultados, cores contextuais por dificuldade e ícones de anotações. Essas informações são valiosas tanto para o aluno quanto para professores e tutores no acompanhamento do processo de aprendizagem.

**Seção fontes**
- [IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md#L1-L286)
- [IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md#L1-L375)
- [PLANO_CHECK_QUALIFICADO.md](file://docs/PLANO_CHECK_QUALIFICADO.md#L1-L602)

## Exemplos de Dados

Abaixo estão exemplos de dados para a entidade `ProgressoAtividade` em diferentes cenários:

**Exemplo 1: Atividade Concluída com Check Qualificado**
```json
{
  "id": "uuid-1",
  "alunoId": "aluno-123",
  "atividadeId": "ativ-456",
  "status": "Concluido",
  "dataInicio": "2025-01-30T10:00:00Z",
  "dataConclusao": "2025-01-31T10:30:00Z",
  "questoesTotais": 10,
  "questoesAcertos": 8,
  "dificuldadePercebida": "Medio",
  "anotacoesPessoais": "Preciso revisar a teoria sobre...",
  "createdAt": "2025-01-30T10:00:00Z",
  "updatedAt": "2025-01-31T10:30:00Z"
}
```

**Exemplo 2: Atividade Iniciada**
```json
{
  "id": "uuid-2",
  "alunoId": "aluno-123",
  "atividadeId": "ativ-789",
  "status": "Iniciado",
  "dataInicio": "2025-01-31T14:00:00Z",
  "dataConclusao": null,
  "questoesTotais": 0,
  "questoesAcertos": 0,
  "dificuldadePercebida": null,
  "anotacoesPessoais": null,
  "createdAt": "2025-01-31T14:00:00Z",
  "updatedAt": "2025-01-31T14:00:00Z"
}
```

**Exemplo 3: Atividade Pendente**
```json
{
  "id": "uuid-3",
  "alunoId": "aluno-123",
  "atividadeId": "ativ-012",
  "status": "Pendente",
  "dataInicio": null,
  "dataConclusao": null,
  "questoesTotais": 0,
  "questoesAcertos": 0,
  "dificuldadePercebida": null,
  "anotacoesPessoais": null,
  "createdAt": "2025-01-29T09:00:00Z",
  "updatedAt": "2025-01-29T09:00:00Z"
}
```

Esses exemplos ilustram os diferentes estados possíveis da entidade e como os campos são preenchidos conforme o progresso do aluno na atividade.

**Seção fontes**
- [IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_BACKEND_CHECK_QUALIFICADO.md#L217-L235)
- [IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md](file://docs/IMPLEMENTACAO_FRONTEND_CHECK_QUALIFICADO.md#L234-L252)

## Atualização via API

A entidade `ProgressoAtividade` pode ser atualizada através da API do sistema, utilizando endpoints específicos para diferentes cenários:

**Endpoint para Atualização de Status**
```
PATCH /api/progresso-atividade/atividade/{atividadeId}
```

**Exemplo 1: Atualização Simples de Status**
```http
PATCH /api/progresso-atividade/atividade/ativ-456
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "Concluido"
}
```

**Exemplo 2: Atualização com Dados de Desempenho (Check Qualificado)**
```http
PATCH /api/progresso-atividade/atividade/ativ-456
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "Concluido",
  "desempenho": {
    "questoesTotais": 10,
    "questoesAcertos": 8,
    "dificuldadePercebida": "Medio",
    "anotacoesPessoais": "Preciso revisar..."
  }
}
```

**Exemplo 3: Atualização para Status Iniciado**
```http
PATCH /api/progresso-atividade/atividade/ativ-789
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "Iniciado"
}
```

A API valida automaticamente os dados recebidos, garantindo que:
- O aluno só pode atualizar seu próprio progresso
- Atividades que requerem desempenho não podem ser concluídas sem os dados necessários
- Os valores numéricos estão dentro dos limites permitidos
- As datas de conclusão são posteriores às datas de início

O serviço backend `progressoAtividadeService` processa essas requisições, aplicando as regras de negócio apropriadas e retornando o registro atualizado.

**Seção fontes**
- [route.ts](file://app/api/progresso-atividade/atividade/[atividadeId]/route.ts#L51-L125)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts#L40-L83)

## Políticas RLS

As políticas de segurança em nível de linha (RLS - Row Level Security) são essenciais para garantir que apenas o aluno proprietário do progresso possa visualizar e modificar seus registros. As políticas configuradas para a tabela `progresso_atividades` são:

- **Política de Seleção**: "Aluno vê seu progresso" - Permite que um aluno selecione apenas registros onde `auth.uid() = aluno_id`
- **Política de Inserção**: "Aluno atualiza seu progresso" - Permite que um aluno insira registros apenas quando `auth.uid() = aluno_id`
- **Política de Atualização**: "Aluno edita seu progresso" - Permite que um aluno atualize registros apenas quando `auth.uid() = aluno_id`

Essas políticas são definidas na migração de banco de dados e garantem que:
- Cada aluno só possa acessar seus próprios dados de progresso
- Não seja possível visualizar ou modificar o progresso de outros alunos
- A integridade dos dados seja mantida mesmo em caso de tentativas de acesso não autorizado

A implementação dessas políticas foi verificada e documentada como parte da implementação completa do sistema, garantindo que o acesso aos dados de progresso seja seguro e restrito ao proprietário dos dados.

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql#L135-L139)
- [CHECKLIST_FINAL_SALA_ESTUDOS.md](file://docs/CHECKLIST_FINAL_SALA_ESTUDOS.md#L81-L84)