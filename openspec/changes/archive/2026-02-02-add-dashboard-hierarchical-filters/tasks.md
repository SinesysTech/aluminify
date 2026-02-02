## 1. Implementation
- [ ] 1.1 Adicionar `modulo_id` em `public.sessoes_estudo` + índices e backfill via `atividade_relacionada_id`.
- [ ] 1.2 Atualizar `/api/sessao/iniciar` para aceitar/derivar `modulo_id` (quando possível).
- [ ] 1.3 Criar endpoints de dashboard filtráveis:
  - [ ] 1.3.1 `GET /api/dashboard/subject-distribution`
  - [ ] 1.3.2 `GET /api/dashboard/performance`
  - [ ] 1.3.3 `GET /api/dashboard/strategic-domain`
- [ ] 1.4 Implementar UI de abas (Curso/Disciplina/Frente/Módulo) nos cards:
  - [ ] 1.4.1 Distribuição
  - [ ] 1.4.2 Performance
  - [ ] 1.4.3 Domínio Estratégico (inclui seletor de módulo + ranking)
- [ ] 1.5 Cobrir edge cases: “Sem evidência”, “Não identificado”, e estados de loading/empty.

## 2. Validation
- [ ] 2.1 Smoke test manual: alternar abas nos 3 cards e validar que a UI não trava o dashboard inteiro.
- [ ] 2.2 Verificar que as queries respeitam o escopo do usuário (aluno vs professor/superadmin).

