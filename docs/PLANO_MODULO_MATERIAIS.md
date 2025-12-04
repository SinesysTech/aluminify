# Plano de Implementação: Módulo Área de Estudo e Gestão de Materiais

## ✅ ATUALIZAÇÕES APROVADAS

- **Bucket Storage**: `materiais_didaticos`
- **Rota**: `/admin/materiais`
- **Acesso**: Apenas professores
- **Upload**: Direto no frontend (sem rota intermediária)

---

## 1. Banco de Dados

### 1.1 Migration SQL
- Criar migration com tabelas `atividades` e `progresso_atividades`
- Enums: `enum_tipo_atividade`, `enum_status_atividade`, `enum_dificuldade_percebida`
- Stored Procedure: `gerar_atividades_padrao(p_frente_id UUID)`

### 1.2 Estrutura da Tabela Atividades
- `id` (UUID, PK)
- `modulo_id` (UUID, FK para `modulos`)
- `tipo` (enum_tipo_atividade)
- `titulo` (TEXT)
- `arquivo_url` (TEXT, nullable)
- `gabarito_url` (TEXT, nullable)
- `link_externo` (TEXT, nullable)
- `obrigatorio` (BOOLEAN)
- `ordem_exibicao` (INTEGER)
- `created_by` (UUID, FK para auth.users)
- `created_at`, `updated_at` (timestamps)

---

## 2. Types/Interfaces TypeScript

### 2.1 Backend (`backend/services/atividade/atividade.types.ts`)
- `TipoAtividade`: Enum baseado no `enum_tipo_atividade`
- `Atividade`: Interface principal
- `UpdateAtividadeInput`: Para atualização de `arquivo_url`

### 2.2 Frontend (`app/(dashboard)/admin/materiais/types.ts`)
- `AtividadeComModulo`: Atividade com dados do módulo
- `ModuloComAtividades`: Módulo com array de atividades

---

## 3. Componentes UI

### 3.1 Componentes Shadcn
- `Accordion`, `Button`, `Card`, `Select`, `Input`, `Label`, `Dialog`
- Ícones: `Upload`, `FileText`, `CheckCircle2`, `X`, `Loader2`

### 3.2 Componentes Customizados
1. **`ActivityUploadRow`** (`components/activity-upload-row.tsx`)
   - Upload direto usando `supabase.storage.from('materiais_didaticos').upload(...)`
   - Validação de PDF (~10MB)
   - Após upload, chama `PATCH /api/atividade/[id]` para salvar URL

2. **`ModuleAccordion`** (`components/module-accordion.tsx`)
   - Accordion por módulo
   - Lista de `ActivityUploadRow` dentro

3. **`MaterialsFilters`** (`components/materials-filters.tsx`)
   - Select Disciplina > Select Frente
   - Botão "Gerar Estrutura"

---

## 4. Integração Backend

### 4.1 Service Layer
- `backend/services/atividade/atividade.repository.ts`
- `backend/services/atividade/atividade.service.ts`
- Métodos: `listByModulo`, `listByFrente`, `updateArquivoUrl`, `gerarAtividadesPadrao`

### 4.2 API Routes
1. **GET `/api/atividade`**: Listar atividades (filtro por `modulo_id` ou `frente_id`)
2. **PATCH `/api/atividade/[id]`**: Atualizar `arquivo_url` (chamado após upload direto)
3. **POST `/api/atividade/gerar-estrutura`**: Chamar RPC `gerar_atividades_padrao`

**❌ NÃO CRIAR**: `/api/atividade/upload` - Upload será direto no frontend

### 4.3 Lógica de Upload (Upload Direto no Frontend)

**Bucket**: `materiais_didaticos`

**Fluxo**:
1. Frontend (`ActivityUploadRow`): Valida PDF (~10MB)
2. Frontend: Upload direto `supabase.storage.from('materiais_didaticos').upload(...)`
   - Path: `{atividade_id}/{timestamp}-{nome_original}.pdf`
3. Frontend: Obtém URL pública
4. Frontend: Chama `PATCH /api/atividade/[id]` para salvar URL no banco
5. Frontend: Atualiza UI otimisticamente

**Vantagens**:
- ✅ Evita gargalos no servidor Next.js
- ✅ Evita limites de body parser
- ✅ Aproveita RLS do Supabase Storage

---

## 5. Página Frontend

### 5.1 Estrutura
```
app/(dashboard)/admin/materiais/
  page.tsx (Server Component - verificação professor)
  materiais-client.tsx (Client Component - lógica)
```

### 5.2 Layout Master-Detail
- **Topo**: Filtros (Disciplina > Frente) + Botão "Gerar Estrutura"
- **Corpo**: Accordions agrupados por módulo com atividades dentro

---

## 6. Ordem de Execução

### ✅ Fase 1: Banco de Dados
1. Criar migration SQL (fornecido pelo usuário)
2. Aplicar migration
3. Verificar estrutura e testar RPC

### Fase 2: Backend Service Layer
1. Types
2. Repository
3. Service
4. Index exports

### Fase 3: API Routes
1. GET /api/atividade
2. PATCH /api/atividade/[id]
3. POST /api/atividade/gerar-estrutura

### Fase 4: Componentes UI
1. Dropzone genérico (se necessário)
2. ActivityUploadRow (com upload direto)
3. ModuleAccordion
4. MaterialsFilters

### Fase 5: Página Frontend
1. Estrutura de diretórios
2. Server Component (permissões)
3. Client Component (lógica)
4. Integração completa

### Fase 6: Configuração
1. Criar bucket `materiais_didaticos` no Supabase
2. Configurar RLS policies do bucket
3. Testes end-to-end

---

## 📝 Notas Importantes

- Upload é feito **diretamente no frontend**, sem rota intermediária
- Bucket: `materiais_didaticos` (definido pelo usuário)
- Apenas professores têm acesso
- RPC `gerar_atividades_padrao` recebe `p_frente_id UUID`



