# Sala de Estudos

<cite>
**Arquivos Referenciados neste Documento**  
- [page.tsx](file://app/(dashboard)/aluno/sala-de-estudos/page.tsx)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [sala-estudos-filters.tsx](file://components/sala-estudos-filters.tsx)
- [module-accordion.tsx](file://components/module-accordion.tsx)
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx)
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)
- [progresso-atividade.types.ts](file://backend/services/progresso-atividade/progresso-atividade.types.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Componentes Principais](#componentes-principais)
4. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
5. [Análise Detalhada dos Componentes](#análise-detalhada-dos-componentes)
6. [Análise de Dependências](#análise-de-dependências)
7. [Considerações de Desempenho](#considerações-de-desempenho)
8. [Guia de Solução de Problemas](#guia-de-solução-de-problemas)
9. [Conclusão](#conclusão)

## Introdução
A funcionalidade **Sala de Estudos** é um componente central da aplicação voltado para o acompanhamento do progresso acadêmico dos alunos. Ela permite visualizar, organizar e interagir com atividades educacionais em uma estrutura hierárquica clara: **Curso > Disciplina > Frente > Módulo**. O sistema recupera dados via API, processa informações de progresso e exibe uma interface interativa com filtros dinâmicos, estatísticas de conclusão e mecanismos de cache para otimização de desempenho. Este documento detalha a arquitetura, o fluxo de dados, as regras de negócio e as melhores práticas para personalização e extensão da funcionalidade.

## Estrutura do Projeto
A funcionalidade Sala de Estudos está organizada em uma estrutura modular que separa claramente a lógica de apresentação, os componentes reutilizáveis e os serviços de backend. A navegação é baseada em rotas do Next.js, com autenticação obrigatória para acesso.

```mermaid
graph TB
subgraph "Frontend"
A[page.tsx] --> B[sala-estudos-client.tsx]
B --> C[sala-estudos-filters.tsx]
B --> D[modulo-activities-accordion.tsx]
D --> E[atividade-checklist-row.tsx]
B --> F[progresso-stats-card.tsx]
end
subgraph "Backend"
G[/api/atividade/aluno/[alunoId]\] --> H[atividade.service.ts]
H --> I[activity-cache.service.ts]
G --> J[progresso-atividade.service.ts]
end
A --> |Autenticação| K[requireUser]
B --> |Estado| L[React State]
C --> |Filtros| M[React.useMemo]
D --> |Progresso| N[handleStatusChange]
```

**Fontes do Diagrama**
- [page.tsx](file://app/(dashboard)/aluno/sala-de-estudos/page.tsx)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [sala-estudos-filters.tsx](file://components/sala-estudos-filters.tsx)
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx)
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)

**Fontes da Seção**
- [page.tsx](file://app/(dashboard)/aluno/sala-de-estudos/page.tsx)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)

## Componentes Principais
Os componentes principais da Sala de Estudos são responsáveis pela renderização da interface, gerenciamento de estado e interação com o usuário. Eles incluem o cliente principal, os filtros hierárquicos e os acordeões de módulos.

**Fontes da Seção**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [sala-estudos-filters.tsx](file://components/sala-estudos-filters.tsx)
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx)

## Visão Geral da Arquitetura
A arquitetura da Sala de Estudos é baseada em um fluxo de dados unidirecional, onde o componente principal coordena a busca de dados, o processamento e a renderização. A autenticação é verificada no servidor, e os dados são carregados no cliente com base no `alunoId`.

```mermaid
sequenceDiagram
participant Aluno
participant Page as page.tsx
participant Client as sala-estudos-client.tsx
participant API as /api/atividade/aluno/[alunoId]
participant Cache as activity-cache.service
participant DB as Banco de Dados
Aluno->>Page : Acessa /aluno/sala-de-estudos
Page->>Page : requireUser() (Autenticação)
Page->>Client : Renderiza componente cliente
Client->>Client : Busca alunoId e role
Client->>Client : Carrega cursos (baseado em role)
Client->>API : GET /api/atividade/aluno/[alunoId]
API->>Cache : getActivitiesByModulo() (Cache Redis)
alt Cache Hit
Cache-->>API : Dados da atividade (sem progresso)
else Cache Miss
Cache->>DB : SELECT * FROM atividades
DB-->>Cache : Dados brutos
Cache-->>API : Dados cacheados
end
API->>API : Junta com progresso do aluno
API-->>Client : Atividades com progresso
Client->>Client : Agrupa em estrutura hierárquica
Client->>Client : Calcula estatísticas
Client-->>Aluno : Renderiza interface com filtros e acordeões
```

**Fontes do Diagrama**
- [page.tsx](file://app/(dashboard)/aluno/sala-de-estudos/page.tsx#L4-L8)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L75-L707)
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts#L43-L51)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)

## Análise Detalhada dos Componentes

### Análise do Componente Sala de Estudos
O componente principal `sala-estudos-client.tsx` é responsável por coordenar todo o fluxo de dados e interação. Ele gerencia o estado do usuário, carrega cursos, disciplinas e frentes, e busca todas as atividades associadas ao aluno.

```mermaid
classDiagram
class SalaEstudosClientPage {
+atividades : AtividadeComProgresso[]
+cursos : Curso[]
+disciplinas : Disciplina[]
+frentes : Frente[]
+cursoSelecionado : string
+disciplinaSelecionada : string
+frenteSelecionada : string
+alunoId : string | null
+userRole : string | null
+isLoading : boolean
+error : string | null
+estruturaHierarquica : CursoComDisciplinas[]
+fetchUser() : Promise~void~
+fetchCursos() : Promise~void~
+fetchDisciplinasEFrentes() : Promise~void~
+fetchAtividades() : Promise~void~
+handleStatusChange() : Promise~void~
+handleStatusChangeWithDesempenho() : Promise~void~
}
class AtividadeComProgresso {
+id : string
+moduloId : string
+tipo : string
+titulo : string
+moduloNome : string
+frenteNome : string
+disciplinaNome : string
+cursoNome : string
+progressoStatus : StatusAtividade
+questoesTotais : number | null
+questoesAcertos : number | null
+dificuldadePercebida : DificuldadePercebida | null
}
class CursoComDisciplinas {
+id : string
+nome : string
+disciplinas : DisciplinaComFrentes[]
}
class DisciplinaComFrentes {
+id : string
+nome : string
+frentes : FrenteComModulos[]
}
class FrenteComModulos {
+id : string
+nome : string
+modulos : ModuloComAtividades[]
}
class ModuloComAtividades {
+id : string
+nome : string
+atividades : AtividadeComProgresso[]
}
SalaEstudosClientPage --> AtividadeComProgresso : "possui"
SalaEstudosClientPage --> CursoComDisciplinas : "agrupa"
CursoComDisciplinas --> DisciplinaComFrentes : "contém"
DisciplinaComFrentes --> FrenteComModulos : "contém"
FrenteComModulos --> ModuloComAtividades : "contém"
ModuloComAtividades --> AtividadeComProgresso : "contém"
```

**Fontes do Diagrama**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L57-L73)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L12-L17)

### Análise do Componente de Filtros
O componente `sala-estudos-filters.tsx` fornece uma interface para filtrar atividades por curso, disciplina e frente. Ele é controlado pelo componente principal e atualiza o estado de acordo com as seleções do usuário.

```mermaid
flowchart TD
Start([Renderização do Componente]) --> ValidateInputs["Valida Props (cursos, disciplinas, frentes)"]
ValidateInputs --> RenderUI["Renderiza UI com Selects"]
RenderUI --> CursoSelect["Select de Curso"]
RenderUI --> DisciplinaSelect["Select de Disciplina"]
RenderUI --> FrenteSelect["Select de Frente"]
CursoSelect --> |onChange| UpdateCurso["Atualiza cursoSelecionado"]
UpdateCurso --> ResetOthers["Reseta disciplinaSelecionada e frenteSelecionada"]
ResetOthers --> Refetch["Força recarregamento de atividades"]
DisciplinaSelect --> |onChange| UpdateDisciplina["Atualiza disciplinaSelecionada"]
UpdateDisciplina --> ResetFrente["Reseta frenteSelecionada"]
ResetFrente --> FilterFrentes["Filtra frentes por disciplinaSelecionada (useMemo)"]
FilterFrentes --> Refetch
FrenteSelect --> |onChange| UpdateFrente["Atualiza frenteSelecionada"]
UpdateFrente --> Refetch
Refetch --> End([Estado Atualizado])
```

**Fontes do Diagrama**
- [sala-estudos-filters.tsx](file://components/sala-estudos-filters.tsx#L44-L139)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L1004-L1021)

### Análise do Componente ModuleAccordion
O componente `modulo-activities-accordion.tsx` exibe as atividades dentro de um módulo em um acordeão interativo. Ele mostra o progresso geral do módulo e permite que o aluno marque atividades como concluídas.

```mermaid
flowchart TD
A([Renderização do Módulo]) --> B["Calcula progresso: atividadesConcluidas / totalAtividades"]
B --> C["Renderiza AccordionTrigger"]
C --> D["Mostra nome do módulo e percentual de conclusão"]
D --> E["Renderiza AccordionContent"]
E --> F{Módulo tem atividades?}
F --> |Sim| G["Itera sobre atividades"]
F --> |Não| H["Mostra mensagem 'Nenhuma atividade disponível'"]
G --> I["Renderiza AtividadeChecklistRow para cada atividade"]
I --> J["Passa handlers onStatusChange e onStatusChangeWithDesempenho"]
J --> K([Interface Interativa])
```

**Fontes do Diagrama**
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx#L29-L77)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L1053-L1058)

**Fontes da Seção**
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx#L1-L78)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L1053-L1058)

## Análise de Dependências
A funcionalidade Sala de Estudos depende de vários serviços de backend e componentes de UI para funcionar corretamente. As dependências principais incluem o serviço de cache de atividades e o serviço de progresso de atividades.

```mermaid
graph LR
A[sala-estudos-client.tsx] --> B[activity-cache.service.ts]
A --> C[progresso-atividade.service.ts]
A --> D[sala-estudos-filters.tsx]
A --> E[modulo-activities-accordion.tsx]
A --> F[progresso-stats-card.tsx]
B --> G[Redis]
C --> H[Banco de Dados]
D --> I[ui/select]
E --> J[ui/accordion]
E --> K[atividade-checklist-row.tsx]
```

**Fontes do Diagrama**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)
- [sala-estudos-filters.tsx](file://components/sala-estudos-filters.tsx)
- [modulo-activities-accordion.tsx](file://components/modulo-activities-accordion.tsx)

**Fontes da Seção**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx)
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts)

## Considerações de Desempenho
A funcionalidade foi projetada para lidar com grandes volumes de dados através de estratégias de cache e otimização de consultas. O cache de atividades, baseado em Redis, armazena a estrutura das atividades por módulo com um TTL de 30 minutos, reduzindo significativamente as consultas ao banco de dados.

**Regras de Negócio para Marcação de Progresso:**
- **Check Simples**: Para atividades do tipo `Conceituario` ou `Revisao`, o aluno pode marcar como concluído com um clique, atualizando apenas o status.
- **Check Qualificado**: Para atividades como `Nivel_1`, `Nivel_2`, `Lista_Mista`, `Simulado_Diagnostico` e `Flashcards`, o aluno deve fornecer informações de desempenho (questões totais, acertos, dificuldade percebida e anotações).

**Integração com Cache:**
- O serviço `activity-cache.service.ts` é utilizado para recuperar a estrutura das atividades sem o progresso do aluno.
- O cache é invalidado automaticamente quando atividades são criadas, atualizadas ou deletadas.
- O uso de `React.useMemo` para filtragem e agrupamento evita cálculos desnecessários na renderização.

**Sincronização de Estado:**
- O estado é mantido no componente cliente usando `React.useState` e `React.useEffect`.
- Após qualquer alteração de progresso via API, o estado local é atualizado imediatamente para garantir uma interface responsiva.
- Em caso de erro de sessão, o sistema exige reautenticação.

**Acessibilidade:**
- Os componentes utilizam elementos semânticos e atributos ARIA.
- Os acordeões são totalmente navegáveis via teclado.
- As mensagens de erro são claramente exibidas com ícones e cores contrastantes.

**Fontes da Seção**
- [activity-cache.service.ts](file://backend/services/cache/activity-cache.service.ts#L43-L51)
- [progresso-atividade.service.ts](file://backend/services/progresso-atividade/progresso-atividade.service.ts#L84-L129)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L818-L935)

## Guia de Solução de Problemas
Este guia aborda problemas comuns e suas soluções.

**Problema: Erro de Autenticação ao Carregar Atividades**
- **Causa**: Sessão expirada ou token inválido.
- **Solução**: Verifique se o usuário está autenticado. O componente `sala-estudos-client.tsx` chama `supabase.auth.getSession()` antes de cada requisição.

**Problema: Atividades Não Aparecem Após Filtro**
- **Causa**: O filtro pode estar removendo todas as atividades.
- **Solução**: Verifique se os dados de `cursos`, `disciplinas` e `frentes` estão sendo carregados corretamente. O estado `estruturaFiltrada` é recalculado com `React.useMemo`.

**Problema: Progresso Não é Salvo**
- **Causa**: Erro na API ou no backend.
- **Solução**: Verifique a resposta da API `/api/progresso-atividade/atividade/[atividadeId]`. O erro é capturado e exibido no componente.

**Fontes da Seção**
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L79-L103)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L710-L726)
- [sala-estudos-client.tsx](file://app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx#L818-L868)

## Conclusão
A funcionalidade Sala de Estudos é um sistema robusto e bem estruturado que oferece uma experiência de usuário rica e informativa. Sua arquitetura modular, combinada com o uso estratégico de cache e uma clara separação de preocupações, garante desempenho e manutenibilidade. A integração com o serviço de progresso permite um acompanhamento detalhado do desempenho do aluno, enquanto os filtros e a interface hierárquica facilitam a navegação. Para personalização, recomenda-se estender os componentes de filtro ou criar novas visualizações baseadas na estrutura de dados `estruturaHierarquica`.