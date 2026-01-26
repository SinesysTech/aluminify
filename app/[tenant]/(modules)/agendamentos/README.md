# Módulo de Agendamentos

## Visão Geral
Responsável por gerenciar todo o ciclo de vida de mentorias e reuniões entre alunos e professores. Permite a verificação de disponibilidade, bloqueio de horários e agendamento de sessões.

## Atores
- **Aluno:** Busca professores, visualiza disponibilidade e agenda mentorias.
- **Professor:** Define disponibilidade, bloqueia horários e gerencia seus agendamentos.

## Organização Interna
- `(aluno)`: Fluxo de agendamento do aluno.
- `(gestao)`: Painel do professor e configurações de disponibilidade.
- `components`: Componentes visuais como Calendário e Cards de Agendamento.
- `services`: Lógica de validação de horário e integração com banco de dados.
