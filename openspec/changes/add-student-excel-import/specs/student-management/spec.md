## ADDED Requirements

### Requirement: Importação de Alunos via Excel na Página de Administração

O sistema DEVE fornecer uma interface de importação de alunos em massa na página de administração de alunos (`/admin/alunos`) com as seguintes funcionalidades:

1. **Dialog de Importação**
   - Um dialog/sheet DEVE ser exibido ao clicar nos botões "Importar CSV" ou "Importar Planilha"
   - O dialog DEVE permitir upload de arquivos CSV, XLS ou XLSX
   - O dialog DEVE exibir feedback de progresso durante o upload
   - O dialog DEVE exibir resumo da importação (criados, ignorados, falhos)

2. **Download de Modelo Excel**
   - O dialog DEVE ter um botão para download do modelo de importação
   - O modelo DEVE ser gerado em formato XLSX
   - O modelo DEVE conter indicação visual de campos obrigatórios (*)

3. **Integração com API Existente**
   - A importação DEVE usar a API existente `/api/student/bulk-import`
   - A lista de alunos DEVE ser atualizada automaticamente após importação bem-sucedida

#### Scenario: Usuário abre dialog de importação

- **WHEN** o usuário clica no botão "Importar CSV" ou "Importar Planilha"
- **THEN** um dialog de importação é exibido
- **AND** o dialog contém área para upload de arquivo
- **AND** o dialog contém botão para download do modelo

#### Scenario: Usuário baixa modelo de importação

- **WHEN** o usuário clica no botão "Baixar Modelo"
- **THEN** um arquivo XLSX é baixado com nome "modelo_importacao_alunos.xlsx"
- **AND** o arquivo contém planilha "Dados" com headers formatados
- **AND** o arquivo contém planilha "Instruções" com guia de preenchimento
- **AND** campos obrigatórios são marcados com asterisco (*)

#### Scenario: Usuário importa arquivo válido

- **WHEN** o usuário seleciona um arquivo CSV ou XLSX válido
- **AND** clica em "Importar"
- **THEN** o sistema processa o arquivo
- **AND** exibe um resumo com quantidade de alunos criados, ignorados e falhos
- **AND** a lista de alunos é atualizada com os novos registros

#### Scenario: Usuário importa arquivo com erros

- **WHEN** o usuário seleciona um arquivo com dados inválidos
- **AND** clica em "Importar"
- **THEN** o sistema exibe mensagens de erro detalhadas por linha
- **AND** indica quais campos estão com problemas

---

### Requirement: Modelo Excel para Importação de Alunos

O modelo de importação de alunos DEVE seguir a estrutura definida abaixo:

1. **Planilha "Dados"**
   - Headers com indicação de obrigatoriedade usando asterisco (*)
   - Formatação visual: headers em negrito com cor de fundo
   - Colunas com largura ajustada ao conteúdo
   - Linha de exemplo preenchida

2. **Campos do Modelo**
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

3. **Planilha "Instruções"**
   - Legenda explicando o significado do asterisco (*)
   - Regras de validação para cada campo
   - Exemplos de preenchimento correto
   - Informação sobre geração automática de senha

#### Scenario: Modelo gerado corretamente

- **WHEN** o sistema gera o modelo de importação
- **THEN** o arquivo XLSX contém exatamente 2 planilhas
- **AND** a planilha "Dados" contém 18 colunas
- **AND** 6 colunas são marcadas como obrigatórias (*)
- **AND** a planilha "Instruções" contém guia completo de preenchimento

#### Scenario: Campos obrigatórios claramente identificados

- **WHEN** o usuário abre o modelo no Excel
- **THEN** campos obrigatórios têm asterisco (*) no header
- **AND** campos obrigatórios têm cor de fundo diferente (destacada)
- **AND** a planilha de instruções lista todos os campos obrigatórios
