import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/backend/auth/middleware'
import { getDatabaseClient } from '@/backend/clients/database'
import ExcelJS from 'exceljs'
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
  data_prevista?: string | null;
  semana_numero: number;
  ordem_na_semana: number;
  concluido: boolean;
  data_conclusao?: string | null;
  aulas?: {
    nome?: string;
    tempo_estimado_minutos?: number;
    modulos?: {
      nome?: string;
      frentes?: {
        nome?: string;
        disciplinas?: {
          id: string;
          nome?: string;
        };
      };
    };
  };
}

function formatTempo(minutos?: number | null) {
  if (!minutos || minutos <= 0) return '--'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h > 0 && m > 0) return `${h}h ${m} min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function corDisciplina(disciplinaId?: string) {
  if (!disciplinaId) return 'FFEEF7'
  const hash = (disciplinaId || '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
  const hue = Math.abs(hash) % 360
  // Converter hue aproximado para tonalidade pastel
  const r = Math.round(255 * (1 - Math.abs(((hue / 60) % 2) - 1) * 0.2))
  const g = Math.round(240 * (1 - Math.abs(((hue / 60) % 2) - 1) * 0.2))
  const b = Math.round(220 * (1 - Math.abs(((hue / 60) % 2) - 1) * 0.2))
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

async function buildWorkbook(cronograma: CronogramaExport, itens: ItemExport[]) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Área do Aluno'
  wb.created = new Date()

  const resumo = wb.addWorksheet('Resumo')
  resumo.properties.defaultRowHeight = 18
  resumo.columns = [
    { header: 'Campo', key: 'campo', width: 28 },
    { header: 'Valor', key: 'valor', width: 60 },
  ]

  resumo.mergeCells('A1:B1')
  const titulo = resumo.getCell('A1')
  titulo.value = cronograma.nome || 'Meu Cronograma'
  titulo.font = { size: 16, bold: true }
  titulo.alignment = { vertical: 'middle', horizontal: 'center' }

  resumo.addRow({ campo: 'Período', valor: `${cronograma.data_inicio} a ${cronograma.data_fim}` })
  resumo.addRow({ campo: 'Dias por semana', valor: cronograma.dias_estudo_semana })
  resumo.addRow({ campo: 'Horas por dia', valor: cronograma.horas_estudo_dia })
  resumo.addRow({ campo: 'Modalidade', valor: cronograma.modalidade_estudo })
  if (cronograma.velocidade_reproducao) {
    resumo.addRow({ campo: 'Velocidade de reprodução', valor: `${Number(cronograma.velocidade_reproducao).toFixed(2)}x` })
  }

  const porDisciplina = new Map<string, { nome: string; minutos: number }>()
  itens.forEach((it) => {
    const disc = it.aulas?.modulos?.frentes?.disciplinas
    const min = it.aulas?.tempo_estimado_minutos || 0
    if (disc && min) {
      const agg = porDisciplina.get(disc.id) || { nome: disc.nome, minutos: 0 }
      agg.minutos += min
      porDisciplina.set(disc.id, agg)
    }
  })
  if (porDisciplina.size) {
    resumo.addRow({ campo: '', valor: '' })
    const header = resumo.addRow({ campo: 'Horas por disciplina', valor: '' })
    header.font = { bold: true }
    porDisciplina.forEach((v) => {
      resumo.addRow({ campo: v.nome, valor: formatTempo(v.minutos) })
    })
  }

  const folha = wb.addWorksheet('Cronograma')
  folha.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }]
  folha.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Semana', key: 'semana', width: 10 },
    { header: 'Ordem', key: 'ordem', width: 10 },
    { header: 'Disciplina', key: 'disciplina', width: 26 },
    { header: 'Frente', key: 'frente', width: 26 },
    { header: 'Módulo', key: 'modulo', width: 18 },
    { header: 'Aula', key: 'aula', width: 40 },
    { header: 'Tempo Est.', key: 'tempo', width: 12 },
    { header: 'Concluída', key: 'concluida', width: 12 },
    { header: 'Conclusão', key: 'conclusao', width: 14 },
  ]

  folha.getRow(1).font = { bold: true }
  folha.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  itens.forEach((it) => {
    const d = it.data_prevista || ''
    const disc = it.aulas?.modulos?.frentes?.disciplinas
    const frente = it.aulas?.modulos?.frentes
    const modulo = it.aulas?.modulos
    const aula = it.aulas
    const row = folha.addRow({
      data: d,
      semana: it.semana_numero,
      ordem: it.ordem_na_semana,
      disciplina: disc?.nome || '',
      frente: frente?.nome || '',
      modulo: modulo?.nome || '',
      aula: aula?.nome || '',
      tempo: formatTempo(aula?.tempo_estimado_minutos || null),
      concluida: it.concluido ? 'Sim' : 'Não',
      conclusao: it.data_conclusao || '',
    })
    const fillColor = corDisciplina(disc?.id)
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 1 && colNumber <= 10) {
        cell.border = {
          top: { style: 'thin', color: { argb: 'DDDDDD' } },
          left: { style: 'thin', color: { argb: 'EEEEEE' } },
          bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
          right: { style: 'thin', color: { argb: 'EEEEEE' } },
        }
        if (colNumber === 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        }
      }
    })
  })

  return wb
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
  const wb = await buildWorkbook(cronograma, itens)
  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cronograma_${cronogramaId}.xlsx"`,
    },
  })
}

export const GET = requireUserAuth(getHandler)
