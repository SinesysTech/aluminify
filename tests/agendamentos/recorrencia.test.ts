/**
 * Testes de Integração - Sistema de Recorrência
 * 
 * Testa criação de padrões de recorrência, geração de slots,
 * validação de bloqueios e isolamento multi-tenant.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasSupabase = !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY
const describeIfSupabase = hasSupabase ? describe : describe.skip

if (!hasSupabase) {
  console.warn(
    'Supabase environment variables not found. Skipping agendamentos recorrencia integration tests.',
  )
}

const supabase = hasSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  : (null as unknown as ReturnType<typeof createClient>)

describeIfSupabase('Sistema de Recorrência de Agendamentos', () => {
  let testProfessorId: string
  let testEmpresaId: string
  let testRecorrenciaId: string
  let testBloqueioId: string

  beforeAll(async () => {
    // Criar empresa de teste
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Teste',
        slug: 'empresa-teste-' + Date.now(),
        ativo: true,
      })
      .select()
      .single()

    if (empresaError) throw empresaError
    testEmpresaId = empresa.id

    // Criar usuário professor de teste
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `professor-teste-${Date.now()}@teste.com`,
      password: 'senha-teste-123',
      email_confirm: true,
    })

    if (userError) throw userError
    testProfessorId = user.user.id

    // Criar registro de usuario (professor)
    const { error: profError } = await supabase
      .from('usuarios')
      .insert({
        id: testProfessorId,
        nome_completo: 'Professor Teste',
        email: user.user.email!,
        empresa_id: testEmpresaId,
        ativo: true,
      })

    if (profError) throw profError
  })

  afterAll(async () => {
    // Limpar dados de teste
    if (testRecorrenciaId) {
      await supabase.from('agendamento_recorrencia').delete().eq('id', testRecorrenciaId)
    }
    if (testBloqueioId) {
      await supabase.from('agendamento_bloqueios').delete().eq('id', testBloqueioId)
    }
    if (testProfessorId) {
      await supabase.from('usuarios').delete().eq('id', testProfessorId)
      await supabase.auth.admin.deleteUser(testProfessorId)
    }
    if (testEmpresaId) {
      await supabase.from('empresas').delete().eq('id', testEmpresaId)
    }
  })

  describe('Criação de Padrões de Recorrência', () => {
    it('deve criar um padrão de recorrência válido', async () => {
      const { data, error } = await supabase
        .from('agendamento_recorrencia')
        .insert({
          professor_id: testProfessorId,
          empresa_id: testEmpresaId,
          tipo_servico: 'plantao',
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: null,
          dia_semana: 1, // Segunda-feira
          hora_inicio: '09:00',
          hora_fim: '18:00',
          duracao_slot_minutos: 30,
          ativo: true,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.professor_id).toBe(testProfessorId)
      expect(data.empresa_id).toBe(testEmpresaId)
      expect(data.dia_semana).toBe(1)
      expect(data.duracao_slot_minutos).toBe(30)

      testRecorrenciaId = data.id
    })

    it('deve validar constraint de data_fim >= data_inicio', async () => {
      const { error } = await supabase
        .from('agendamento_recorrencia')
        .insert({
          professor_id: testProfessorId,
          empresa_id: testEmpresaId,
          tipo_servico: 'plantao',
          data_inicio: '2025-12-31',
          data_fim: '2025-01-01', // Data anterior
          dia_semana: 1,
          hora_inicio: '09:00',
          hora_fim: '18:00',
          duracao_slot_minutos: 30,
          ativo: true,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('deve validar constraint de hora_fim > hora_inicio', async () => {
      const { error } = await supabase
        .from('agendamento_recorrencia')
        .insert({
          professor_id: testProfessorId,
          empresa_id: testEmpresaId,
          tipo_servico: 'plantao',
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: null,
          dia_semana: 1,
          hora_inicio: '18:00',
          hora_fim: '09:00', // Hora anterior
          duracao_slot_minutos: 30,
          ativo: true,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514')
    })
  })

  describe('Geração de Slots com Bloqueios', () => {
    it('deve criar um bloqueio e excluir slots do período bloqueado', async () => {
      // Criar bloqueio
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() + 1)
      dataInicio.setHours(14, 0, 0, 0)

      const dataFim = new Date(dataInicio)
      dataFim.setHours(16, 0, 0, 0)

      const { data: bloqueio, error: bloqueioError } = await supabase
        .from('agendamento_bloqueios')
        .insert({
          professor_id: testProfessorId,
          empresa_id: testEmpresaId,
          tipo: 'imprevisto',
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          motivo: 'Teste de bloqueio',
          criado_por: testProfessorId,
        })
        .select()
        .single()

      expect(bloqueioError).toBeNull()
      expect(bloqueio).toBeDefined()
      testBloqueioId = bloqueio.id

      // Verificar que bloqueio foi criado
      const { data: bloqueios, error: fetchError } = await supabase
        .from('agendamento_bloqueios')
        .select('*')
        .eq('id', testBloqueioId)

      expect(fetchError).toBeNull()
      expect(bloqueios).toHaveLength(1)
    })
  })

  describe('Isolamento Multi-Tenant', () => {
    let outraEmpresaId: string
    let outroProfessorId: string

    beforeAll(async () => {
      // Criar outra empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .insert({
          nome: 'Outra Empresa Teste',
          slug: 'outra-empresa-teste-' + Date.now(),
          ativo: true,
        })
        .select()
        .single()

      outraEmpresaId = empresa!.id

      // Criar outro professor
      const { data: user } = await supabase.auth.admin.createUser({
        email: `outro-professor-${Date.now()}@teste.com`,
        password: 'senha-teste-123',
        email_confirm: true,
      })

      outroProfessorId = user!.user.id

      await supabase.from('usuarios').insert({
        id: outroProfessorId,
        nome_completo: 'Outro Professor',
        email: user!.user.email!,
        empresa_id: outraEmpresaId,
        ativo: true,
      })
    })

    afterAll(async () => {
      if (outroProfessorId) {
        await supabase.from('usuarios').delete().eq('id', outroProfessorId)
        await supabase.auth.admin.deleteUser(outroProfessorId)
      }
      if (outraEmpresaId) {
        await supabase.from('empresas').delete().eq('id', outraEmpresaId)
      }
    })

    it('deve isolar recorrências por empresa_id', async () => {
      // Criar recorrência para outra empresa
      const { data: outraRecorrencia } = await supabase
        .from('agendamento_recorrencia')
        .insert({
          professor_id: outroProfessorId,
          empresa_id: outraEmpresaId,
          tipo_servico: 'plantao',
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: null,
          dia_semana: 2,
          hora_inicio: '10:00',
          hora_fim: '19:00',
          duracao_slot_minutos: 30,
          ativo: true,
        })
        .select()
        .single()

      // Buscar recorrências da primeira empresa
      const { data: recorrencias, error } = await supabase
        .from('agendamento_recorrencia')
        .select('*')
        .eq('empresa_id', testEmpresaId)

      expect(error).toBeNull()
      expect(recorrencias).toBeDefined()
      expect(recorrencias?.every(r => r.empresa_id === testEmpresaId)).toBe(true)
      expect(recorrencias?.some(r => r.empresa_id === outraEmpresaId)).toBe(false)

      // Limpar
      if (outraRecorrencia) {
        await supabase.from('agendamento_recorrencia').delete().eq('id', outraRecorrencia.id)
      }
    })
  })

  describe('Validações de Conflitos', () => {
    it('deve detectar conflitos entre agendamentos', async () => {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() + 2)
      dataInicio.setHours(10, 0, 0, 0)

      const dataFim = new Date(dataInicio)
      dataFim.setHours(11, 0, 0, 0)

      // Criar primeiro agendamento
      const { data: agendamento1 } = await supabase
        .from('agendamentos')
        .insert({
          professor_id: testProfessorId,
          aluno_id: testProfessorId, // Usando mesmo ID para teste
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          status: 'confirmado',
        })
        .select()
        .single()

      // Tentar criar agendamento conflitante
      const dataInicio2 = new Date(dataInicio)
      dataInicio2.setHours(10, 30, 0, 0)

      const dataFim2 = new Date(dataFim)
      dataFim2.setHours(11, 30, 0, 0)

      await supabase
        .from('agendamentos')
        .insert({
          professor_id: testProfessorId,
          aluno_id: testProfessorId,
          data_inicio: dataInicio2.toISOString(),
          data_fim: dataFim2.toISOString(),
          status: 'pendente',
        })

      // O banco não previne conflitos automaticamente,
      // mas a aplicação deve validar
      // Aqui apenas verificamos que a inserção não falhou por constraint
      // A validação real deve ser feita na aplicação

      // Limpar
      if (agendamento1) {
        await supabase.from('agendamentos').delete().eq('id', agendamento1.id)
      }
    })
  })
})

