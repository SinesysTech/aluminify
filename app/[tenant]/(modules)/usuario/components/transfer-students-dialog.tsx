'use client'

import * as React from 'react'
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { apiClient, ApiClientError } from '@/shared/library/api-client'
import type { CourseOption, Aluno } from './aluno-table'

type TransferType = 'course' | 'turma'
type TurmaStatus = 'concluido' | 'cancelado' | 'trancado'

interface TurmaSummary {
  id: string
  nome: string
  cursoId: string
  ativo: boolean
}

interface TransferResult {
  studentId: string
  studentName: string | null
  status: 'success' | 'failed' | 'skipped'
  message?: string
}

interface BulkTransferResult {
  total: number
  success: number
  failed: number
  skipped: number
  results: TransferResult[]
}

interface TransferStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: Aluno[]
  courses: CourseOption[]
  currentCourseId?: string
  currentTurmaId?: string
  onTransferComplete: () => void
}

export function TransferStudentsDialog({
  open,
  onOpenChange,
  selectedStudents,
  courses,
  currentCourseId,
  currentTurmaId,
  onTransferComplete,
}: TransferStudentsDialogProps) {
  const [transferType, setTransferType] = React.useState<TransferType>('course')
  const [targetCourseId, setTargetCourseId] = React.useState('')
  const [targetTurmaId, setTargetTurmaId] = React.useState('')
  const [sourceStatus, setSourceStatus] = React.useState<TurmaStatus>('concluido')
  const [turmas, setTurmas] = React.useState<TurmaSummary[]>([])
  const [turmasLoading, setTurmasLoading] = React.useState(false)
  const [isTransferring, setIsTransferring] = React.useState(false)
  const [result, setResult] = React.useState<BulkTransferResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Load turmas when course changes or when transfer type is turma
  React.useEffect(() => {
    if (!currentCourseId || transferType !== 'turma') {
      setTurmas([])
      return
    }

    const fetchTurmas = async () => {
      try {
        setTurmasLoading(true)
        const response = await apiClient.get<{ data: TurmaSummary[] }>(
          `/api/course/${currentCourseId}/turmas`
        )
        if (response && 'data' in response) {
          // Filter out current turma if set
          const filteredTurmas = currentTurmaId
            ? response.data.filter((t) => t.id !== currentTurmaId)
            : response.data
          setTurmas(filteredTurmas)
        }
      } catch (err) {
        console.error('Error fetching turmas:', err)
        setTurmas([])
      } finally {
        setTurmasLoading(false)
      }
    }

    fetchTurmas()
  }, [currentCourseId, currentTurmaId, transferType])

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setTransferType('course')
      setTargetCourseId('')
      setTargetTurmaId('')
      setSourceStatus('concluido')
      setResult(null)
      setError(null)
    }
  }, [open])

  const availableCourses = courses.filter((c) => c.id !== currentCourseId)

  const handleTransfer = async () => {
    setIsTransferring(true)
    setError(null)
    setResult(null)

    try {
      const studentIds = selectedStudents.map((s) => s.id)

      if (transferType === 'course') {
        if (!targetCourseId) {
          setError('Selecione um curso de destino')
          return
        }

        const response = await apiClient.post<{ data: BulkTransferResult }>(
          '/api/student/bulk-transfer/course',
          {
            studentIds,
            sourceCourseId: currentCourseId,
            targetCourseId,
          }
        )

        if (response && 'data' in response) {
          setResult(response.data)
          if (response.data.success > 0) {
            onTransferComplete()
          }
        }
      } else {
        if (!targetTurmaId) {
          setError('Selecione uma turma de destino')
          return
        }

        const response = await apiClient.post<{ data: BulkTransferResult }>(
          '/api/student/bulk-transfer/turma',
          {
            studentIds,
            sourceTurmaId: currentTurmaId,
            targetTurmaId,
            sourceStatusOnTransfer: sourceStatus,
          }
        )

        if (response && 'data' in response) {
          setResult(response.data)
          if (response.data.success > 0) {
            onTransferComplete()
          }
        }
      }
    } catch (err) {
      let errorMessage = 'Erro ao transferir alunos'
      if (err instanceof ApiClientError) {
        errorMessage = err.data?.error || err.message || errorMessage
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsTransferring(false)
    }
  }

  const getStatusIcon = (status: TransferResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: TransferResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Sucesso</Badge>
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Falha</Badge>
      case 'skipped':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Ignorado</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transferir Alunos</DialogTitle>
          <DialogDescription>
            Transferir {selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''} selecionado{selectedStudents.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            {/* Transfer Type Selection */}
            <div className="space-y-2">
              <Label>Tipo de transferencia</Label>
              <RadioGroup
                value={transferType}
                onValueChange={(v) => setTransferType(v as TransferType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course" id="course" />
                  <Label htmlFor="course" className="cursor-pointer">Entre cursos</Label>
                </div>
                {currentTurmaId && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="turma" id="turma" />
                    <Label htmlFor="turma" className="cursor-pointer">Entre turmas</Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Target Selection */}
            {transferType === 'course' ? (
              <div className="space-y-2">
                <Label>Curso de destino</Label>
                <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum outro curso disponivel
                      </div>
                    ) : (
                      availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Turma de destino</Label>
                  {turmasLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando turmas...
                    </div>
                  ) : (
                    <Select value={targetTurmaId} onValueChange={setTargetTurmaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Nenhuma outra turma disponivel neste curso
                          </div>
                        ) : (
                          turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome}
                              {!turma.ativo && ' (Inativa)'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status da turma de origem</Label>
                  <Select value={sourceStatus} onValueChange={(v) => setSourceStatus(v as TurmaStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concluido">Concluido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="trancado">Trancado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Status que sera atribuido aos alunos na turma de origem apos a transferencia.
                  </p>
                </div>
              </>
            )}

            {/* Preview */}
            <div className="rounded-md border p-3 bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Transferir</span>
                <Badge variant="secondary">{selectedStudents.length} alunos</Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {transferType === 'course'
                    ? courses.find((c) => c.id === targetCourseId)?.name || 'Selecione...'
                    : turmas.find((t) => t.id === targetTurmaId)?.nome || 'Selecione...'}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-md border p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-xs text-muted-foreground">Sucesso</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">Ignorados</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-xs text-muted-foreground">Falhas</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <Label>Detalhes</Label>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-3 space-y-2">
                  {result.results.map((r) => (
                    <div
                      key={r.studentId}
                      className="flex items-start gap-2 text-sm border-b pb-2 last:border-0 last:pb-0"
                    >
                      {getStatusIcon(r.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {r.studentName || 'Aluno sem nome'}
                        </div>
                        {r.message && (
                          <div className="text-xs text-muted-foreground">{r.message}</div>
                        )}
                      </div>
                      {getStatusBadge(r.status)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isTransferring}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleTransfer}
                disabled={
                  isTransferring ||
                  (transferType === 'course' && !targetCourseId) ||
                  (transferType === 'turma' && !targetTurmaId)
                }
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transferindo...
                  </>
                ) : (
                  'Confirmar Transferencia'
                )}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
