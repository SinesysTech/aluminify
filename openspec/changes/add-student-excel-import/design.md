# Design: Importação de Alunos via Excel

## Context

A plataforma já possui:
- API de bulk-import funcional em `/api/student/bulk-import`
- Service de importação em `backend/services/student/student-import.service.ts`
- Componente de importação em `components/aluno/aluno-table.tsx` (usado em outra área)

A página de administração de alunos (`/admin/alunos`) possui botões de importação que não estão conectados à funcionalidade existente.

## Goals / Non-Goals

**Goals:**
- Conectar a funcionalidade de importação existente à página de administração de alunos
- Criar modelo Excel profissional com indicações claras de campos obrigatórios
- Manter consistência visual com o padrão usado em "Conteúdos"
- Reutilizar a API existente sem modificações

**Non-Goals:**
- Modificar a API de bulk-import existente
- Alterar a lógica de validação de campos
- Adicionar novos campos à importação

## Decisions

### 1. Componente Separado vs. Inline

**Decisão:** Criar componente `StudentImportDialog` separado

**Motivo:**
- Mantém `client-page.tsx` enxuto
- Permite reutilização em outras páginas se necessário
- Segue o padrão de componentes da aplicação

### 2. Formato do Modelo

**Decisão:** Gerar arquivo XLSX (não CSV)

**Motivo:**
- Permite formatação visual (cores, negrito, bordas)
- Suporta múltiplas planilhas (dados + instruções)
- Melhor experiência do usuário com indicações visuais
- Consistente com o modelo usado em "Conteúdos"

### 3. Indicação de Campos Obrigatórios

**Decisão:** Usar asterisco (*) no header + cor diferente

**Motivo:**
- Padrão reconhecido universalmente
- Visualmente claro sem ser intrusivo
- Funciona tanto no Excel quanto em visualizadores simples

## Estrutura do Modelo Excel

### Planilha "Dados"

| Coluna | Obrigatório | Validação |
|--------|-------------|-----------|
| Nome Completo* | Sim | Não vazio |
| Email* | Sim | Email válido |
| CPF* | Sim | 11 dígitos numéricos |
| Telefone* | Sim | Mínimo 10 dígitos |
| Número de Matrícula* | Sim | Não vazio |
| Cursos* | Sim | Nomes separados por ";" |
| Senha Temporária | Não | Mínimo 8 caracteres (se preenchido) |
| Data de Nascimento | Não | Formato: DD/MM/AAAA |
| Endereço | Não | - |
| Número | Não | - |
| Complemento | Não | - |
| Bairro | Não | - |
| Cidade | Não | - |
| Estado | Não | UF (2 caracteres) |
| CEP | Não | 8 dígitos |
| País | Não | - |
| Instagram | Não | - |
| Twitter | Não | - |

### Planilha "Instruções"

Conteúdo:
1. Legenda de campos obrigatórios (*)
2. Regras de validação por campo
3. Exemplos de preenchimento
4. Informação sobre geração automática de senha
5. Dicas de formatação para cursos múltiplos

## Risks / Trade-offs

### Risk: Inconsistência com Import Existente
**Mitigação:** Não modificar o backend, apenas criar interface que use a API existente

### Trade-off: XLSX vs CSV
- XLSX: Mais rico visualmente, mas requer ExcelJS
- CSV: Mais simples, mas sem formatação
- **Escolha:** XLSX para modelo (download), aceitar ambos para upload

## Migration Plan

N/A - Nova funcionalidade sem breaking changes

## Open Questions

Nenhuma - requisitos claros para implementação.
