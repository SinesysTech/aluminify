## 1. Implementação
- [ ] 1.1 Atualizar `types/dashboard.ts` para o novo shape de `StrategicDomain`
- [ ] 1.2 Implementar cálculo real em `getStrategicDomain()`:
  - [ ] 1.2.1 Resolver conjunto de módulos do aluno e separar por `importancia` (`Base`/`Alta`)
  - [ ] 1.2.2 Calcular `flashcardsScore` por eixo (média de `ultimo_feedback`)
  - [ ] 1.2.3 Calcular `questionsScore` por eixo (sum(acertos)/sum(totais))
  - [ ] 1.2.4 Gerar recomendações (top 3 módulos com pior `moduleRisk`)
- [ ] 1.3 Atualizar `components/dashboard/strategic-domain.tsx`:
  - [ ] 1.3.1 Renderizar duas barras (Flashcards vs Questões) por eixo
  - [ ] 1.3.2 Exibir estado “sem evidência” quando score for `null`
  - [ ] 1.3.3 Renderizar lista curta de recomendações (top 3) com motivo
- [ ] 1.4 Garantir compatibilidade do endpoint/consumo do dashboard onde `strategicDomain` é montado
- [ ] 1.5 Teste manual:
  - [ ] 1.5.1 Aluno sem dados → ambos `null` e UI “sem evidência”
  - [ ] 1.5.2 Aluno só com flashcards → flashcards calculado, questões `null`
  - [ ] 1.5.3 Aluno só com questões → questões calculado, flashcards `null`
  - [ ] 1.5.4 Aluno com ambos → ambos calculados e recomendações coerentes

## 2. Sem mudança de schema (v1)
- [ ] 2.1 Não criar migrations novas; usar tabelas atuais (`progresso_flashcards`, `flashcards`, `progresso_atividades`, `atividades`, `modulos`)

