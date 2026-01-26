# Módulo Acadêmico (Curso)

## Visão Geral
O coração do sistema pedagógico. Define a estrutura do produto educacional oferecido.

## Estrutura de Dados
1. **Curso:** O produto macro (ex: "Extensivo Enem").
2. **Segmento:** Categoria ou área (ex: "Ciências da Natureza").
3. **Disciplina:** Matéria específica (ex: "Física").
4. **Frente:** Subdivisão da matéria (ex: "Mecânica").
5. **Módulo:** Unidade de ensino.
6. **Aula:** O conteúdo final consumível.

## Organização Interna
- `(gestao)`: Área administrativa para criação e edição de toda a estrutura curricular (Segmentos, Disciplinas, Conteúdos).
- `services`: Serviços de manipulação da árvore curricular.
