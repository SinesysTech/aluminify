# Módulo de Cronograma

## Visão Geral
Ferramenta inteligente que gera um plano de estudos personalizado para o aluno, distribuindo o conteúdo do curso ao longo das semanas disponíveis até a data alvo (ex: prova).

## Funcionalidades
- **Wizard de Criação:** Passo a passo para definir disponibilidade diária e metas.
- **Gerador de Grade:** Algoritmo que aloca aulas nos dias de estudo.
- **Dashboard:** Acompanhamento do progresso semanal e reprogramação.
- **Exportação:** Geração de PDF/XLSX do plano de estudos.

## Organização Interna
- `(aluno)`: Visão principal do aluno (Dashboard e Wizard).
- `services`: Lógica de distribuição de aulas (algoritmo de cronograma).
