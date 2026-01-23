# Tasks: Implementar Importação de Alunos via Excel

## 1. Criar Componente de Dialog de Importação

- [ ] 1.1 Criar `student-import-dialog.tsx` com:
  - Dialog/Sheet para upload de arquivo
  - Área de drag & drop para arquivos
  - Input de arquivo com suporte a CSV/XLSX
  - Botão para download do modelo Excel
  - Estados de loading e feedback de erros
  - Exibição do resumo de importação (criados/ignorados/falhos)

## 2. Implementar Geração do Modelo Excel

- [ ] 2.1 Criar função `downloadStudentImportTemplate()`:
  - Usar ExcelJS para gerar arquivo XLSX
  - Headers com indicação de obrigatoriedade (* para obrigatórios)
  - Planilha "Dados" com colunas:
    - Nome Completo* (obrigatório)
    - Email* (obrigatório)
    - CPF* (obrigatório - 11 dígitos)
    - Telefone* (obrigatório - mínimo 10 dígitos)
    - Número de Matrícula* (obrigatório)
    - Cursos* (obrigatório - separar múltiplos por ";")
    - Senha Temporária (opcional - gerada automaticamente se vazio)
    - Data de Nascimento (opcional)
    - Endereço (opcional)
    - Número (opcional)
    - Complemento (opcional)
    - Bairro (opcional)
    - Cidade (opcional)
    - Estado (opcional)
    - CEP (opcional)
    - País (opcional)
    - Instagram (opcional)
    - Twitter (opcional)
  - Planilha "Instruções" com:
    - Legenda de campos obrigatórios/opcionais
    - Regras de validação (CPF 11 dígitos, telefone mínimo 10 dígitos, etc.)
    - Exemplos de preenchimento
    - Informação sobre geração automática de senha
  - Formatação visual:
    - Headers em negrito com cor de fundo
    - Campos obrigatórios destacados
    - Bordas nas células
    - Largura de colunas ajustada

## 3. Integrar na Página de Alunos

- [ ] 3.1 Importar e usar `StudentImportDialog` em `client-page.tsx`
- [ ] 3.2 Conectar os botões "Importar CSV" e "Importar Planilha" ao dialog
- [ ] 3.3 Atualizar lista de alunos após importação bem-sucedida

## 4. Testes e Validação

- [ ] 4.1 Testar upload de arquivo CSV
- [ ] 4.2 Testar upload de arquivo XLSX
- [ ] 4.3 Testar download do modelo Excel
- [ ] 4.4 Verificar feedback de erros de validação
- [ ] 4.5 Verificar atualização da lista após importação
