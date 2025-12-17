# Guia de Migração de Agendamentos

Este documento descreve o processo de migração do sistema de disponibilidade semanal para o novo sistema de recorrência anual.

## Visão Geral

A migração move dados de `agendamento_disponibilidade` (modelo semanal) para `agendamento_recorrencia` (modelo anual com períodos de vigência).

## Pré-requisitos

1. Todas as migrações de banco de dados foram aplicadas
2. Backup completo do banco de dados
3. Ambiente de staging/teste validado

## Passo a Passo

### 1. Backup

Execute um backup completo do banco de dados antes de iniciar:

```bash
# Usando Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Ou usando pg_dump diretamente
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Validação Pré-Migração

Verifique se há dados para migrar:

```sql
SELECT COUNT(*) 
FROM agendamento_disponibilidade 
WHERE ativo = true;
```

### 3. Executar Migração

#### Modo Dry-Run (Recomendado primeiro)

Execute em modo de teste para verificar o que será migrado:

```bash
npx tsx scripts/migrate-agendamentos.ts --dry-run
```

#### Modo Produção

Após validar o dry-run, execute a migração real:

```bash
npx tsx scripts/migrate-agendamentos.ts
```

O script irá:
- Criar backup automático dos dados
- Migrar registros de `agendamento_disponibilidade` para `agendamento_recorrencia`
- Validar integridade dos dados
- Gerar relatório de estatísticas

### 4. Validação Pós-Migração

Verifique os dados migrados:

```sql
-- Contar recorrências criadas
SELECT COUNT(*) 
FROM agendamento_recorrencia 
WHERE created_at >= CURRENT_DATE;

-- Verificar se todas têm empresa_id
SELECT COUNT(*) 
FROM agendamento_recorrencia 
WHERE empresa_id IS NULL;

-- Verificar integridade referencial
SELECT COUNT(*) 
FROM agendamento_recorrencia ar
LEFT JOIN professores p ON p.id = ar.professor_id
WHERE p.id IS NULL;
```

### 5. Testar Funcionalidades

1. **Criar novo agendamento**: Verifique se os slots são gerados corretamente
2. **Visualizar disponibilidade**: Confirme que os horários aparecem corretamente
3. **Criar bloqueio**: Teste se bloqueios funcionam com o novo modelo
4. **Gerar relatório**: Valide que relatórios funcionam corretamente

### 6. Rollback (Se Necessário)

Se houver problemas, execute rollback:

```bash
npx tsx scripts/migrate-agendamentos.ts --rollback=backups/agendamento_disponibilidade_TIMESTAMP.json
```

## Mapeamento de Dados

| Campo Antigo | Campo Novo | Observações |
|--------------|------------|-------------|
| `dia_semana` | `dia_semana` | Mantido igual (0-6) |
| `hora_inicio` | `hora_inicio` | Mantido igual |
| `hora_fim` | `hora_fim` | Mantido igual |
| `ativo` | `ativo` | Mantido igual |
| - | `tipo_servico` | Padrão: 'plantao' |
| - | `data_inicio` | Data atual da migração |
| - | `data_fim` | NULL (recorrência indefinida) |
| - | `duracao_slot_minutos` | Padrão: 30 |
| - | `empresa_id` | Obtido de `professores.empresa_id` |

## Troubleshooting

### Erro: "empresa_id is null"

**Causa**: Professor sem empresa_id associado.

**Solução**: 
```sql
-- Verificar professores sem empresa_id
SELECT id, nome_completo 
FROM professores 
WHERE empresa_id IS NULL;

-- Atualizar manualmente ou excluir disponibilidades órfãs
```

### Erro: "Foreign key constraint"

**Causa**: Referência inválida a professor ou empresa.

**Solução**: Validar integridade referencial antes da migração.

### Dados duplicados após migração

**Causa**: Migração executada múltiplas vezes.

**Solução**: 
```sql
-- Remover duplicatas
DELETE FROM agendamento_recorrencia
WHERE id NOT IN (
  SELECT MIN(id)
  FROM agendamento_recorrencia
  GROUP BY professor_id, dia_semana, hora_inicio, hora_fim, data_inicio
);
```

## Checklist de Validação

- [ ] Backup criado
- [ ] Dry-run executado sem erros
- [ ] Migração executada com sucesso
- [ ] Validação pós-migração passou
- [ ] Testes funcionais executados
- [ ] Dados antigos mantidos para referência (opcional)
- [ ] Documentação atualizada

## Notas Importantes

1. **Compatibilidade Retroativa**: A tabela `agendamento_disponibilidade` é mantida para compatibilidade, mas não deve ser usada para novos registros.

2. **Período de Transição**: Durante o período de transição, ambos os modelos podem coexistir. O sistema prioriza `agendamento_recorrencia`.

3. **Deprecação**: A tabela `agendamento_disponibilidade` será removida em versão futura após período de estabilização.

## Suporte

Em caso de problemas durante a migração:
1. Verifique os logs do script
2. Consulte a seção de Troubleshooting
3. Execute rollback se necessário
4. Entre em contato com a equipe de desenvolvimento

