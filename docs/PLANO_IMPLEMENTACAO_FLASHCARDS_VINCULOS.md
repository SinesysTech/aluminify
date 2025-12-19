# 📋 Plano de Implementação: Vínculos de Flashcards

## 🎯 Objetivo

Garantir que todos os flashcards sejam vinculados corretamente a Curso, Disciplina, Frente e Módulo, permitindo:
- ✅ Filtros funcionarem corretamente
- ✅ Modos de revisão considerarem apenas flashcards dos cursos do aluno
- ✅ Sistema saber quais flashcards usar em cada modo de revisão

---

## ✅ Implementações Realizadas

### 1. Componente de Upload (`components/flashcard-upload-card.tsx`)

**Mudanças:**
- ✅ Seletores de Curso, Disciplina e Frente (cascata)
- ✅ Validação para aceitar **número do módulo** (não nome)
- ✅ Busca de módulos considerando `curso_id` (aceita NULL para compatibilidade)
- ✅ Validação de vínculos antes de salvar

**Formato do CSV:**
```csv
Módulo;Pergunta;Resposta
1;Qual é a fórmula de Bhaskara?;"x = (-b ± √(b²-4ac)) / 2a"
2;Qual é a segunda lei de Newton?;F = ma
```

**Validações:**
- Módulo deve ser um número válido
- Módulo deve existir na frente selecionada
- Módulo deve pertencer ao curso selecionado (ou ter curso_id NULL)

---

### 2. Serviço de Importação (`backend/services/flashcards/flashcards.service.ts`)

**Mudanças:**
- ✅ Suporte ao novo formato (moduloId direto)
- ✅ Compatibilidade com formato antigo
- ✅ Validação de vínculos

**Formato Novo:**
```typescript
{
  moduloId: string,  // ID do módulo (já validado no frontend)
  pergunta: string,
  resposta: string
}
```

**Formato Antigo (compatibilidade):**
```typescript
{
  disciplina: string,
  frente: string,
  moduloNumero: number,
  pergunta: string,
  resposta: string
}
```

---

### 3. Modos de Revisão (`backend/services/flashcards/flashcards.service.ts`)

**Mudanças:**
- ✅ Método `listForReview` agora considera cursos do aluno
- ✅ Busca apenas flashcards dos módulos dos cursos do aluno
- ✅ Filtra por hierarquia: Curso → Disciplina → Frente → Módulo

**Lógica Implementada:**

1. **Buscar cursos do aluno** (`alunos_cursos`)
2. **Buscar disciplinas dos cursos** (`cursos_disciplinas`)
3. **Buscar frentes das disciplinas** (que pertencem aos cursos)
4. **Buscar módulos das frentes** (considerando curso_id)
5. **Filtrar flashcards** apenas dos módulos encontrados

**Modos de Revisão:**

- **🔥 Mais Cobrados**: Módulos com `importancia = 'Alta'` dos cursos do aluno
- **🧠 Revisão Geral**: Todos os módulos dos cursos do aluno (ou módulos já vistos)
- **🚑 UTI dos Erros**: Módulos de atividades com dificuldade dos cursos do aluno

---

### 4. Filtros de Admin (`app/(dashboard)/admin/flashcards/flashcards-admin-client.tsx`)

**Status:** ✅ Funcionando corretamente

**Filtros disponíveis:**
- Disciplina → Filtra frentes da disciplina
- Frente → Filtra módulos da frente
- Módulo → Filtra flashcards do módulo
- Busca → Busca por texto (pergunta ou resposta)

**Observação:** Os filtros de admin não filtram por curso (intencional - admin pode ver todos os flashcards).

---

## 📊 Estrutura de Vínculos

```
Flashcard
  └── modulo_id → Módulo
      └── frente_id → Frente
          ├── disciplina_id → Disciplina
          └── curso_id → Curso ✅
```

**Vínculos garantidos:**
- ✅ Flashcard → Módulo (via `modulo_id`)
- ✅ Módulo → Frente (via `frente_id`)
- ✅ Frente → Disciplina (via `disciplina_id`)
- ✅ Frente → Curso (via `curso_id`)
- ⚠️ Módulo → Curso (via `curso_id` - pode ser NULL para dados legados)

---

## 🔍 Validações Implementadas

### No Upload:
1. ✅ Curso selecionado existe
2. ✅ Disciplina pertence ao curso
3. ✅ Frente pertence à disciplina e ao curso
4. ✅ Módulo existe na frente (por número)
5. ✅ Módulo pertence ao curso (ou tem curso_id NULL)

### Na Revisão (Aluno):
1. ✅ Aluno tem cursos matriculados (`alunos_cursos`)
2. ✅ Busca apenas flashcards dos cursos do aluno
3. ✅ Filtra por hierarquia completa (curso → disciplina → frente → módulo)

---

## 🚀 Próximos Passos

### 1. Testar Upload
- [ ] Testar upload com número de módulo válido
- [ ] Testar upload com número de módulo inválido
- [ ] Verificar mensagens de erro
- [ ] Verificar se flashcards são salvos corretamente

### 2. Testar Filtros
- [ ] Testar filtro por Disciplina
- [ ] Testar filtro por Frente
- [ ] Testar filtro por Módulo
- [ ] Testar busca por texto
- [ ] Verificar se resultados estão corretos

### 3. Testar Modos de Revisão
- [ ] Testar "Mais Cobrados" (deve mostrar apenas dos cursos do aluno)
- [ ] Testar "Revisão Geral" (deve mostrar apenas dos cursos do aluno)
- [ ] Testar "UTI dos Erros" (deve mostrar apenas dos cursos do aluno)
- [ ] Verificar se aluno sem cursos não vê flashcards

### 4. Verificar Vínculos no Banco
- [ ] Verificar se flashcards têm `modulo_id` correto
- [ ] Verificar se módulos têm `frente_id` correto
- [ ] Verificar se frentes têm `curso_id` e `disciplina_id` corretos
- [ ] Verificar se módulos têm `curso_id` (ou NULL se legado)

---

## 📝 Exemplo de Uso

### Upload de Flashcards

1. Acesse `/admin/flashcards`
2. Selecione:
   - **Curso**: "CDF (Live)"
   - **Disciplina**: "Física"
   - **Frente**: "Frente A"
3. Faça upload do arquivo CSV:
   ```csv
   Módulo;Pergunta;Resposta
   1;Qual é a fórmula de Bhaskara?;"x = (-b ± √(b²-4ac)) / 2a"
   2;Qual é a segunda lei de Newton?;F = ma
   ```
4. Clique em "Importar"

### Filtros

Na página `/admin/flashcards`, use os filtros:
- **Disciplina**: Física → Mostra apenas flashcards de Física
- **Frente**: Frente A → Mostra apenas flashcards da Frente A
- **Módulo**: Módulo 1 → Mostra apenas flashcards do Módulo 1

### Revisão (Aluno)

Na página `/aluno/flashcards`:
- Aluno seleciona modo de revisão
- Sistema busca apenas flashcards dos cursos do aluno
- Filtra por hierarquia completa

---

## ⚠️ Pontos de Atenção

1. **Módulos com curso_id NULL**: Aceitos para compatibilidade com dados legados
2. **Frentes sem curso_id**: Não devem existir (erro de dados)
3. **Validação de número**: Módulo deve ser número, não texto
4. **Vínculos**: Todos os flashcards devem ter vínculos completos

---

## 🔧 Comandos Úteis

### Verificar flashcards sem vínculos corretos:
```sql
SELECT 
  f.id,
  f.pergunta,
  m.id as modulo_id,
  m.nome as modulo_nome,
  m.frente_id,
  fr.nome as frente_nome,
  fr.curso_id,
  fr.disciplina_id
FROM flashcards f
LEFT JOIN modulos m ON m.id = f.modulo_id
LEFT JOIN frentes fr ON fr.id = m.frente_id
WHERE m.id IS NULL OR fr.id IS NULL;
```

### Verificar flashcards por curso:
```sql
SELECT 
  c.nome as curso_nome,
  d.nome as disciplina_nome,
  fr.nome as frente_nome,
  m.numero_modulo,
  COUNT(f.id) as total_flashcards
FROM flashcards f
JOIN modulos m ON m.id = f.modulo_id
JOIN frentes fr ON fr.id = m.frente_id
JOIN disciplinas d ON d.id = fr.disciplina_id
JOIN cursos c ON c.id = fr.curso_id
GROUP BY c.nome, d.nome, fr.nome, m.numero_modulo
ORDER BY c.nome, d.nome, fr.nome, m.numero_modulo;
```

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Implementação Completa - Aguardando Testes

















