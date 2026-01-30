import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { getDatabaseClient, getDatabaseClientAsUser } from '@/app/shared/core/database/database'
import { pdf, Document } from '@react-pdf/renderer'
import React from 'react'
import { fetchCronogramaCompleto } from '@/app/[tenant]/(modules)/cronograma/lib/cronograma-export-utils'
import type { CronogramaExport } from './pdf-types'
import { asNumberSafe, normalizePeriodosFerias } from './pdf-types'
import { calculateOverallStats, groupItemsByWeeks } from './pdf-data'
import { CoverPage, WeekPage, SummaryPage } from './pdf-pages'
// Side-effect: registers fonts (Inter, Plus Jakarta Sans)
import './pdf-theme'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function getHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cronogramaId = String(params.id)
  if (!cronogramaId) return NextResponse.json({ error: 'cronograma_id é obrigatório' }, { status: 400 })

  // Auth
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = getDatabaseClientAsUser(token)
  const { data: owner } = await client
    .from('cronogramas')
    .select('usuario_id')
    .eq('id', cronogramaId)
    .single()

  const typedOwner = owner as { usuario_id: string } | null
  if (!typedOwner || typedOwner.usuario_id !== request.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Buscar nome do aluno
  let alunoNome = 'Aluno'
  try {
    const { data: userData } = await client
      .from('usuarios')
      .select('nome_completo, email')
      .eq('id', typedOwner.usuario_id)
      .maybeSingle<{ nome_completo: string | null; email: string }>()
    if (userData) {
      alunoNome = userData.nome_completo || userData.email || 'Aluno'
    }
  } catch {
    // Nome do aluno não é crítico
  }

  // Data
  const { cronograma, itens } = await fetchCronogramaCompleto(cronogramaId, client)

  if (itens.length === 0) {
    // Diagnostico para cronograma vazio
    const { count, error } = await client
      .from('cronograma_itens')
      .select('id', { count: 'exact', head: true })
      .eq('cronograma_id', cronogramaId)

    console.warn('[Export PDF] Nenhum item retornado', {
      cronogramaId,
      userId: request.user.id,
      count,
      countError: error ? { message: error.message, code: error.code } : null,
    })

    try {
      const admin = getDatabaseClient()
      const { count: adminCount } = await admin
        .from('cronograma_itens')
        .select('id', { count: 'exact', head: true })
        .eq('cronograma_id', cronogramaId)

      console.warn('[Export PDF] Diagnóstico admin count', { cronogramaId, adminCount })
    } catch (diagErr) {
      console.warn('[Export PDF] Diagnóstico falhou', {
        cronogramaId,
        error: diagErr instanceof Error ? diagErr.message : String(diagErr),
      })
    }

    return NextResponse.json(
      { error: 'Este cronograma não possui aulas agendadas (0 itens). Gere um novo cronograma para exportar.' },
      { status: 409 },
    )
  }

  // Enriquecer cronograma com dados extras
  type CronogramaRaw = {
    nome?: string | null
    data_inicio: string
    data_fim: string
    dias_estudo_semana?: number
    horas_estudo_dia?: number
    modalidade_estudo?: string
    prioridade_minima?: number
    velocidade_reproducao?: number
    curso_alvo_id?: string | null
    disciplinas_selecionadas?: unknown
    periodos_ferias?: unknown
    [key: string]: unknown
  }
  const raw = cronograma as CronogramaRaw

  // Curso nome
  let cursoNome = 'Curso não informado'
  const cursoId = raw.curso_alvo_id ? String(raw.curso_alvo_id) : ''
  if (cursoId) {
    const { data: cursoData, error: cursoErr } = await client
      .from('cursos')
      .select('nome')
      .eq('id', cursoId)
      .maybeSingle<{ nome: string }>()
    if (!cursoErr && cursoData?.nome) cursoNome = cursoData.nome
  }

  // Disciplinas nomes
  const disciplinasIds = Array.isArray(raw.disciplinas_selecionadas)
    ? (raw.disciplinas_selecionadas as unknown[]).map((x) => String(x)).filter(Boolean)
    : []
  let disciplinasNomes: string[] = []
  if (disciplinasIds.length) {
    const { data: discData } = await client
      .from('disciplinas')
      .select('id, nome')
      .in('id', disciplinasIds)
      .order('nome', { ascending: true })
    const typed = discData as Array<{ id: string; nome: string }> | null
    disciplinasNomes = (typed || []).map((d) => d.nome).filter(Boolean)
  }

  // Logo do tenant (opcional)
  let logoUrl: string | null = null
  try {
    const { data: logoData } = await client
      .from('tenant_logos')
      .select('logo_url')
      .eq('tipo', 'sidebar')
      .maybeSingle<{ logo_url: string }>()
    if (logoData?.logo_url) logoUrl = logoData.logo_url
  } catch {
    // Logo nao e critico
  }

  const cronogramaExport: CronogramaExport = {
    ...cronograma,
    nome: (cronograma.nome as string) || 'Cronograma',
    aluno_nome: alunoNome,
    data_inicio: raw.data_inicio,
    data_fim: raw.data_fim,
    dias_estudo_semana: raw.dias_estudo_semana || 5,
    horas_estudo_dia: raw.horas_estudo_dia || 2,
    modalidade_estudo: raw.modalidade_estudo || 'hibrido',
    prioridade_minima: raw.prioridade_minima || 2,
    velocidade_reproducao: raw.velocidade_reproducao || 1,
    curso_nome: cursoNome,
    disciplinas_nomes: disciplinasNomes,
    periodos_ferias: normalizePeriodosFerias(raw.periodos_ferias),
  }

  // Calcular stats e agrupar dados
  const stats = calculateOverallStats(cronogramaExport, itens)
  const velocidade = Math.max(1, asNumberSafe(cronogramaExport.velocidade_reproducao, 1))
  const weeks = groupItemsByWeeks(itens, stats.disciplineColorMap, velocidade)

  // Montar documento PDF
  const Doc = (
    <Document>
      <CoverPage
        cronograma={cronogramaExport}
        stats={stats}
        logoUrl={logoUrl}
      />
      {weeks.map((week) => (
        <WeekPage
          key={week.semanaNumero}
          week={week}
          cronogramaNome={cronogramaExport.nome}
          alunoNome={alunoNome}
          colorMap={stats.disciplineColorMap}
          velocidade={velocidade}
        />
      ))}
      <SummaryPage
        cronogramaNome={cronogramaExport.nome}
        alunoNome={alunoNome}
        stats={stats}
      />
    </Document>
  )

  const blob = await pdf(Doc).toBlob()
  const arr = await blob.arrayBuffer()

  return new NextResponse(arr, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cronograma_${cronogramaId}.pdf"`,
    },
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params
  return requireUserAuth((req) => getHandler(req, params))(request)
}
