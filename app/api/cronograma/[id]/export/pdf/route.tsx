import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/backend/auth/middleware'
import { getDatabaseClient, getDatabaseClientAsUser } from '@/backend/clients/database'
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import React from 'react'
import { fetchCronogramaCompleto } from '@/lib/cronograma-export-utils'

export const runtime = 'nodejs'

interface CronogramaExport {
  nome: string;
  data_inicio: string;
  data_fim: string;
  dias_estudo_semana: number;
  horas_estudo_dia: number;
  modalidade_estudo: string;
  velocidade_reproducao?: number;
  prioridade_minima?: number;
  curso_nome?: string;
  disciplinas_nomes?: string[];
  periodos_ferias?: Array<{ inicio: string; fim: string }>;
  [key: string]: unknown;
}

interface ItemExport {
  id: string;
  aula_id: string;
  semana_numero: number;
  ordem_na_semana: number;
  data_prevista?: string | null;
  concluido: boolean;
  data_conclusao?: string | null;
  aulas?: {
    id?: string;
    nome?: string;
    numero_aula?: number | null;
    tempo_estimado_minutos?: number | null;
    curso_id?: string | null;
    modulos?: {
      id?: string;
      nome?: string;
      numero_modulo?: number | null;
      frentes?: {
        id?: string;
        nome?: string;
        disciplinas?: {
          id?: string;
          nome?: string;
        } | null;
      } | null;
    } | null;
  } | null;
}

function formatTempo(minutos?: number | null) {
  if (!minutos || minutos <= 0) return '--'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h > 0 && m > 0) return `${h}h ${m} min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function formatDateBR(dateString?: string | null) {
  if (!dateString) return ''
  try {
    // Aceita "YYYY-MM-DD" ou ISO
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return String(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return String(dateString)
  }
}

const MODALIDADES_LABEL: Record<number, string> = {
  1: 'Super Extensivo',
  2: 'Extensivo',
  3: 'Semi Extensivo',
  4: 'Intensivo',
  5: 'Superintensivo',
}

function formatTipoEstudo(modalidade_estudo?: string) {
  if (modalidade_estudo === 'paralelo') return 'Frentes em Paralelo'
  if (modalidade_estudo === 'sequencial') return 'Estudo Sequencial'
  return String(modalidade_estudo || 'Não informado')
}

function asNumberSafe(value: unknown, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizePeriodosFerias(raw: unknown): Array<{ inicio: string; fim: string }> {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map((p) => {
      if (!p || typeof p !== 'object') return null
      const inicio = 'inicio' in p ? String((p as { inicio?: unknown }).inicio ?? '') : ''
      const fim = 'fim' in p ? String((p as { fim?: unknown }).fim ?? '') : ''
      if (!inicio || !fim) return null
      return { inicio, fim }
    })
    .filter((p): p is { inicio: string; fim: string } => Boolean(p))
}

function truncateText(text: string, maxChars: number) {
  const t = (text ?? '').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function formatModuloLabel(numero: number | null | undefined, nome: string) {
  const n = (nome ?? '').trim()
  if (numero && Number.isFinite(numero)) {
    return `Módulo ${numero} - ${n || 'Sem nome'}`
  }
  return n || 'Módulo sem nome'
}

function CheckboxBox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Text style={{ fontSize: 10, lineHeight: 1 }}>✓</Text> : null}
    </View>
  )
}

function buildPdf(cronograma: CronogramaExport, itens: ItemExport[]) {
  Font.registerHyphenationCallback((word) => [word])

  const styles = StyleSheet.create({
    page: { paddingTop: 28, paddingBottom: 22, paddingHorizontal: 28, fontSize: 10, color: '#111' },
    bold: { fontWeight: 700 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 16 },
    headerRight: { width: 170, alignItems: 'flex-end' },
    logoSlot: {
      width: 170,
      height: 56,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 8,
      backgroundColor: '#fafafa',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoSlotText: { fontSize: 9, color: '#9ca3af' },
    headerTitle: { fontSize: 20, fontWeight: 700 },
    headerSub: { fontSize: 11, color: '#444', marginTop: 4 },
    headerMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    headerMeta: { fontSize: 10, color: '#666' },
    section: { marginTop: 14 },
    sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
    infoGrid: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10 },
    infoRow: { flexDirection: 'row', paddingVertical: 6 },
    infoDivider: { borderBottomWidth: 1, borderBottomColor: '#eee' },
    infoKey: { width: 165, fontSize: 10, color: '#555' },
    infoVal: { flex: 1, fontSize: 10, color: '#111' },
    weekBox: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      backgroundColor: '#f9fafb',
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    weekTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    weekTitle: { fontSize: 15, fontWeight: 700, color: '#111' },
    weekTotals: { fontSize: 11, color: '#374151' },
    group: { marginTop: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, overflow: 'hidden' },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#ddd' },
    groupHeaderLeft: { fontSize: 11, fontWeight: 700, color: '#111' },
    groupHeaderRight: { fontSize: 11, fontWeight: 700, color: '#111' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f5f7ff', borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 6 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6 },
    tableRowAlt: { backgroundColor: '#fafafa' },
    cell: { paddingHorizontal: 8 },
    headerCell: { fontWeight: 700, color: '#222' },
    cellCenterText: { textAlign: 'center' as const },
    cellCenterBox: { alignItems: 'center' as const, justifyContent: 'center' as const },
    flexAula: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    footer: { position: 'absolute', left: 28, right: 28, bottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 9, color: '#888' },
  })

  const velocidade = Math.max(1, asNumberSafe(cronograma.velocidade_reproducao, 1))
  const fator = 1.5 // aula + (anotações/exercícios)

  const cursoNome = cronograma.curso_nome || 'Curso não informado'
  const periodo = `${formatDateBR(cronograma.data_inicio)} — ${formatDateBR(cronograma.data_fim)}`
  const geradoEm = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  const modalidadeLabel = MODALIDADES_LABEL[Math.max(1, Math.min(5, asNumberSafe(cronograma.prioridade_minima, 2)))] || 'Não definida'
  const tipoEstudo = formatTipoEstudo(cronograma.modalidade_estudo)

  const disciplinasList =
    Array.isArray(cronograma.disciplinas_nomes) && cronograma.disciplinas_nomes.length > 0
      ? cronograma.disciplinas_nomes
      : (() => {
          const set = new Set<string>()
          itens.forEach((it) => {
            const n = it.aulas?.modulos?.frentes?.disciplinas?.nome
            if (n) set.add(n)
          })
          return Array.from(set.values()).sort((a, b) => a.localeCompare(b))
        })()

  const periodosFerias = Array.isArray(cronograma.periodos_ferias) ? cronograma.periodos_ferias : []

  const calcTempos = (items: ItemExport[]) => {
    let aulaMin = 0
    items.forEach((it) => {
      const tempo = it.aulas?.tempo_estimado_minutos
      if (tempo && tempo > 0) aulaMin += tempo / velocidade
    })
    const anotMin = aulaMin * (fator - 1)
    const totalMin = aulaMin + anotMin
    return { aulaMin, anotMin, totalMin }
  }

  const temposCronograma = calcTempos(itens)

  const itensPorSemana = new Map<number, ItemExport[]>()
  itens.forEach((it) => {
    const semana = Number(it.semana_numero || 0)
    if (!itensPorSemana.has(semana)) itensPorSemana.set(semana, [])
    itensPorSemana.get(semana)!.push(it)
  })
  const semanasOrdenadas = Array.from(itensPorSemana.keys()).sort((a, b) => a - b)

  // Colunas: Aula flexível + Tempo/Assistida fixas (encostadas à direita)
  const COL_TEMPO = 85
  const COL_CHECK = 60

  const HeaderBlock = () => (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{cronograma.nome || 'Meu Cronograma'}</Text>
        <Text style={styles.headerSub}>
          <Text style={styles.bold}>Curso:</Text> {cursoNome}
        </Text>
        <View style={styles.headerMetaRow}>
          <Text style={styles.headerMeta}>
            <Text style={styles.bold}>Período:</Text> {periodo}
          </Text>
          <Text style={styles.headerMeta}>
            <Text style={styles.bold}>Gerado em:</Text> {geradoEm}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.logoSlot}>
          <Text style={styles.logoSlotText}>Espaço da logo</Text>
        </View>
      </View>
    </View>
  )

  const InfoBlock = () => (
    <View style={[styles.section, styles.infoGrid]}>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Disciplinas</Text>
        <Text style={styles.infoVal}>
          {disciplinasList.length ? disciplinasList.join(', ') : 'Não informado'}
        </Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Tempo total do cronograma</Text>
        <Text style={styles.infoVal}>{formatTempo(temposCronograma.totalMin)}</Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Tempo total de aula</Text>
        <Text style={styles.infoVal}>{formatTempo(temposCronograma.aulaMin)}</Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Tempo (anotações/exercícios)</Text>
        <Text style={styles.infoVal}>{formatTempo(temposCronograma.anotMin)}</Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Modalidade</Text>
        <Text style={styles.infoVal}>{modalidadeLabel}</Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Tipo de estudo</Text>
        <Text style={styles.infoVal}>{tipoEstudo}</Text>
      </View>
      <View style={[styles.infoRow, styles.infoDivider]}>
        <Text style={styles.infoKey}>Velocidade de reprodução</Text>
        <Text style={styles.infoVal}>{velocidade.toFixed(2)}x</Text>
      </View>
      <View style={[styles.infoRow, { paddingBottom: 0 }]}>
        <Text style={styles.infoKey}>Pausas e recessos</Text>
        <Text style={styles.infoVal}>
          {periodosFerias.length
            ? periodosFerias
                .map((p) => `${formatDateBR(p.inicio)} – ${formatDateBR(p.fim)}`)
                .join('\n')
            : 'Nenhum'}
        </Text>
      </View>
    </View>
  )

  const Doc = (
    <Document>
      {semanasOrdenadas.map((semanaNumero, indexSemana) => {
        const weekItens = itensPorSemana.get(semanaNumero) || []
        const weekTempos = calcTempos(weekItens)
        const isFirstWeekPage = indexSemana === 0

        return (
          <Page key={semanaNumero} size="A4" style={styles.page} wrap>
            <HeaderBlock />

            {isFirstWeekPage ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações do cronograma</Text>
                <InfoBlock />
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.weekBox}>
                <View style={styles.weekTitleRow}>
                  <Text style={styles.weekTitle}>Semana {semanaNumero}</Text>
                  <Text style={styles.weekTotals}>
                    <Text style={styles.bold}>Aula:</Text> {formatTempo(weekTempos.aulaMin)}  •{' '}
                    <Text style={styles.bold}>Anotações/Exercícios:</Text> {formatTempo(weekTempos.anotMin)}  •{' '}
                    <Text style={styles.bold}>Total:</Text> {formatTempo(weekTempos.totalMin)}
                  </Text>
                </View>
              </View>

              {(() => {
                // Agrupar por Frente -> Módulo preservando ordem do banco
                type ModuloGroup = {
                  moduloLabel: string
                  itens: ItemExport[]
                }
                type FrenteGroup = {
                  frenteNome: string
                  modulos: Map<string, ModuloGroup>
                }

                const frentesMap = new Map<string, FrenteGroup>()
                const weekOrdenado = [...weekItens].sort((a, b) => (a.ordem_na_semana || 0) - (b.ordem_na_semana || 0))

                weekOrdenado.forEach((it) => {
                  const frenteId = it.aulas?.modulos?.frentes?.id ? String(it.aulas.modulos.frentes.id) : 'sem-frente'
                  const frenteNome = it.aulas?.modulos?.frentes?.nome || 'Sem Frente'

                  const moduloId = it.aulas?.modulos?.id ? String(it.aulas.modulos.id) : 'sem-modulo'
                  const moduloNome = it.aulas?.modulos?.nome || ''
                  const moduloNumero = it.aulas?.modulos?.numero_modulo ?? null
                  const moduloLabel = formatModuloLabel(moduloNumero, moduloNome)

                  if (!frentesMap.has(frenteId)) {
                    frentesMap.set(frenteId, { frenteNome, modulos: new Map() })
                  }
                  const fg = frentesMap.get(frenteId)!
                  if (!fg.modulos.has(moduloId)) {
                    fg.modulos.set(moduloId, { moduloLabel, itens: [] })
                  }
                  fg.modulos.get(moduloId)!.itens.push(it)
                })

                const frentesOrdenadas = Array.from(frentesMap.entries())
                return frentesOrdenadas.map(([frenteId, fg]) => {
                  const modulosOrdenados = Array.from(fg.modulos.entries())
                  return modulosOrdenados.map(([moduloId, mg]) => {
                    return (
                      <View key={`${semanaNumero}-${frenteId}-${moduloId}`} style={styles.group} wrap={false}>
                        <View style={styles.groupHeader}>
                          <Text style={styles.groupHeaderLeft}>{truncateText(fg.frenteNome, 40)}</Text>
                          <Text style={styles.groupHeaderRight}>{truncateText(mg.moduloLabel, 52)}</Text>
                        </View>

                        <View style={styles.tableHeaderRow}>
                          <Text style={[styles.cell, styles.headerCell, styles.flexAula]}>Aula</Text>
                          <Text style={[styles.cell, styles.headerCell, styles.cellCenterText, { width: COL_TEMPO }]}>Tempo (aula)</Text>
                          <Text style={[styles.cell, styles.headerCell, styles.cellCenterText, { width: COL_CHECK }]}>Assistida</Text>
                        </View>

                        {mg.itens.map((it, idx) => {
                          const isAlt = idx % 2 === 1
                          const aula = it.aulas?.nome || ''
                          const tempoAula = it.aulas?.tempo_estimado_minutos || 0
                          const tempoAulaAdj = tempoAula > 0 ? tempoAula / velocidade : 0
                          const checked = Boolean(it.concluido)

                          return (
                            <View
                              key={it.id || `${semanaNumero}-${frenteId}-${moduloId}-${idx}`}
                              style={[styles.tableRow, ...(isAlt ? [styles.tableRowAlt] : [])]}
                            >
                              <Text style={[styles.cell, styles.flexAula]}>{truncateText(aula, 92)}</Text>
                              <Text style={[styles.cell, styles.cellCenterText, { width: COL_TEMPO }]}>{formatTempo(tempoAulaAdj)}</Text>
                              <View style={[{ width: COL_CHECK }, styles.cellCenterBox]}>
                                <CheckboxBox checked={checked} />
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )
                  })
                })
              })()}
            </View>

            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>Aluminify • Exportação de cronograma</Text>
              <Text
                style={styles.footerText}
                render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
              />
            </View>
          </Page>
        )
      })}
    </Document>
  )

  return Doc
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cronogramaId = String(params.id)
  if (!cronogramaId) return NextResponse.json({ error: 'cronograma_id é obrigatório' }, { status: 400 })

  console.log('[Export PDF] Iniciando exportação', {
    cronogramaId,
    userId: request.user.id,
  })

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const client = getDatabaseClientAsUser(token)
  const { data: owner } = await client
    .from('cronogramas')
    .select('aluno_id')
    .eq('id', cronogramaId)
    .single()
  if (!owner || owner.aluno_id !== request.user.id) {
    console.warn('[Export PDF] Forbidden - dono diferente', {
      cronogramaId,
      userId: request.user.id,
      ownerAlunoId: owner?.aluno_id ?? null,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cronograma, itens } = await fetchCronogramaCompleto(cronogramaId, client)
  console.log('[Export PDF] Dados carregados', {
    cronogramaId,
    itensCount: itens.length,
    primeiroItem: itens[0]
      ? {
          id: itens[0].id,
          data_prevista: itens[0].data_prevista,
          semana_numero: itens[0].semana_numero,
          ordem_na_semana: itens[0].ordem_na_semana,
          aula: itens[0].aulas?.nome ?? null,
          disciplina: itens[0].aulas?.modulos?.frentes?.disciplinas?.nome ?? null,
        }
      : null,
  })

  if (itens.length === 0) {
    const { count, error } = await client
      .from('cronograma_itens')
      .select('id', { count: 'exact', head: true })
      .eq('cronograma_id', cronogramaId)

    console.warn('[Export PDF] Nenhum item retornado para exportação', {
      cronogramaId,
      userId: request.user.id,
      count,
      countError: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
    })

    // Diagnóstico extra: confirmar via client server-side (bypass RLS) se existem itens no banco.
    try {
      const admin = getDatabaseClient()
      const { count: adminCount, error: adminErr } = await admin
        .from('cronograma_itens')
        .select('id', { count: 'exact', head: true })
        .eq('cronograma_id', cronogramaId)

      console.warn('[Export PDF] Diagnóstico (admin) cronograma_itens count', {
        cronogramaId,
        adminCount,
        adminErr: adminErr ? { message: adminErr.message, code: adminErr.code, details: adminErr.details, hint: adminErr.hint } : null,
      })

      const { data: recentes, error: recentesErr } = await admin
        .from('cronogramas')
        .select('id, created_at')
        .eq('aluno_id', request.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentesErr) {
        console.warn('[Export PDF] Diagnóstico (admin) falha ao listar cronogramas recentes', {
          userId: request.user.id,
          error: { message: recentesErr.message, code: recentesErr.code, details: recentesErr.details, hint: recentesErr.hint },
        })
      } else {
        const ids = (recentes ?? []).map((r) => r.id)
        const itensPorCronograma: Array<{ id: string; itens: number | null }> = []
        for (const id of ids) {
          const { count: c } = await admin
            .from('cronograma_itens')
            .select('id', { count: 'exact', head: true })
            .eq('cronograma_id', id)
          itensPorCronograma.push({ id, itens: c ?? null })
        }

        console.warn('[Export PDF] Diagnóstico (admin) cronogramas recentes + itens', {
          userId: request.user.id,
          cronogramas: itensPorCronograma,
        })
      }
    } catch (diagErr) {
      console.warn('[Export PDF] Diagnóstico (admin) falhou com exceção', {
        cronogramaId,
        userId: request.user.id,
        error: diagErr instanceof Error ? diagErr.message : String(diagErr),
      })
    }

    // Não gerar PDF vazio: indicar claramente que o cronograma não tem itens.
    return NextResponse.json(
      {
        error:
          'Este cronograma não possui aulas agendadas (0 itens). Gere um novo cronograma para exportar.',
      },
      { status: 409 },
    )
  }

  type CronogramaCompleto = {
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
  const cronogramaTyped = cronograma as CronogramaCompleto

  // Curso (nome)
  let cursoNome = 'Curso não informado'
  const cursoId = cronogramaTyped.curso_alvo_id ? String(cronogramaTyped.curso_alvo_id) : ''
  if (cursoId) {
    const { data: cursoData, error: cursoErr } = await client
      .from('cursos')
      .select('nome')
      .eq('id', cursoId)
      .maybeSingle<{ nome: string }>()
    if (!cursoErr && cursoData?.nome) {
      cursoNome = cursoData.nome
    }
  }

  // Disciplinas (nomes)
  const disciplinasIds = Array.isArray(cronogramaTyped.disciplinas_selecionadas)
    ? (cronogramaTyped.disciplinas_selecionadas as unknown[]).map((x) => String(x)).filter(Boolean)
    : []
  let disciplinasNomes: string[] = []
  if (disciplinasIds.length) {
    const { data: discData } = await client
      .from('disciplinas')
      .select('id, nome')
      .in('id', disciplinasIds)
      .order('nome', { ascending: true })
    disciplinasNomes = (discData || []).map((d) => d.nome).filter(Boolean)
  }

  const periodosFerias = normalizePeriodosFerias(cronogramaTyped.periodos_ferias)

  const cronogramaExport = {
    ...cronograma,
    dias_estudo_semana: cronogramaTyped.dias_estudo_semana || 5,
    horas_estudo_dia: cronogramaTyped.horas_estudo_dia || 2,
    modalidade_estudo: cronogramaTyped.modalidade_estudo || 'hibrido',
    prioridade_minima: cronogramaTyped.prioridade_minima || 2,
    velocidade_reproducao: cronogramaTyped.velocidade_reproducao || 1,
    curso_nome: cursoNome,
    disciplinas_nomes: disciplinasNomes,
    periodos_ferias: periodosFerias,
  }
  const Doc = buildPdf(cronogramaExport, itens)
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
  const params = await context.params;
  return requireUserAuth((req) => getHandler(req, params))(request);
}
