#!/usr/bin/env tsx
/**
 * Script de Migração de Agendamentos
 * 
 * Este script migra dados de agendamento_disponibilidade para agendamento_recorrencia
 * e valida a integridade dos dados após a migração.
 * 
 * Uso:
 *   npx tsx scripts/migrate-agendamentos.ts [--dry-run] [--rollback]
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface MigrationStats {
  totalDisponibilidade: number
  totalRecorrencia: number
  migrated: number
  errors: number
  startTime: Date
  endTime?: Date
}

async function createBackup(): Promise<string> {
  console.log('📦 Criando backup...')
  
  const { data: disponibilidade, error } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')

  if (error) {
    throw new Error(`Erro ao criar backup: ${error.message}`)
  }

  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `agendamento_disponibilidade_${timestamp}.json`)
  
  fs.writeFileSync(backupFile, JSON.stringify(disponibilidade, null, 2))
  console.log(`✅ Backup criado: ${backupFile}`)
  
  return backupFile
}

async function validateMigration(_stats: MigrationStats): Promise<boolean> {
  console.log('🔍 Validando migração...')
  
  // Verificar se todos os registros foram migrados
  const { count: countDisponibilidade } = await supabase
    .from('agendamento_disponibilidade')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)

  const { count: countRecorrencia } = await supabase
    .from('agendamento_recorrencia')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)

  console.log(`   Disponibilidade ativa: ${countDisponibilidade}`)
  console.log(`   Recorrência ativa: ${countRecorrencia}`)

  // Verificar integridade referencial
  const { data: professores, error: profError } = await supabase
    .from('professores')
    .select('id, empresa_id')

  if (profError) {
    console.error('❌ Erro ao validar professores:', profError)
    return false
  }

  const { data: recorrencias, error: recError } = await supabase
    .from('agendamento_recorrencia')
    .select('professor_id, empresa_id')

  if (recError) {
    console.error('❌ Erro ao validar recorrências:', recError)
    return false
  }

  // Verificar se todas as recorrências têm empresa_id válido
  const professoresMap = new Map(professores?.map(p => [p.id, p.empresa_id]) || [])
  const invalidRecorrencias = recorrencias?.filter(
    r => !professoresMap.has(r.professor_id) || !r.empresa_id
  ) || []

  if (invalidRecorrencias.length > 0) {
    console.error(`❌ Encontradas ${invalidRecorrencias.length} recorrências com empresa_id inválido`)
    return false
  }

  console.log('✅ Validação concluída com sucesso')
  return true
}

async function rollback(backupFile: string): Promise<void> {
  console.log('🔄 Iniciando rollback...')
  
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Arquivo de backup não encontrado: ${backupFile}`)
  }

  const _backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))

  // Deletar recorrências criadas na migração
  const { error: deleteError } = await supabase
    .from('agendamento_recorrencia')
    .delete()
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (deleteError) {
    throw new Error(`Erro ao fazer rollback: ${deleteError.message}`)
  }

  console.log('✅ Rollback concluído')
}

async function migrate(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalDisponibilidade: 0,
    totalRecorrencia: 0,
    migrated: 0,
    errors: 0,
    startTime: new Date(),
  }

  console.log('🚀 Iniciando migração...')
  console.log(`   Modo: ${dryRun ? 'DRY RUN (sem alterações)' : 'PRODUÇÃO'}`)

  // Criar backup
  const backupFile = await createBackup()

  try {
    // Contar registros existentes
    const { count, error: countError } = await supabase
      .from('agendamento_disponibilidade')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)

    if (countError) throw countError
    stats.totalDisponibilidade = count || 0

    // Buscar disponibilidades
    const { data: disponibilidades, error: fetchError } = await supabase
      .from('agendamento_disponibilidade')
      .select(`
        *,
        professor:professores!agendamento_disponibilidade_professor_id_fkey(id, empresa_id)
      `)
      .eq('ativo', true)

    if (fetchError) throw fetchError

    if (!disponibilidades || disponibilidades.length === 0) {
      console.log('ℹ️  Nenhuma disponibilidade ativa encontrada')
      return stats
    }

    interface ProfessorData {
      empresa_id: string;
      [key: string]: unknown;
    }
    interface DisponibilidadeWithProfessor {
      professor: ProfessorData | null;
      professor_id: string;
      dia_semana: number;
      hora_inicio: string;
      hora_fim: string;
      [key: string]: unknown;
    }
    // Preparar dados para migração
    const recorrencias = (disponibilidades as DisponibilidadeWithProfessor[])
      .filter(d => {
        const prof = d.professor as ProfessorData | null
        return prof && prof.empresa_id
      })
      .map(d => {
        const prof = d.professor as ProfessorData
        return {
          professor_id: d.professor_id,
          empresa_id: prof.empresa_id,
          tipo_servico: 'plantao' as const,
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: null,
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio,
          hora_fim: d.hora_fim,
          duracao_slot_minutos: 30,
          ativo: d.ativo,
        }
      })

    console.log(`📊 Preparando migração de ${recorrencias.length} registros...`)

    if (dryRun) {
      console.log('   [DRY RUN] Registros que seriam migrados:')
      recorrencias.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. Professor ${r.professor_id}, Dia ${r.dia_semana}, ${r.hora_inicio}-${r.hora_fim}`)
      })
      if (recorrencias.length > 5) {
        console.log(`   ... e mais ${recorrencias.length - 5} registros`)
      }
      stats.migrated = recorrencias.length
    } else {
      // Inserir em lotes de 100
      const batchSize = 100
      for (let i = 0; i < recorrencias.length; i += batchSize) {
        const batch = recorrencias.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('agendamento_recorrencia')
          .insert(batch)

        if (insertError) {
          console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, insertError)
          stats.errors += batch.length
        } else {
          stats.migrated += batch.length
          console.log(`   ✅ Lote ${i / batchSize + 1} migrado (${stats.migrated}/${recorrencias.length})`)
        }
      }
    }

    stats.endTime = new Date()
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000

    console.log('\n📈 Estatísticas da Migração:')
    console.log(`   Total de disponibilidades: ${stats.totalDisponibilidade}`)
    console.log(`   Migradas: ${stats.migrated}`)
    console.log(`   Erros: ${stats.errors}`)
    console.log(`   Duração: ${duration.toFixed(2)}s`)

    if (!dryRun) {
      const isValid = await validateMigration(stats)
      if (!isValid) {
        console.log('\n⚠️  Validação falhou. Considere fazer rollback.')
        console.log(`   Rollback: npx tsx scripts/migrate-agendamentos.ts --rollback ${backupFile}`)
      }
    }

    return stats
  } catch (error) {
    console.error('❌ Erro durante migração:', error)
    stats.errors++
    stats.endTime = new Date()
    
    if (!dryRun) {
      console.log('\n⚠️  Erro detectado. Rollback disponível:')
      console.log(`   npx tsx scripts/migrate-agendamentos.ts --rollback ${backupFile}`)
    }
    
    throw error
  }
}

// Main
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const rollbackArg = args.find(arg => arg.startsWith('--rollback'))

if (rollbackArg) {
  const backupFile = rollbackArg.split('=')[1] || args[args.indexOf('--rollback') + 1]
  rollback(backupFile)
    .then(() => {
      console.log('✅ Rollback concluído com sucesso')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro no rollback:', error)
      process.exit(1)
    })
} else {
  migrate(dryRun)
    .then(() => {
      console.log('\n✅ Migração concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Migração falhou:', error)
      process.exit(1)
    })
}

