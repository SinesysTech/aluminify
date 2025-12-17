# Sistema de Agendamentos Avançados

Este documento descreve as funcionalidades avançadas do sistema de agendamentos, incluindo recorrência anual, bloqueios de agenda, intervalos personalizados, visualização compartilhada e relatórios.

## Índice

1. [Sistema de Recorrência Anual](#sistema-de-recorrência-anual)
2. [Bloqueios de Agenda](#bloqueios-de-agenda)
3. [Intervalos Personalizados](#intervalos-personalizados)
4. [Visualização Compartilhada](#visualização-compartilhada)
5. [Sistema de Relatórios](#sistema-de-relatórios)
6. [Notificações Avançadas](#notificações-avançadas)

## Sistema de Recorrência Anual

### Visão Geral

O sistema de recorrência anual permite que professores definam padrões de disponibilidade que se repetem automaticamente em dias específicos da semana, dentro de um período de vigência.

### Características

- **Período de Vigência**: Define data de início e fim (ou indefinido)
- **Dias da Semana**: Seleciona quais dias da semana o padrão se aplica
- **Horários**: Define horário de início e fim
- **Duração dos Slots**: Configura duração de cada slot (15, 30, 45 ou 60 minutos)
- **Tipo de Serviço**: Diferencia entre plantão e mentoria

### Como Usar

1. Acesse **Configurações > Disponibilidade**
2. Clique em **Novo Padrão de Recorrência**
3. Siga o wizard:
   - **Passo 1**: Selecione o tipo de serviço
   - **Passo 2**: Defina o período de vigência
   - **Passo 3**: Selecione os dias da semana
   - **Passo 4**: Configure horários e duração dos slots
   - **Passo 5**: Revise e confirme

### Exemplo

```typescript
{
  tipo_servico: 'mentoria',
  data_inicio: '2025-01-01',
  data_fim: null, // Indefinido
  dias_semana: [1, 3, 5], // Segunda, Quarta, Sexta
  hora_inicio: '09:00',
  hora_fim: '18:00',
  duracao_slot_minutos: 30
}
```

## Bloqueios de Agenda

### Visão Geral

Bloqueios permitem impedir agendamentos em períodos específicos, como feriados, recessos ou imprevistos.

### Tipos de Bloqueio

- **Feriado**: Feriados nacionais ou regionais
- **Recesso**: Períodos de recesso escolar
- **Imprevisto**: Situações inesperadas
- **Outro**: Outros motivos

### Escopo

- **Pessoal**: Afeta apenas o professor que criou
- **Empresa**: Afeta todos os professores da empresa (apenas admins)

### Como Usar

1. Acesse **Agendamentos > Bloqueios**
2. Clique em **Novo Bloqueio**
3. Preencha:
   - Tipo de bloqueio
   - Data e horário de início
   - Data e horário de fim
   - Motivo (opcional)
   - Escopo (pessoal ou empresa)
4. O sistema mostrará quantos agendamentos serão afetados

### Notificações

Quando um bloqueio afeta agendamentos existentes, os alunos são notificados automaticamente.

## Intervalos Personalizados

### Visão Geral

Permite configurar durações diferentes de slots para plantão e mentoria.

### Configuração

1. Acesse **Configurações > Avançadas**
2. Configure:
   - **Duração Slot Plantão**: 15, 30, 45 ou 60 minutos
   - **Duração Slot Mentoria**: 15, 30, 45 ou 60 minutos
   - **Permitir Ajuste de Intervalos**: Permite ajustar por padrão de recorrência

### Uso em Padrões de Recorrência

Cada padrão de recorrência pode ter sua própria duração de slot, permitindo flexibilidade máxima.

## Visualização Compartilhada

### Visão Geral

Professores podem visualizar agendamentos de todos os professores da mesma empresa em um calendário compartilhado.

### Funcionalidades

- **Visualização Semanal/Mensal**: Alterna entre visualização semanal e mensal
- **Filtros**: Filtra por professor e status
- **Indicadores Visuais**: Cores diferentes para cada status
- **Disponibilidade**: Mostra disponibilidade de cada professor

### Como Acessar

1. Acesse **Agendamentos > Calendário Compartilhado**
2. Use os filtros para personalizar a visualização
3. Navegue entre semanas/meses usando as setas

## Sistema de Relatórios

### Visão Geral

Gere relatórios detalhados de agendamentos com métricas e análises.

### Tipos de Relatório

- **Mensal**: Relatório mensal completo
- **Semanal**: Relatório semanal
- **Customizado**: Período personalizado

### Métricas Incluídas

- **Total de Agendamentos**: Quantidade total no período
- **Distribuição por Status**: Confirmados, pendentes, concluídos, cancelados
- **Taxa de Ocupação**: Percentual de slots ocupados
- **Taxa de Comparecimento**: Percentual de agendamentos concluídos
- **Desempenho por Professor**: Estatísticas individuais
- **Horários de Pico**: Horários mais ocupados

### Como Gerar

1. Acesse **Agendamentos > Relatórios**
2. Selecione:
   - Data de início
   - Data de fim
   - Tipo de relatório
3. Clique em **Gerar Relatório**
4. Visualize os detalhes e exporte se necessário

### Exportação

Os relatórios podem ser exportados em PDF ou Excel (funcionalidade futura).

## Notificações Avançadas

### Novos Tipos

- **Bloqueio Criado**: Notifica quando bloqueio afeta agendamentos
- **Recorrência Alterada**: Notifica sobre mudanças de disponibilidade
- **Substituição Solicitada**: Notifica sobre solicitações de substituição

### Configuração de Lembretes

Configure múltiplos lembretes:
- 24 horas antes
- 1 hora antes
- Personalizado

### Templates Personalizados

Os templates de e-mail podem ser personalizados por empresa, incluindo logo, cores e assinatura.

## Melhores Práticas

### Recorrência

1. **Defina Períodos Claros**: Use períodos de vigência específicos quando possível
2. **Revise Regularmente**: Atualize padrões conforme necessário
3. **Use Tipos de Serviço**: Diferencie entre plantão e mentoria

### Bloqueios

1. **Crie com Antecedência**: Crie bloqueios o quanto antes possível
2. **Use o Escopo Correto**: Pessoal para você, empresa para todos
3. **Informe o Motivo**: Sempre preencha o motivo para referência

### Relatórios

1. **Gere Regularmente**: Gere relatórios mensais para acompanhamento
2. **Analise Tendências**: Use relatórios para identificar padrões
3. **Compartilhe com Equipe**: Compartilhe insights com a equipe

## Troubleshooting

### Slots não aparecem

- Verifique se há padrão de recorrência ativo para o dia
- Verifique se não há bloqueios no período
- Confirme que a data está dentro do período de vigência

### Bloqueio não afeta agendamentos

- Verifique o escopo do bloqueio (pessoal vs empresa)
- Confirme que os agendamentos estão no período bloqueado
- Verifique se os agendamentos não foram cancelados

### Relatório vazio

- Verifique o período selecionado
- Confirme que há agendamentos no período
- Verifique permissões de acesso

## Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs do sistema
3. Entre em contato com o suporte técnico

