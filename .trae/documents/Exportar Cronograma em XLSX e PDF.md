## Visão Geral
- Implementar exportação do cronograma em `XLSX` e `PDF` com layout organizado e visual agradável.
- Disponibilizar endpoints autenticados: `GET /api/cronograma/:id/export/xlsx` e `GET /api/cronograma/:id/export/pdf`.
- Integrar botões de exportação nas telas de cronograma: dashboard e calendário.

## Arquitetura Atual (Referências)
- Geração de cronograma: `app/api/cronograma/route.ts:113` usa `requireUserAuth` e chama serviço em `backend/services/cronograma/cronograma.service.ts:38`.
- Distribuição de dias: `app/api/cronograma/[id]/distribuicao-dias/route.ts:165` (`GET`/`PUT`) e recálculo em `cronograma.service.ts:1759`.
- UI dashboard: `app/(dashboard)/aluno/cronograma/page.tsx:84` renderiza `ScheduleDashboard`; estrutura de dados em `components/schedule-dashboard.tsx:46-89`.
- UI calendário: `app/(dashboard)/aluno/cronograma/calendario/page.tsx:96` usa `ScheduleCalendarView`; leitura de `data_prevista` em `components/schedule-calendar-view.tsx:176-183`.

## Escopo da Feature
- XLSX completo do cronograma com:
  - Guia "Resumo" (período, progresso, horas por disciplina, parâmetros).
  - Guia "Cronograma" (linhas por aula, agrupadas por data e semana, colunas ricas e estilos).
- PDF com páginas:
  - Capa e resumo.
  - Seções por data com grupos por disciplina/frente, tipografia consistente, paleta harmônica.
- Suporte a autenticação e verificação de titularidade do cronograma.

## Back-end: Endpoints de Exportação
- Criar `app/api/cronograma/[id]/export/xlsx/route.ts` e `app/api/cronograma/[id]/export/pdf/route.ts`.
- `runtime`: definir `export const runtime = 'nodejs'` para bibliotecas de geração.
- Autenticação: `requireUserAuth` e verificação se `cronograma.aluno_id === request.user.id`.
- Carregamento de dados:
  - Buscar `cronogramas` por `id` e os `cronograma_itens` ordenados.
  - Enriquecer itens com `aulas`, `modulos`, `frentes`, `disciplinas` (mesma abordagem do dashboard em `components/schedule-dashboard.tsx:171-377`).
  - Respeitar `data_prevista` gerada pelo serviço (já usada no calendário em `components/schedule-calendar-view.tsx:304-329`).

## Geração XLSX
- Biblioteca: usar `exceljs` para estilização avançada. O projeto tem `xlsx` (`package.json:71`), mas `xlsx` não oferece estilização completa; propor adicionar `exceljs` para:
  - Ajuste de larguras, fontes, cores, bordas, merge de células, freeze panes, filtros.
- Estrutura:
  - Aba "Resumo": título com merge, período (`data_inicio` → `data_fim`), progresso (% concluído), horas por disciplina, parâmetros (dias/semana, horas/dia, modalidade, velocidade).
  - Aba "Cronograma": colunas: `Data`, `Semana`, `Ordem`, `Disciplina`, `Frente`, `Módulo`, `Aula`, `Tempo Estimado`, `Concluída`, `Conclusão`.
  - Estilos:
    - Cabeçalhos com fundo e borda, congelar primeira linha e primeira coluna.
    - Linhas alternadas, cores por disciplina (hash estável do id).
    - Formatação de datas e duração (`tempo_estimado_minutos` em `xh y min`).
- Resposta: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="cronograma_<id>.xlsx"`.

## Geração PDF
- Biblioteca: `@react-pdf/renderer` para compor PDF com React, fontes e estilos consistentes.
- Layout:
  - Página de capa com título e período.
  - Página(s) de resumo com indicadores (progresso, horas por disciplina, parâmetros).
  - Páginas de conteúdo agrupando por data, com tabelas/resumos por disciplina e frente.
- Estética:
  - Paleta alinhada ao tema do app (tons `primary`, `muted`, bordas suaves).
  - Tipografia legível, hierarquia visual clara, margens e grids.
- Resposta: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="cronograma_<id>.pdf"`.

## Front-end: Integração
- `components/schedule-dashboard.tsx:737-741` — habilitar botão "Exportar PDF" e adicionar "Exportar XLSX".
  - Implementar `onClick` que obtém `access_token` do Supabase e faz `fetch` para `GET /api/cronograma/:id/export/{pdf|xlsx}` com `Authorization: Bearer ...`, então baixa o arquivo.
- `components/schedule-calendar-view.tsx` — opcional: adicionar exportação do período selecionado.
  - Se aprovado, aceitar `query` `from=YYYY-MM-DD&to=YYYY-MM-DD` nos endpoints para filtrar.

## Segurança e Conformidade
- Autenticação obrigatória (`requireUserAuth`).
- Verificação de titularidade: o `id` do cronograma deve pertencer ao usuário atual.
- Sanitização de parâmetros (range opcional), limites de tamanho de response (stream/chunk se necessário).

## Performance
- Consultas em lotes (IDs de aulas) como já feito no dashboard (`components/schedule-dashboard.tsx:183-225`).
- Evitar joins profundos repetidos; uso de mapas (`modulosMap`, `frentesMap`, `disciplinasMap`).
- Em XLSX, escrever em streaming se o volume for alto; em PDF, paginar o conteúdo.

## Testes e Verificação
- Manual/E2E:
  - Criar cronograma e acionar export via UI no dashboard.
  - Conferir planilha: cabeçalhos, estilos, agrupamentos, dados corretos.
  - Conferir PDF: páginas, fontes, cores, agrupamentos por data.
- Unitários (opcional): funções de mapeamento/formatadores (tempo, cores por disciplina, formatação de datas).

## Entregáveis
- Novos endpoints: `GET /api/cronograma/:id/export/xlsx` e `GET /api/cronograma/:id/export/pdf`.
- Botões funcionais no dashboard; opcionalmente no calendário.
- Documentação breve no README interno (como usar/exportar, parâmetros opcionais).

## Dependências a Adicionar
- `exceljs` para estilização avançada do XLSX.
- `@react-pdf/renderer` para geração de PDF com layout controlado.

Confirma seguir com esta implementação, adicionando as dependências e conectando os botões de exportação?