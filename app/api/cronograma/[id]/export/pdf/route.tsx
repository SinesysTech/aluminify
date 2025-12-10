import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/backend/auth/middleware'
import { getDatabaseClient } from '@/backend/clients/database'
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

function buildPdf(cronograma: CronogramaExport, itens: ItemExport[]) {
  Font.registerHyphenationCallback((word) => [word])
  const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, color: '#111' },
    title: { fontSize: 20, marginBottom: 6, fontWeight: 700 },
    subtitle: { fontSize: 12, marginBottom: 16, color: '#666' },
    sectionTitle: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: 700 },
    row: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ddd', paddingVertical: 4, alignItems: 'center' },
    cell: { paddingRight: 8 },
    textCell: { lineHeight: 1.2 },
    headerRow: { flexDirection: 'row', backgroundColor: '#f5f7ff', borderBottomWidth: 0.5, borderColor: '#ccc', paddingVertical: 6 },
    headerCell: { fontWeight: 700 },
    chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#ccc', marginLeft: 6 },
  })

  const resumoHoras = new Map<string, { nome: string; minutos: number }>()
  itens.forEach((it) => {
    const disc = it.aulas?.modulos?.frentes?.disciplinas
    const min = it.aulas?.tempo_estimado_minutos || 0
    if (disc && disc.id && disc.nome && min) {
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
          <Text style={[styles.cell, styles.headerCell, { width: 90 }]}>Data</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 50 }]}>Sem.</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 50 }]}>Ord.</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 110 }]}>Disciplina</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 110 }]}>Frente</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 140 }]}>Módulo</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 220 }]}>Aula</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 70 }]}>Tempo</Text>
          <Text style={[styles.cell, styles.headerCell, { width: 70 }]}>Status</Text>
        </View>
        {itens.map((it, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={[styles.cell, styles.textCell, { width: 90 }]}>{it.data_prevista || ''}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 50 }]}>{String(it.semana_numero)}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 50 }]}>{String(it.ordem_na_semana)}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 110 }]}>{it.aulas?.modulos?.frentes?.disciplinas?.nome || ''}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 110 }]}>{it.aulas?.modulos?.frentes?.nome || ''}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 140 }]}>{it.aulas?.modulos?.nome || ''}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 220 }]}>{it.aulas?.nome || ''}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 70 }]}>{formatTempo(it.aulas?.tempo_estimado_minutos || null)}</Text>
            <Text style={[styles.cell, styles.textCell, { width: 70 }]}>{it.concluido ? 'Concluída' : 'Pendente'}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )

  return Doc
}

async function getHandler(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>,
) {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let cronogramaId: string | null = null
  if (context && 'params' in context) {
    const params = (context as { params?: { id?: string } }).params
    if (params && typeof params === 'object' && 'id' in params) {
      cronogramaId = String(params.id)
    }
  }
  if (!cronogramaId) {
    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const idx = parts.indexOf('export') - 1
    if (idx >= 0 && parts[idx]) cronogramaId = parts[idx]
  }
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

export const GET = requireUserAuth(getHandler)
