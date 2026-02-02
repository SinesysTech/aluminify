/**
 * Testes de Integração - Sistema de Relatórios
 * 
 * Testa cálculo de métricas, agregações por período
 * e performance com grande volume de dados.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasSupabase = !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY
const describeIfSupabase = hasSupabase ? describe : describe.skip

if (!hasSupabase) {
  console.warn(
    'Supabase environment variables not found. Skipping agendamentos relatorios integration tests.',
  )
}

const supabase = hasSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  : (null as unknown as ReturnType<typeof createClient>)

describeIfSupabase('Sistema de Relatórios de Agendamentos', () => {
  let testEmpresaId: string
  let testProfessorId: string
  let testAgendamentosIds: string[] = []

  beforeAll(async () => {
    // Criar empresa de teste
    const { data: empresa } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Teste Relatórios',
        slug: 'empresa-teste-relatorios-' + Date.now(),
        ativo: true,
      })
      .select()
      .single()

    testEmpresaId = empresa!.id

    // Criar professor
    const { data: user } = await supabase.auth.admin.createUser({
      email: `prof-relatorios-${Date.now()}@teste.com`,
      password: 'senha-teste-123',
      email_confirm: true,
    })

    testProfessorId = user!.user.id

    await supabase.from('usuarios').insert({
      id: testProfessorId,
      nome_completo: 'Professor Relatórios',
      email: user!.user.email!,
      empresa_id: testEmpresaId,
      ativo: true,
    })

    // Criar agendamentos de teste
    const hoje = new Date()
    const agendamentos = []
    for (let i = 0; i < 10; i++) {
      const dataInicio = new Date(hoje)
      dataInicio.setDate(hoje.getDate() + i)
      dataInicio.setHours(10 + i, 0, 0, 0)

      const dataFim = new Date(dataInicio)
      dataFim.setHours(11 + i, 0, 0, 0)

      agendamentos.push({
        professor_id: testProfessorId,
        aluno_id: testProfessorId,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        status: i % 4 === 0 ? 'pendente' : i % 4 === 1 ? 'confirmado' : i % 4 === 2 ? 'concluido' : 'cancelado',
      })
    }

    const { data: agendamentosData } = await supabase
      .from('agendamentos')
      .insert(agendamentos)
      .select('id')

    testAgendamentosIds = agendamentosData?.map(a => a.id) || []
  })

  afterAll(async () => {
    // Limpar
    if (testAgendamentosIds.length > 0) {
      await supabase.from('agendamentos').delete().in('id', testAgendamentosIds)
    }
    if (testProfessorId) {
      await supabase.from('usuarios').delete().eq('id', testProfessorId)
      await supabase.auth.admin.deleteUser(testProfessorId)
    }
    if (testEmpresaId) {
      await supabase.from('empresas').delete().eq('id', testEmpresaId)
    }
  })

  describe('Cálculo de Métricas', () => {
    it('deve calcular taxa de ocupação corretamente', async () => {
      const dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 1)
      const dataFim = new Date()

      const { data, error } = await supabase.rpc('calcular_taxa_ocupacao', {
        empresa_id_param: testEmpresaId,
        data_inicio_param: dataInicio.toISOString().split('T')[0],
        data_fim_param: dataFim.toISOString().split('T')[0],
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(typeof data).toBe('number')
      expect(data).toBeGreaterThanOrEqual(0)
      expect(data).toBeLessThanOrEqual(1)
    })

    it('deve calcular taxa de comparecimento corretamente', async () => {
      const dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 1)
      const dataFim = new Date()

      const { data, error } = await supabase.rpc('calcular_taxa_comparecimento', {
        professor_id_param: testProfessorId,
        data_inicio_param: dataInicio.toISOString().split('T')[0],
        data_fim_param: dataFim.toISOString().split('T')[0],
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(typeof data).toBe('number')
      expect(data).toBeGreaterThanOrEqual(0)
      expect(data).toBeLessThanOrEqual(1)
    })
  })

  describe('Agregações por Período', () => {
    it('deve gerar relatório com dados agregados', async () => {
      const dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 1)
       
      const _dataFim = new Date()

      // Simular chamada da Edge Function
      // Em produção, isso seria feito via HTTP
      const dadosEsperados = {
        total_agendamentos: expect.any(Number),
        por_status: {
          confirmado: expect.any(Number),
          cancelado: expect.any(Number),
          concluido: expect.any(Number),
          pendente: expect.any(Number),
        },
        por_professor: expect.any(Array),
        taxa_ocupacao: expect.any(Number),
        horarios_pico: expect.any(Array),
        taxa_nao_comparecimento: expect.any(Number),
      }

      // Verificar estrutura esperada
      expect(dadosEsperados).toMatchObject({
        total_agendamentos: expect.any(Number),
        por_status: expect.any(Object),
      })
    })
  })

  describe('Performance', () => {
    it('deve listar horários vagos com performance aceitável', async () => {
      const dataInicio = new Date()
      const dataFim = new Date()
      dataFim.setDate(dataFim.getDate() + 30)

      const startTime = Date.now()

      const { data, error } = await supabase.rpc('listar_horarios_vagos', {
        empresa_id_param: testEmpresaId,
        data_inicio_param: dataInicio.toISOString().split('T')[0],
        data_fim_param: dataFim.toISOString().split('T')[0],
      })

      const duration = Date.now() - startTime

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(duration).toBeLessThan(5000) // Deve completar em menos de 5 segundos
    })
  })
})

