# 📋 Configuração Completa: Flashcards e Sistema

Este documento explica todas as configurações necessárias para subir os flashcards e as demais informações do sistema.

---

## 🔐 1. Variáveis de Ambiente

### 1.1. Arquivo `.env.local` (Desenvolvimento Local)

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# ============================================
# VARIÁVEIS DE AMBIENTE - Área do Aluno
# ============================================
# ⚠️ NUNCA commite este arquivo no Git!

# --------------------------------------------
# SUPABASE - OBRIGATÓRIAS
# --------------------------------------------

# URL do projeto (Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública/anônima (anon/public key)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon

# URL do Supabase (mesma que acima, para uso no servidor)
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave secreta (service_role key) - ⚠️ NUNCA exponha no cliente!
SUPABASE_SECRET_KEY=sua_chave_secreta_service_role

# --------------------------------------------
# UPSTASH REDIS - OPCIONAIS (recomendado para produção)
# --------------------------------------------

UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

### 1.2. Onde Obter as Credenciais do Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie os seguintes valores:
   - **Project URL** → Use para `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon/public key** → Use para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - **service_role key** → Use para `SUPABASE_SECRET_KEY` ⚠️ **MANTENHA SECRETO!**

### 1.3. Configuração na Vercel (Produção)

1. Acesse seu projeto na [Vercel](https://vercel.com)
2. Vá em **Settings → Environment Variables**
3. Adicione todas as variáveis listadas acima
4. Configure valores diferentes para:
   - **Production** (produção)
   - **Preview** (branches e PRs)
   - **Development** (local - opcional)

---

## 🗄️ 2. Estrutura do Banco de Dados

### 2.1. Tabelas Necessárias para Flashcards

O sistema de flashcards requer as seguintes tabelas no Supabase:

#### **Tabela: `flashcards`**
```sql
CREATE TABLE public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    modulo_id UUID REFERENCES public.modulos(id),
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Colunas:**
- `id` - UUID único do flashcard
- `modulo_id` - Referência ao módulo (obrigatório)
- `pergunta` - Texto da pergunta
- `resposta` - Texto da resposta
- `created_at` - Data de criação

#### **Tabela: `progresso_flashcards`**
```sql
CREATE TABLE public.progresso_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    nivel_facilidade DOUBLE PRECISION DEFAULT 2.5,
    dias_intervalo INTEGER DEFAULT 0,
    data_proxima_revisao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_revisoes INTEGER DEFAULT 0,
    ultimo_feedback INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Colunas:**
- `id` - UUID único do progresso
- `aluno_id` - Referência ao aluno
- `flashcard_id` - Referência ao flashcard
- `nivel_facilidade` - Nível de facilidade (SRS - Spaced Repetition System)
- `dias_intervalo` - Intervalo em dias até próxima revisão
- `data_proxima_revisao` - Data da próxima revisão
- `numero_revisoes` - Quantidade de revisões realizadas
- `ultimo_feedback` - Último feedback dado (1-4)
- `created_at` / `updated_at` - Timestamps

### 2.2. Tabelas Relacionadas (Dependências)

Para os flashcards funcionarem, você também precisa das seguintes tabelas:

1. **`alunos`** - Dados dos alunos
2. **`modulos`** - Módulos de conteúdo
3. **`frentes`** - Frentes de estudo
4. **`disciplinas`** - Disciplinas
5. **`cursos`** - Cursos
6. **`matriculas`** - Matrículas dos alunos

### 2.3. Row Level Security (RLS)

As tabelas devem ter RLS habilitado com políticas apropriadas:

- **`flashcards`**: Professores podem ver/criar/editar todos; Alunos podem ver apenas os dos módulos de seus cursos
- **`progresso_flashcards`**: Alunos podem ver/editar apenas seus próprios progressos

---

## 📊 3. Estrutura de Dados Esperada

### 3.1. Hierarquia de Dados

```
Curso
  └── Disciplina
      └── Frente
          └── Módulo
              └── Flashcard
                  └── Progresso Flashcard (por aluno)
```

### 3.2. Importação de Flashcards

Os flashcards devem ser importados via CSV ou XLSX na página **Gestão de Flashcards** (`/admin/flashcards`).

**Formato do Arquivo:**
No card de upload, o professor seleciona:
- **Curso** (obrigatório)
- **Disciplina** (do curso selecionado - obrigatório)
- **Frente** (da disciplina selecionada - obrigatório)

O arquivo CSV/XLSX deve conter **3 colunas**:

```csv
Módulo;Pergunta;Resposta
1;Qual é a fórmula de Bhaskara?;"x = (-b ± √(b²-4ac)) / 2a"
2;Qual é a segunda lei de Newton?;F = ma
3;O que é fotossíntese?;Processo pelo qual plantas convertem luz em energia
```

**Campos obrigatórios:**
- `Módulo` - **Número do módulo** (ex: 1, 2, 3) - deve existir na frente selecionada
- `Pergunta` - Texto da pergunta
- `Resposta` - Texto da resposta

**⚠️ IMPORTANTE:**
- A primeira coluna deve conter o **número do módulo**, não o nome
- O número deve corresponder ao `numero_modulo` do módulo na frente selecionada
- Todos os flashcards serão vinculados ao curso, disciplina, frente e módulo selecionados

**Formato do arquivo:**
- Delimitador: `;` (ponto e vírgula - padrão Excel PT-BR)
- Codificação: UTF-8
- Formatos aceitos: CSV ou XLSX

**Exemplo completo:**
```csv
Módulo;Pergunta;Resposta
1;Qual é a fórmula de Bhaskara?;"x = (-b ± √(b²-4ac)) / 2a"
1;O que é delta na fórmula de Bhaskara?;b² - 4ac
2;Qual é a segunda lei de Newton?;F = ma
2;O que significa F na segunda lei de Newton?;Força resultante
3;O que é aceleração?;Variação da velocidade no tempo
```

**Formato Antigo (Compatibilidade):**
O formato antigo ainda é suportado para compatibilidade, mas não é recomendado:

```csv
disciplina,frente,moduloNumero,pergunta,resposta
Matemática,Álgebra,1,Qual é a fórmula de Bhaskara?,"x = (-b ± √(b²-4ac)) / 2a"
```

---

## 🚀 4. Configuração do Supabase

### 4.1. Verificar Migrações

Certifique-se de que todas as migrações foram aplicadas:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Verifique se as tabelas `flashcards` e `progresso_flashcards` existem
4. Se não existirem, execute as migrações do diretório `supabase/migrations/`

### 4.2. Configurar RLS (Row Level Security)

Execute as políticas RLS necessárias:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_flashcards ENABLE ROW LEVEL SECURITY;

-- Política para flashcards: Professores podem tudo
CREATE POLICY "Professores podem gerenciar flashcards"
ON public.flashcards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.professores
    WHERE id = auth.uid()
  )
);

-- Política para progresso: Alunos veem apenas seus próprios
CREATE POLICY "Alunos veem apenas seu progresso"
ON public.progresso_flashcards
FOR ALL
USING (auth.uid() = aluno_id);
```

### 4.3. Verificar Índices

Certifique-se de que existem índices para performance:

```sql
-- Índices para flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_modulo_id 
ON public.flashcards(modulo_id);

-- Índices para progresso_flashcards
CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_aluno_id 
ON public.progresso_flashcards(aluno_id);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_flashcard_id 
ON public.progresso_flashcards(flashcard_id);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcards_data_revisao 
ON public.progresso_flashcards(data_proxima_revisao);
```

---

## ✅ 5. Checklist de Configuração

### 5.1. Variáveis de Ambiente
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` configurada
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_SECRET_KEY` configurada
- [ ] `UPSTASH_REDIS_REST_URL` configurada (opcional)
- [ ] `UPSTASH_REDIS_REST_TOKEN` configurada (opcional)

### 5.2. Banco de Dados
- [ ] Tabela `flashcards` criada
- [ ] Tabela `progresso_flashcards` criada
- [ ] Tabelas relacionadas criadas (`alunos`, `modulos`, `frentes`, etc.)
- [ ] RLS habilitado nas tabelas
- [ ] Políticas RLS configuradas
- [ ] Índices criados

### 5.3. Dados
- [ ] Cursos cadastrados
- [ ] Disciplinas cadastradas
- [ ] Frentes cadastradas
- [ ] Módulos cadastrados
- [ ] Alunos cadastrados
- [ ] Matrículas ativas configuradas

### 5.4. Funcionalidades
- [ ] Importação de flashcards funcionando
- [ ] Listagem de flashcards para revisão funcionando
- [ ] Sistema de feedback (SRS) funcionando
- [ ] Progresso sendo salvo corretamente

---

## 🔧 6. Testando a Configuração

### 6.1. Teste Local

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse `http://localhost:3000/aluno/flashcards`
3. Verifique se consegue ver os flashcards
4. Teste dar feedback em um flashcard

### 6.2. Teste de Importação

1. Acesse `/admin/materiais` (como professor)
2. Faça upload de um CSV de flashcards
3. Verifique se os flashcards foram importados corretamente

### 6.3. Verificar Logs

Se houver erros, verifique:
- Console do navegador (F12)
- Logs do servidor Next.js
- Logs do Supabase (Dashboard → Logs)

---

## 📚 7. Recursos Adicionais

### Documentação Relacionada

- [Variáveis de Ambiente](./ENV_VARIABLES.md) - Documentação completa de variáveis
- [Análise do Serviço de Flashcards](./ANALISE_SERVICO_FLASHCARDS.md) - Detalhes técnicos
- [Status Flashcards Aluno](./STATUS_FLASHCARDS_ALUNO.md) - Status da implementação

### Estrutura de Arquivos

```
backend/services/flashcards/
  └── flashcards.service.ts    # Lógica de negócio

app/api/flashcards/
  ├── route.ts                  # CRUD de flashcards
  ├── import/route.ts           # Importação CSV
  ├── revisao/route.ts          # Listagem para revisão
  └── feedback/route.ts         # Registro de feedback

app/(dashboard)/
  ├── admin/flashcards/         # Interface admin
  └── aluno/flashcards/         # Interface aluno
```

---

## ⚠️ 8. Problemas Comuns

### Erro: "Database credentials are not configured"
**Solução:** Verifique se todas as variáveis de ambiente do Supabase estão configuradas no `.env.local`

### Erro: "Apenas professores podem realizar esta ação"
**Solução:** Verifique se o usuário está cadastrado na tabela `professores`

### Erro: "Módulo não encontrado"
**Solução:** Verifique se o módulo existe na tabela `modulos` e se o número do módulo está correto

### Erro: "RLS policy violation"
**Solução:** Verifique se as políticas RLS estão configuradas corretamente

---

## 🎯 9. Próximos Passos

Após configurar tudo:

1. ✅ Importar flashcards via CSV
2. ✅ Testar revisão como aluno
3. ✅ Verificar progresso sendo salvo
4. ✅ Configurar produção na Vercel
5. ✅ Monitorar logs e erros

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0















