# Change: Add filtros hierárquicos (Curso→Disciplina→Frente→Módulo) no Dashboard

## Why
Hoje o dashboard mostra métricas úteis, mas não permite que o aluno (ou professor) aprofunde a análise por níveis do conteúdo (curso/disciplinas/frentes/módulos). Isso limita a capacidade de identificar onde o estudante está investindo mais tempo e onde está performando melhor/pior.

## What Changes
- Adiciona filtros hierárquicos nos cards de **Distribuição**, **Performance** e **Domínio Estratégico**.
- Introduz agregações por **Disciplina**, **Frente** e **Módulo** (quando aplicável).
- Inclui suporte a **tempo aproximado por módulo** (com melhor qualidade quando `sessoes_estudo.modulo_id` estiver disponível).
- **Remove/evita** filtro por “Modo” no card **Domínio Estratégico** (o nível de detalhamento passa a ser por **Módulo**, e os eixos Flashcards/Questões permanecem juntos).

## Impact
- **Banco (Supabase)**: adicionar `modulo_id` em `public.sessoes_estudo` + backfill quando houver `atividade_relacionada_id`.
- **Backend/API**: novos endpoints específicos por card para evitar inflar `/api/dashboard/analytics`.
- **Frontend**: UI com segmented control/abas e componentes de seleção (inclui seletor de módulo + ranking no Domínio Estratégico).

