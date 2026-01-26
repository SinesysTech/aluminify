"use client"

import { useRef, useState } from 'react'
import { Plus, Upload, UserPlus, Download, ChevronDown } from 'lucide-react'
import { Student } from '@/app/shared/types/entities/user'
import { StudentFilters } from './student-filters'
import { StudentTable } from './student-table'
import { StudentSheet } from './student-sheet'
import { PaginationMeta } from '@/app/shared/types/dtos/api-responses'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadFile } from '@/shared/library/download-file'

type ImportIssueStatus = 'skipped' | 'failed' | 'rejected'

type ImportIssueRow = {
    rowNumber: number
    email: string
    status: ImportIssueStatus
    message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

interface AlunosClientPageProps {
    students: Student[]
    meta: PaginationMeta
    courses: { id: string, name: string, usaTurmas: boolean }[]
    totalAll: number
}

export function AlunosClientPage({ students, meta, courses, totalAll }: AlunosClientPageProps) {
    const router = useRouter()
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [importReportOpen, setImportReportOpen] = useState(false)
    const [importIssues, setImportIssues] = useState<ImportIssueRow[]>([])
    const [importSummaryText, setImportSummaryText] = useState<string>('')

    const isDatabaseEmpty = totalAll === 0

    const handleDownloadTemplate = async () => {
        setIsDownloading(true)
        try {
            await downloadFile({
                url: '/api/student/template',
                fallbackFilename: `modelo-importacao-alunos-${new Date().toISOString().split('T')[0]}.xlsx`,
            })
        } catch (error) {
            console.error('Erro ao baixar template:', error)
            toast.error(
                error instanceof Error ? error.message : 'Erro ao baixar modelo'
            )
        } finally {
            setIsDownloading(false)
        }
    }

    const handlePickImportFile = () => {
        fileInputRef.current?.click()
    }

    const handleImportFileSelected = async (file: File) => {
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/student/bulk-import', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                let detail = ''
                try {
                    const contentType = response.headers.get('content-type') || ''
                    if (contentType.includes('application/json')) {
                        const data = await response.json().catch(() => null)
                        detail = data?.error ? String(data.error) : ''

                        // Se a API devolver preview de validação, mostrar um resumo das primeiras linhas.
                        // Exemplo de payload: { error, preview: [{ rowNumber, email, errors: string[] }, ...] }
                        if (Array.isArray(data?.preview) && data.preview.length > 0) {
                            const preview = Array.isArray(data?.preview) ? (data.preview as unknown[]) : []
                            const previewLines = preview
                                .slice(0, 3)
                                .map((p: unknown) => {
                                    if (!isRecord(p)) return ''
                                    const row = typeof p.rowNumber === 'number' ? p.rowNumber : '?'
                                    const email = typeof p.email === 'string' ? p.email : ''
                                    const errorsList = Array.isArray(p.errors)
                                        ? p.errors.filter((e): e is string => typeof e === 'string')
                                        : []
                                    const errors = errorsList.join(' | ')
                                    return `Linha ${row}${email ? ` (${email})` : ''}: ${errors}`.trim()
                                })
                                .filter((line): line is string => Boolean(line))
                                .join('\n')

                            detail = `${detail}\n${previewLines}`.trim()
                            console.warn('[import alunos] Preview de erros:', data.preview)
                        }
                    } else {
                        detail = (await response.text().catch(() => '')).slice(0, 200)
                    }
                } catch {
                    // noop
                }
                throw new Error(detail || `Erro ao importar planilha (HTTP ${response.status})`)
            }

            const json = await response.json().catch(() => null)
            const summary = json?.data
            const rejected = typeof json?.rejected === 'number' ? json.rejected : 0
            const rejectedPreview = Array.isArray(json?.rejectedPreview) ? json.rejectedPreview : []

            const created = typeof summary?.created === 'number' ? summary.created : null
            const skipped = typeof summary?.skipped === 'number' ? summary.skipped : null
            const failed = typeof summary?.failed === 'number' ? summary.failed : null

            const issues: ImportIssueRow[] = []

            // Linhas processadas pelo import service (created/skipped/failed)
            const rows = Array.isArray(summary?.rows) ? (summary.rows as unknown[]) : []
            rows.forEach((r) => {
                if (!isRecord(r)) return
                const status = typeof r.status === 'string' ? r.status : undefined
                if (status === 'skipped' || status === 'failed') {
                    issues.push({
                        rowNumber: typeof r.rowNumber === 'number' ? r.rowNumber : 0,
                        email: typeof r.email === 'string' ? r.email : '',
                        status,
                        message: typeof r.message === 'string' ? r.message : '',
                    })
                }
            })

            // Linhas rejeitadas na validação antes de chegar no import service
            if (Array.isArray(rejectedPreview) && rejectedPreview.length > 0) {
                rejectedPreview.forEach((p: unknown) => {
                    if (!isRecord(p)) return
                    const errorsList = Array.isArray(p.errors)
                        ? p.errors.filter((e): e is string => typeof e === 'string')
                        : []
                    const errors = errorsList.join(' | ')
                    issues.push({
                        rowNumber: typeof p.rowNumber === 'number' ? p.rowNumber : 0,
                        email: typeof p.email === 'string' ? p.email : '',
                        status: 'rejected',
                        message: errors,
                    })
                })
            }

            if (created === 0 && (skipped || failed)) {
                toast.warning(
                    `Importação concluída, mas nenhum aluno foi criado (skipped: ${skipped ?? 0}, failed: ${failed ?? 0}).`
                )
            } else if (created !== null) {
                toast.success(
                    `Importação concluída: ${created} criados, ${skipped ?? 0} ignorados, ${failed ?? 0} com erro.`
                )
            } else {
                toast.success('Importação concluída com sucesso')
            }

            if (rejected > 0) {
                toast.warning(`Atenção: ${rejected} linhas foram rejeitadas por validação (abra o console para detalhes).`, {
                    duration: 8000,
                })
                console.warn('[import alunos] Linhas rejeitadas (preview):', rejectedPreview)
            }

            if (issues.length > 0) {
                const summaryLine = `Resultado da importação: ${created ?? 0} criados, ${skipped ?? 0} ignorados, ${failed ?? 0} com erro, ${rejected ?? 0} rejeitados.`
                setImportSummaryText(summaryLine)
                setImportIssues(issues.sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0)))
                setImportReportOpen(true)
                toast.warning(
                    `Atenção: ${issues.length} linha(s) não foram importadas. Vou mostrar a lista com os motivos.`
                )
            }

            // Atualizar a listagem imediatamente
            router.refresh()
        } catch (error) {
            console.error('Erro ao importar planilha:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao importar planilha', {
                // Mensagens com múltiplas linhas podem ficar grandes; manter curto na UI.
                // O console já recebe o preview completo (quando existir).
                duration: 8000,
            })
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 h-full pb-10">
            <Dialog open={importReportOpen} onOpenChange={setImportReportOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Linhas não importadas</DialogTitle>
                        <DialogDescription>
                            {importSummaryText || 'Algumas linhas não foram importadas. Veja abaixo os e-mails e os motivos.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            {importIssues.length} item(ns)
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                const text = importIssues
                                    .map((i) => `Linha ${i.rowNumber} | ${i.status} | ${i.email} | ${i.message}`)
                                    .join('\n')
                                try {
                                    await navigator.clipboard.writeText(text)
                                    toast.success('Lista copiada para a área de transferência.')
                                } catch {
                                    toast.error('Não foi possível copiar a lista automaticamente.')
                                }
                            }}
                        >
                            Copiar lista
                        </Button>
                    </div>

                    <ScrollArea className="h-[420px] rounded-md border">
                        <div className="p-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Linha</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Motivo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {importIssues.map((i, idx) => (
                                        <TableRow key={`${i.rowNumber}-${i.email}-${idx}`}>
                                            <TableCell className="font-mono">{i.rowNumber || '-'}</TableCell>
                                            <TableCell className="font-mono">{i.status}</TableCell>
                                            <TableCell className="font-mono">{i.email || '-'}</TableCell>
                                            <TableCell className="whitespace-normal wrap-break-word">{i.message || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    // permitir selecionar o mesmo arquivo novamente
                    e.target.value = ''
                    if (!file) return
                    void handleImportFileSelected(file)
                }}
            />

            {/* SECTION 1: HEADER & LIST (sempre que a empresa tem alunos) */}
            {!isDatabaseEmpty && (
                <section id="populated-state" className="flex flex-col gap-4 h-full min-h-[600px]">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
                        <div>
                            <h1 className="page-title">Alunos</h1>
                            <p className="page-subtitle">
                                {totalAll} aluno(s) cadastrados na empresa
                                {meta.total !== totalAll ? ` • ${meta.total} encontrado(s) com os filtros` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="h-9 px-4 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2 text-zinc-900">
                                        <Upload className="w-5 h-5" strokeWidth={1.5} />
                                        Importar
                                        <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDownloadTemplate} disabled={isDownloading}>
                                        <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                        {isDownloading ? 'Baixando...' : 'Baixar Modelo'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handlePickImportFile} disabled={isImporting}>
                                        <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                        {isImporting ? 'Importando...' : 'Importar Planilha'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button
                                onClick={() => setIsSheetOpen(true)}
                                className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" strokeWidth={1.5} />
                                Novo Aluno
                            </button>
                        </div>
                    </header>

                    <StudentFilters />

                    <StudentTable students={students} meta={meta} />
                </section>
            )}

            {/* SECTION 2: EMPTY STATE (Only if truly empty) */}
            {isDatabaseEmpty && (
                <section id="empty-state" className="flex-1 flex flex-col items-center justify-center min-h-[400px]">

                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E4E4E7]">
                        <UserPlus className="w-8 h-8 text-zinc-400" strokeWidth={1} />
                    </div>

                    <h3 className="empty-state-title mb-2">Base de alunos vazia</h3>
                    <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
                        Sua infraestrutura está pronta. Adicione alunos manualmente para gerar credenciais ou importe em massa.
                    </p>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-10 px-6 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2 text-zinc-900">
                                    <Upload className="w-5 h-5" strokeWidth={1.5} />
                                    Importar Planilha
                                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                                <DropdownMenuItem onClick={handleDownloadTemplate} disabled={isDownloading}>
                                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                    {isDownloading ? 'Baixando...' : 'Baixar Modelo'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePickImportFile} disabled={isImporting}>
                                    <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                    {isImporting ? 'Importando...' : 'Importar Planilha'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                            onClick={() => setIsSheetOpen(true)}
                            className="h-10 px-6 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" strokeWidth={1.5} />
                            Adicionar Manualmente
                        </button>
                    </div>
                </section>
            )}

            <StudentSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} courses={courses} />

        </div>
    )
}
