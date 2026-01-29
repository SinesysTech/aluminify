# Análise de Importação de Alunos

## Formato Esperado pelo Sistema

### Colunas Obrigatórias:

1. **Nome Completo** (aceita: "nome completo", "nome")
   - Mínimo: 3 caracteres
   - Máximo: 200 caracteres
   - Exemplo: "João da Silva Santos"

2. **E-mail** (aceita: "email", "e-mail")
   - Deve ser um e-mail válido
   - Será usado para login
   - Exemplo: "joao.silva@email.com"

3. **Número de Matrícula** (aceita: "numero de matricula", "número de matrícula", "matricula", "matrícula")
   - Máximo: 50 caracteres
   - Deve ser único dentro da mesma empresa
   - Exemplo: "MAT2025001"

4. **Cursos** (aceita: "cursos", "curso", "courses")
   - Deve conter pelo menos um curso
   - Múltiplos cursos separados por: `;` ou `,` ou `|` ou `/`
   - O nome do curso deve corresponder EXATAMENTE ao cadastrado no sistema
   - Exemplo: "Química Online; Física Online"

### Colunas Opcionais:

5. **CPF** (aceita: "cpf")
   - Deve ter 11 dígitos (apenas números)
   - Se tiver 8-10 dígitos, será completado com 0 à esquerda
   - Exemplo: "12345678900"

6. **Telefone** (aceita: "telefone", "celular")
   - Apenas números (com ou sem DDD)
   - Exemplo: "11999998888"

7. **Senha Temporária** (aceita: "senha temporaria", "senha temporária", "senha", "password")
   - Mínimo: 8 caracteres
   - Se não fornecida, será usado o CPF (se tiver 11 dígitos)
   - Exemplo: "12345678900"

## Regras de Validação:

1. **CPF ou Senha Temporária**: É obrigatório ter pelo menos um dos dois
   - Se não tiver CPF, deve ter senha temporária
   - Se não tiver senha temporária, deve ter CPF (que será usado como senha)

2. **E-mail**: Deve ser válido e único no sistema

3. **Matrícula**: Deve ser única dentro da mesma empresa

4. **Cursos**: 
   - Deve ter pelo menos um curso
   - Os nomes dos cursos devem existir no sistema
   - Case-insensitive (não diferencia maiúsculas/minúsculas)

## Problemas Comuns:

### 1. Colunas com nomes diferentes
- O sistema normaliza os nomes das colunas (remove acentos, espaços extras, etc)
- Verifique se os nomes das colunas correspondem aos esperados

### 2. Cursos não encontrados
- Os nomes dos cursos devem corresponder EXATAMENTE aos cadastrados
- Verifique se há espaços extras, diferenças de maiúsculas/minúsculas
- Exemplo: Se o curso está cadastrado como "Química Online", não use "Quimica Online" ou "química online"

### 3. CPF inválido
- Deve ter exatamente 11 dígitos
- Apenas números (sem pontos, traços, etc)
- Se tiver 8-10 dígitos, será completado automaticamente

### 4. E-mail duplicado
- Se o e-mail já existe no sistema, o aluno será marcado como "já cadastrado"
- O sistema tentará vincular os cursos ao aluno existente

### 5. Matrícula duplicada
- A matrícula deve ser única dentro da mesma empresa
- Diferentes empresas podem ter alunos com a mesma matrícula

### 6. Falta de CPF ou Senha
- É obrigatório ter pelo menos um dos dois
- Se não tiver CPF, deve fornecer senha temporária (mínimo 8 caracteres)

## Como Verificar seu Arquivo:

1. **Verifique os cabeçalhos das colunas**
   - Devem corresponder aos nomes esperados (com ou sem acentos)
   - O sistema normaliza automaticamente

2. **Verifique os cursos**
   - Liste todos os cursos cadastrados no sistema
   - Compare com os nomes na coluna "Cursos" do seu arquivo
   - Certifique-se de que correspondem exatamente

3. **Verifique CPFs**
   - Devem ter 11 dígitos
   - Apenas números

4. **Verifique e-mails**
   - Devem ser válidos
   - Formato: usuario@dominio.com

5. **Verifique matrículas**
   - Não podem estar duplicadas na mesma empresa
   - Devem estar preenchidas

## Script de Análise

Execute o script `scripts/analisar-importacao-alunos.ts` para analisar seu arquivo:

```bash
npx tsx scripts/analisar-importacao-alunos.ts "caminho/para/seu/arquivo.xlsx"
```

O script irá:
- Verificar se todas as colunas esperadas estão presentes
- Validar cada linha de dados
- Listar todos os problemas encontrados
- Mostrar um resumo da análise
