import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/backend/auth/middleware'
import { getDatabaseClient } from '@/backend/clients/database'
import { pdf } from '@react-pdf/renderer'
import React from 'react'

export const runtime = 'nodejs'

async function fetchCronogramaCompleto(cronogramaId: string) {
  const client = getDatabaseClient()
  const { data: cronograma, error: cronogramaError } = await client
    .from('cronogramas')
    .select('*')
    .eq('id', cronogramaId)
    .single()
  if (cronogramaError || !cronograma) throw new Error('Cronograma não encontrado')

  const { data: itens } = await client
    .from('cronograma_itens')
    .select('id, aula_id, semana_numero, ordem_na_semana, concluido, data_conclusao, data_prevista')
    .eq('cronograma_id', cronogramaId)
    .order('semana_numero', { ascending: true })
    .order('ordem_na_semana', { ascending: true })

  const aulaIds = [...new Set((itens || []).map((i) => i.aula_id).filter(Boolean))]
  let aulasMap = new Map<string, any>()
  if (aulaIds.length) {
    const LOTE = 100
    const todasAulas: any[] = []
    for (let i = 0; i < aulaIds.length; i += LOTE) {
      const { data: lote } = await client
        .from('aulas')
        .select('id, nome, numero_aula, tempo_estimado_minutos, curso_id, modulo_id')
        .in('id', aulaIds.slice(i, i + LOTE))
      if (lote) todasAulas.push(...lote)
    }

    const moduloIds = [...new Set(todasAulas.map((a) => a.modulo_id).filter(Boolean))]
    let modulosMap = new Map<string, any>()
    if (moduloIds.length) {
      const { data: modulos } = await client
        .from('modulos')
        .select('id, nome, numero_modulo, frente_id')
        .in('id', moduloIds)
      if (modulos) modulosMap = new Map(modulos.map((m: any) => [m.id, m]))
    }

    const frenteIds = [...new Set(Array.from(modulosMap.values()).map((m: any) => m.frente_id).filter(Boolean))]
    let frentesMap = new Map<string, any>()
    if (frenteIds.length) {
      const { data: frentes } = await client
        .from('frentes')
        .select('id, nome, disciplina_id')
        .in('id', frenteIds)
      if (frentes) frentesMap = new Map(frentes.map((f: any) => [f.id, f]))
    }

    const disciplinaIds = [...new Set(Array.from(frentesMap.values()).map((f: any) => f.disciplina_id).filter(Boolean))]
    let disciplinasMap = new Map<string, any>()
    if (disciplinaIds.length) {
      const { data: disciplinas } = await client
        .from('disciplinas')
        .select('id, nome')
        .in('id', disciplinaIds)
      if (disciplinas) disciplinasMap = new Map(disciplinas.map((d: any) => [d.id, d]))
    }

    aulasMap = new Map(
      todasAulas.map((a) => {
        const modulo = modulosMap.get(a.modulo_id)
        const frente = modulo ? frentesMap.get(modulo.frente_id) : null
        const disciplina = frente ? disciplinasMap.get(frente.disciplina_id) : null
        return [
          a.id,
          {
            id: a.id,
            nome: a.nome,
            numero_aula: a.numero_aula,
            tempo_estimado_minutos: a.tempo_estimado_minutos,
            curso_id: a.curso_id,
            modulos: modulo
              ? {
                  id: modulo.id,
                  nome: modulo.nome,
                  numero_modulo: modulo.numero_modulo,
                  frentes: frente
                    ? {
                        id: frente.id,
                        nome: frente.nome,
                        disciplinas: disciplina ? { id: disciplina.id, nome: disciplina.nome } : null,
                      }
                    : null,
                }
              : null,
          },
        ]
      }),
    )
  }

  const itensCompletos = (itens || []).map((item) => ({
    ...item,
    aulas: aulasMap.get(item.aula_id) || null,
  }))

  return { cronograma, itens: itensCompletos }
}

function formatTempo(minutos?: number | null) {
  if (!minutos || minutos <= 0) return '--'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h > 0 && m > 0) return `${h}h ${m} min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

function buildPdf(cronograma: any, itens: any[]) {
  const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, color: '#111' },
    title: { fontSize: 20, marginBottom: 6, fontWeight: 700 },
    subtitle: { fontSize: 12, marginBottom: 16, color: '#666' },
    sectionTitle: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: 700 },
    row: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ddd', paddingVertical: 6 },
    cell: { paddingRight: 8 },
    headerRow: { flexDirection: 'row', backgroundColor: '#f5f7ff', borderBottomWidth: 0.5, borderColor: '#ccc', paddingVertical: 6 },
    headerCell: { fontWeight: 700 },
    chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#ccc', marginLeft: 6 },
  })

  const resumoHoras = new Map<string, { nome: string; minutos: number }>()
  itens.forEach((it) => {
    const disc = it.aulas?.modulos?.frentes?.disciplinas
    const min = it.aulas?.tempo_estimado_minutos || 0
    if (disc && min) {
      const agg = resumoHoras.get(disc.id) || { nome: disc.nome, minutos: 0 }
      agg.minutos += min
      resumoHoras.set(disc.id, agg)
    }
  })

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{cronograma.nome || 'Meu Cronograma'}</Text>
        <Text style={styles.subtitle}>{cronograma.data_inicio} a {cronograma.data_fim}</Text>

        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={{ marginBottom: 8 }}>
          <Text>Dias/semana: {cronograma.dias_estudo_semana}  •  Horas/dia: {cronograma.horas_estudo_dia}  •  Modalidade: {cronograma.modalidade_estudo}</Text>
          {cronograma.velocidade_reproducao ? (
            <Text>Velocidade: {Number(cronograma.velocidade_reproducao).toFixed(2)}x</Text>
          ) : null}
        </View>
        {resumoHoras.size > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>Horas por disciplina</Text>
            {Array.from(resumoHoras.values()).map((v, idx) => (
              <Text key={idx}>{v.nome}: {formatTempo(v.minutos)}</Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Cronograma</Text>
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>Data</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 44 }]}>Sem.</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 44 }]}>Ord.</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Disciplina</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Frente</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 90 }]}>Módulo</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Aula</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>Tempo</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 70 }]}>Status</Text>
        </View>
        {itens.map((it, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={[styles.cell, { width: 80 }]}>{it.data_prevista || ''}</Text>
            <Text style={[styles.cell, { width: 44 }]}>{String(it.semana_numero)}</Text>
            <Text style={[styles.cell, { width: 44 }]}>{String(it.ordem_na_semana)}</Text>
            <Text style={[styles.cell, { width: 120 }]}>{it.aulas?.modulos?.frentes?.disciplinas?.nome || ''}</Text>
            <Text style={[styles.cell, { width: 120 }]}>{it.aulas?.modulos?.frentes?.nome || ''}</Text>
            <Text style={[styles.cell, { width: 90 }]}>{it.aulas?.modulos?.nome || ''}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{it.aulas?.nome || ''}</Text>
            <Text style={[styles.cell, { width: 80 }]}>{formatTempo(it.aulas?.tempo_estimado_minutos || null)}</Text>
            <Text style={[styles.cell, { width: 70 }]}>{it.concluido ? 'Concluída' : 'Pendente'}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )

  return Doc
}

async function getHandler(request: AuthenticatedRequest, context: { params: { id: string } }) {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cronogramaId = context?.params?.id
  if (!cronogramaId) return NextResponse.json({ error: 'cronograma_id é obrigatório' }, { status: 400 })

  const client = getDatabaseClient()
  const { data: owner } = await client
    .from('cronogramas')
    .select('aluno_id')
    .eq('id', cronogramaId)
    .single()
  if (!owner || owner.aluno_id !== request.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cronograma, itens } = await fetchCronogramaCompleto(cronogramaId)
  const Doc = buildPdf(cronograma, itens)
  const buffer = await pdf(Doc).toBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cronograma_${cronogramaId}.pdf"`,
    },
  })
}

export const GET = requireUserAuth(getHandler)
