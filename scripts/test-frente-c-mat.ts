/**
 * Script temporário para testar as aulas da Frente C (Mat)
 * Execute com: npx tsx scripts/test-frente-c-mat.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const FRENTE_C_MAT_ID = '1fa799f1-8be0-4325-99f1-aed66520a2b7'
const DISCIPLINA_MAT_ID = '53b4164b-c3cb-43e2-bb1a-ce1a1890729e'

async function main() {
  console.log('🔍 Testando aulas da Frente C (Mat)...\n')

  // Query 1: Verificar módulos da Frente C (Mat) e suas aulas
  console.log('1️⃣ Verificando módulos da Frente C (Mat) e suas aulas...')
  const { data: modulosData, error: modulosError } = await supabase
    .from('modulos')
    .select(`
      id,
      nome,
      curso_id,
      aulas (
        id,
        nome,
        prioridade
      )
    `)
    .eq('frente_id', FRENTE_C_MAT_ID)

  if (modulosError) {
    console.error('❌ Erro ao buscar módulos:', modulosError)
    return
  }

  console.log(`   ✅ Encontrados ${modulosData?.length || 0} módulos\n`)
  
  modulosData?.forEach((modulo: any) => {
    const totalAulas = modulo.aulas?.length || 0
    const aulasPrioridadeMaiorIgual1 = modulo.aulas?.filter((a: any) => a.prioridade >= 1 && a.prioridade != 0).length || 0
    const aulasPrioridadeZero = modulo.aulas?.filter((a: any) => a.prioridade === 0).length || 0
    const aulasPrioridadeNull = modulo.aulas?.filter((a: any) => a.prioridade === null || a.prioridade === undefined).length || 0
    
    console.log(`   📦 ${modulo.nome} (${modulo.id})`)
    console.log(`      Total de aulas: ${totalAulas}`)
    console.log(`      Prioridade >= 1: ${aulasPrioridadeMaiorIgual1} ✅`)
    console.log(`      Prioridade = 0: ${aulasPrioridadeZero} ❌`)
    console.log(`      Prioridade NULL: ${aulasPrioridadeNull} ❌`)
    console.log('')
  })

  // Query 2: Resumo de prioridades
  console.log('2️⃣ Resumo de prioridades na Frente C (Mat)...')
  const todasAulas: any[] = []
  modulosData?.forEach((modulo: any) => {
    if (modulo.aulas) {
      modulo.aulas.forEach((aula: any) => {
        todasAulas.push({
          ...aula,
          modulo_nome: modulo.nome
        })
      })
    }
  })

  const resumo = {
    total: todasAulas.length,
    prioridade_maior_igual_1: todasAulas.filter(a => a.prioridade >= 1 && a.prioridade != 0).length,
    prioridade_zero: todasAulas.filter(a => a.prioridade === 0).length,
    prioridade_null: todasAulas.filter(a => a.prioridade === null || a.prioridade === undefined).length,
    prioridade_menor_1: todasAulas.filter(a => a.prioridade !== null && a.prioridade !== undefined && a.prioridade < 1 && a.prioridade != 0).length
  }

  console.log(`   Total de aulas: ${resumo.total}`)
  console.log(`   ✅ Prioridade >= 1: ${resumo.prioridade_maior_igual_1} (serão incluídas)`)
  console.log(`   ❌ Prioridade = 0: ${resumo.prioridade_zero} (serão excluídas)`)
  console.log(`   ❌ Prioridade NULL: ${resumo.prioridade_null} (serão excluídas)`)
  console.log(`   ❌ Prioridade < 1: ${resumo.prioridade_menor_1} (serão excluídas)`)
  console.log('')

  // Query 3: Comparar com outras frentes de Matemática
  console.log('3️⃣ Comparando com outras frentes de Matemática...')
  const { data: frentesData, error: frentesError } = await supabase
    .from('frentes')
    .select(`
      id,
      nome,
      modulos (
        id,
        aulas (
          id,
          prioridade
        )
      )
    `)
    .eq('disciplina_id', DISCIPLINA_MAT_ID)

  if (frentesError) {
    console.error('❌ Erro ao buscar frentes:', frentesError)
    return
  }

  console.log('')
  frentesData?.forEach((frente: any) => {
    const todasAulasFrente: any[] = []
    frente.modulos?.forEach((modulo: any) => {
      if (modulo.aulas) {
        todasAulasFrente.push(...modulo.aulas)
      }
    })

    const totalAulas = todasAulasFrente.length
    const aulasIncluidas = todasAulasFrente.filter((a: any) => a.prioridade >= 1 && a.prioridade != 0).length
    const aulasExcluidas = totalAulas - aulasIncluidas

    const status = frente.id === FRENTE_C_MAT_ID ? '🔴' : aulasIncluidas > 0 ? '✅' : '⚠️'
    
    console.log(`${status} ${frente.nome} (${frente.id})`)
    console.log(`   Total de aulas: ${totalAulas}`)
    console.log(`   Aulas incluídas (prioridade >= 1): ${aulasIncluidas}`)
    console.log(`   Aulas excluídas: ${aulasExcluidas}`)
    console.log('')
  })

  // Conclusão
  console.log('📊 CONCLUSÃO:')
  if (resumo.prioridade_maior_igual_1 === 0) {
    console.log('❌ PROBLEMA IDENTIFICADO:')
    console.log(`   A Frente C (Mat) tem ${resumo.total} aulas, mas NENHUMA tem prioridade >= 1.`)
    console.log(`   Por isso, nenhuma aula é incluída no cronograma.`)
    console.log('')
    console.log('💡 SOLUÇÃO:')
    console.log('   Atualize as prioridades das aulas da Frente C (Mat) no banco de dados.')
    console.log('   Execute: UPDATE aulas SET prioridade = 1 WHERE modulo_id IN (SELECT id FROM modulos WHERE frente_id = \'' + FRENTE_C_MAT_ID + '\') AND (prioridade = 0 OR prioridade IS NULL)')
  } else {
    console.log(`✅ A Frente C (Mat) tem ${resumo.prioridade_maior_igual_1} aulas com prioridade >= 1 que serão incluídas.`)
  }
}

main().catch(console.error)










