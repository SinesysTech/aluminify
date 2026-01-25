
'use client'

import * as React from 'react'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, Trash2, Plus, Loader2, Search, X } from 'lucide-react'
import { FlashcardUploadCard } from '@/components/shared/flashcard-upload-card'
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty'

type Flashcard = {
    id: string
    modulo_id: string
    pergunta: string
    resposta: string
    pergunta_imagem_path?: string | null
    resposta_imagem_path?: string | null
    pergunta_imagem_url?: string | null
    resposta_imagem_url?: string | null
    created_at: string
    modulo: {
        id: string
        nome: string
        numero_modulo: number | null
        frente: {
            id: string
            nome: string
            disciplina: {
                id: string
                nome: string
            }
        }
    }
}

type Disciplina = {
    id: string
    nome: string
}

type Frente = {
    id: string
    nome: string
    disciplina_id: string | null
}

type Curso = {
    id: string
    nome: string
}

type Modulo = {
    id: string
    nome: string
    numero_modulo: number | null
    frente_id: string | null
}


// IDs estáveis para evitar erro de hidratação

const CREATE_DISCIPLINA_SELECT_ID = 'create-disciplina-flashcards'
const CREATE_FRENTE_SELECT_ID = 'create-frente-flashcards'
const CREATE_MODULO_SELECT_ID = 'create-modulo-flashcards'
const EDIT_DISCIPLINA_SELECT_ID = 'edit-disciplina-flashcards'
const EDIT_FRENTE_SELECT_ID = 'edit-frente-flashcards'
const EDIT_MODULO_SELECT_ID = 'edit-modulo-flashcards'

export default function FlashcardsAdminClient() {
    const supabase = createClient()


    const [flashcards, setFlashcards] = React.useState<Flashcard[]>([])
    const [total, setTotal] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const fetchWithAuth = React.useCallback(
        async (input: string, init?: RequestInit) => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Sessão expirada. Faça login novamente.')
            }

            const headers = new Headers(init?.headers || {})
            if (!(init?.body instanceof FormData)) {
                headers.set('Content-Type', 'application/json')
            }
            headers.set('Authorization', `Bearer ${session.access_token}`)

            return fetch(input, {
                ...init,
                headers,
            })
        },
        [supabase],
    )

    // Filtros
    const [disciplinaId, setDisciplinaId] = React.useState<string | undefined>(undefined)
    const [frenteId, setFrenteId] = React.useState<string | undefined>(undefined)
    const [moduloId, setModuloId] = React.useState<string | undefined>(undefined)
    const [search, setSearch] = React.useState<string>('')
    const [page, setPage] = React.useState(1)
    const limit = 20

    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Dados para filtros
    const [cursos, setCursos] = React.useState<Curso[]>([])
    const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
    const [frentes, setFrentes] = React.useState<Frente[]>([])
    const [modulos, setModulos] = React.useState<Modulo[]>([])
    const [, setLoadingCursos] = React.useState(false)
    const [loadingDisciplinas, setLoadingDisciplinas] = React.useState(false)
    const [loadingFrentes, setLoadingFrentes] = React.useState(false)
    const [loadingModulos, setLoadingModulos] = React.useState(false)

    // Modais
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
    const [editDialogOpen, setEditDialogOpen] = React.useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [selectedFlashcard, setSelectedFlashcard] = React.useState<Flashcard | null>(null)

    // Seleção múltipla
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = React.useState(false)

    // Formulário
    const [formModuloId, setFormModuloId] = React.useState<string | undefined>(undefined)
    const [formPergunta, setFormPergunta] = React.useState<string>('')
    const [formResposta, setFormResposta] = React.useState<string>('')
    const [saving, setSaving] = React.useState(false)
    const [perguntaImageFile, setPerguntaImageFile] = React.useState<File | null>(null)
    const [respostaImageFile, setRespostaImageFile] = React.useState<File | null>(null)
    const [perguntaImageUrl, setPerguntaImageUrl] = React.useState<string | null>(null)
    const [respostaImageUrl, setRespostaImageUrl] = React.useState<string | null>(null)
    const uploadFlashcardImage = React.useCallback(
        async (flashcardId: string, side: 'pergunta' | 'resposta', file: File) => {
            const formData = new FormData()
            formData.set('side', side)
            formData.set('file', file)
            const res = await fetchWithAuth(`/api/flashcards/${flashcardId}/imagem`, {
                method: 'POST',
                body: formData,
            })
            const body = await res.json().catch(() => ({} as Record<string, unknown>))
            if (!res.ok) {
                throw new Error((body as { error?: string }).error || 'Erro ao enviar imagem')
            }
        },
        [fetchWithAuth],
    )

    const deleteFlashcardImage = React.useCallback(
        async (flashcardId: string, side: 'pergunta' | 'resposta') => {
            const res = await fetchWithAuth(`/api/flashcards/${flashcardId}/imagem?side=${side}`, {
                method: 'DELETE',
                body: JSON.stringify({ side })
            })
            const body = await res.json().catch(() => ({} as Record<string, unknown>))
            if (!res.ok) {
                throw new Error((body as { error?: string }).error || 'Erro ao remover imagem')
            }
        },
        [fetchWithAuth],
    )

    const refreshFlashcardImages = React.useCallback(
        async (flashcardId: string) => {
            const res = await fetchWithAuth(`/api/flashcards/${flashcardId}`)
            const body = (await res.json()) as { data?: Flashcard; error?: string }
            if (!res.ok) {
                throw new Error(body?.error || 'Erro ao carregar flashcard')
            }
            setPerguntaImageUrl(body.data?.pergunta_imagem_url ?? null)
            setRespostaImageUrl(body.data?.resposta_imagem_url ?? null)
        },
        [fetchWithAuth],
    )

    // Carregar cursos
    React.useEffect(() => {
        const loadCursos = async () => {
            try {
                setLoadingCursos(true)
                const { data, error } = await supabase
                    .from('cursos')
                    .select('id, nome')
                    .order('nome', { ascending: true })

                if (error) throw error
                setCursos(data || [])
            } catch (err) {
                console.error('Erro ao carregar cursos:', err)
            } finally {
                setLoadingCursos(false)
            }
        }

        loadCursos()
    }, [supabase])

    // Carregar disciplinas
    React.useEffect(() => {
        const loadDisciplinas = async () => {
            try {
                setLoadingDisciplinas(true)
                const { data, error } = await supabase
                    .from('disciplinas')
                    .select('id, nome')
                    .order('nome', { ascending: true })

                if (error) throw error
                setDisciplinas(data || [])
            } catch (err) {
                console.error('Erro ao carregar disciplinas:', err)
            } finally {
                setLoadingDisciplinas(false)
            }
        }

        loadDisciplinas()
    }, [supabase])

    // Carregar frentes quando disciplina muda
    React.useEffect(() => {
        const loadFrentes = async () => {
            if (!disciplinaId) {
                setFrentes([])
                setFrenteId(undefined)
                setModulos([])
                setModuloId(undefined)
                return
            }

            try {
                setLoadingFrentes(true)
                const { data, error } = await supabase
                    .from('frentes')
                    .select('id, nome, disciplina_id')
                    .eq('disciplina_id', disciplinaId)
                    .order('nome', { ascending: true })

                if (error) throw error
                setFrentes((data || []).filter((f): f is Frente => f.disciplina_id !== null))
                setFrenteId(undefined)
                setModulos([])
                setModuloId(undefined)
            } catch (err) {
                console.error('Erro ao carregar frentes:', err)
            } finally {
                setLoadingFrentes(false)
            }
        }

        loadFrentes()
    }, [supabase, disciplinaId])

    // Carregar módulos quando frente muda
    React.useEffect(() => {
        const loadModulos = async () => {
            if (!frenteId) {
                setModulos([])
                setModuloId(undefined)
                return
            }

            try {
                setLoadingModulos(true)
                const { data, error } = await supabase
                    .from('modulos')
                    .select('id, nome, numero_modulo, frente_id')
                    .eq('frente_id', frenteId)
                    .order('numero_modulo', { ascending: true })

                if (error) throw error
                setModulos((data || []).filter((m): m is Modulo => m.frente_id !== null))
                setModuloId(undefined)
            } catch (err) {
                console.error('Erro ao carregar módulos:', err)
            } finally {
                setLoadingModulos(false)
            }
        }

        loadModulos()
    }, [supabase, frenteId])

    // Carregar flashcards
    const loadFlashcards = React.useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()
            if (disciplinaId) params.append('disciplinaId', disciplinaId)
            if (frenteId) params.append('frenteId', frenteId)
            if (moduloId) params.append('moduloId', moduloId)
            if (search?.trim()) params.append('search', search.trim())
            params.append('page', page.toString())
            params.append('limit', limit.toString())
            params.append('orderBy', 'created_at')
            params.append('orderDirection', 'desc')

            console.log('[flashcards client] Carregando flashcards com filtros:', {
                disciplinaId,
                frenteId,
                moduloId,
                search,
                page
            })

            const res = await fetchWithAuth(`/api/flashcards?${params.toString()}`)

            // Verificar o content-type e tentar parsear o JSON
            const contentType = res.headers.get('content-type')
            console.log('[flashcards client] Content-Type:', contentType)
            console.log('[flashcards client] Status:', res.status, res.statusText)

            let body: Record<string, unknown> = {}
            let responseText = ''

            try {
                responseText = await res.text()
                console.log('[flashcards client] Resposta raw (primeiros 1000 chars):', responseText.substring(0, 1000))

                if (responseText && responseText.trim()) {
                    try {
                        body = JSON.parse(responseText)
                    } catch (jsonError) {
                        console.error('[flashcards client] Erro ao parsear JSON:', jsonError)
                        // Se não conseguir parsear, usar o texto como mensagem de erro
                        throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 200)}`)
                    }
                } else {
                    console.warn('[flashcards client] Resposta vazia do servidor')
                }
            } catch (parseError) {
                console.error('[flashcards client] Erro ao processar resposta:', parseError)
                if (parseError instanceof Error) {
                    throw parseError
                }
                throw new Error(`Erro ao processar resposta do servidor: ${responseText || 'Resposta vazia ou inválida'}`)
            }

            console.log('[flashcards client] Resposta da API parseada:', {
                ok: res.ok,
                status: res.status,
                hasData: !!body.data,
                total: body.total,
                error: body.error,
                message: body.message,
                details: body.details,
                bodyKeys: Object.keys(body),
                bodyString: JSON.stringify(body).substring(0, 500)
            })

            if (!res.ok) {
                console.error('[flashcards client] Erro na resposta (status não OK):', {
                    status: res.status,
                    statusText: res.statusText,
                    body: body,
                    bodyString: JSON.stringify(body)
                })

                // Tentar extrair mensagem de erro de diferentes formatos
                let errorMessage = 'Erro ao carregar flashcards'

                // Primeiro, tentar extrair do body
                if (body?.error) {
                    const errorValue = body.error
                    if (typeof errorValue === 'string') {
                        errorMessage = errorValue
                        // Se a string parece ser JSON, tentar parsear
                        if (errorMessage.trim().startsWith('{') || errorMessage.trim().startsWith('[')) {
                            try {
                                const parsed = JSON.parse(errorMessage)
                                errorMessage = parsed.error || parsed.message || errorMessage
                            } catch {
                                // Se não conseguir parsear, usar a string original
                            }
                        }
                    } else {
                        errorMessage = JSON.stringify(errorValue)
                    }
                } else if (body?.message) {
                    const messageValue = body.message
                    if (typeof messageValue === 'string') {
                        errorMessage = messageValue
                    } else {
                        errorMessage = JSON.stringify(messageValue)
                    }
                } else if (responseText && responseText.trim()) {
                    // Tentar parsear o texto raw
                    try {
                        const parsed = JSON.parse(responseText)
                        errorMessage = parsed.error || parsed.message || 'Erro do servidor'
                    } catch {
                        // Se não for JSON, usar o texto diretamente
                        errorMessage = `Erro do servidor: ${responseText.substring(0, 200)}`
                    }
                } else {
                    errorMessage = `Erro ao carregar flashcards(${res.status} ${res.statusText})`
                }

                // Limpar mensagem de erro se ainda estiver mal formatada
                if (errorMessage.includes('{"') && errorMessage.length > 10) {
                    try {
                        // Tentar extrair JSON da mensagem
                        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0])
                            errorMessage = parsed.error || parsed.message || 'Erro ao processar resposta do servidor'
                        }
                    } catch {
                        // Se não conseguir parsear, limpar caracteres problemáticos
                        errorMessage = errorMessage.replace(/[{}"]/g, '').trim() || 'Erro ao processar resposta do servidor'
                    }
                }

                // Garantir que a mensagem não esteja vazia ou muito longa
                if (!errorMessage || errorMessage.trim().length === 0) {
                    errorMessage = `Erro ao carregar flashcards(${res.status})`
                }
                if (errorMessage.length > 500) {
                    errorMessage = errorMessage.substring(0, 500) + '...'
                }

                console.error('[flashcards client] Mensagem de erro final:', errorMessage)
                throw new Error(errorMessage)
            }

            const flashcardsData = Array.isArray(body.data) ? body.data : []
            setFlashcards(flashcardsData as Flashcard[])
            setTotal(typeof body.total === 'number' ? body.total : 0)
        } catch (err) {
            console.error('[flashcards client] Erro ao carregar flashcards:', err)
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar flashcards'
            console.error('[flashcards client] Mensagem de erro:', errorMessage)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [fetchWithAuth, disciplinaId, frenteId, moduloId, search, page])

    React.useEffect(() => {
        loadFlashcards()
    }, [loadFlashcards])

    // Limpar seleção quando flashcards mudarem (filtros, página, etc)
    React.useEffect(() => {
        setSelectedIds(new Set())
    }, [disciplinaId, frenteId, moduloId, search, page])

    const handleCreate = async () => {
        if (!formModuloId || !formPergunta.trim() || !formResposta.trim()) {
            setError('Preencha todos os campos obrigatórios.')
            return
        }

        try {
            setSaving(true)
            setError(null)

            const res = await fetchWithAuth('/api/flashcards', {
                method: 'POST',
                body: JSON.stringify({
                    moduloId: formModuloId,
                    pergunta: formPergunta.trim(),
                    resposta: formResposta.trim(),
                }),
            })

            const body = (await res.json()) as { data?: Flashcard; error?: string }

            if (!res.ok) {
                throw new Error(body?.error || 'Erro ao criar flashcard')
            }

            const createdId = body.data?.id
            if (createdId) {
                const uploads: Promise<void>[] = []
                if (perguntaImageFile) uploads.push(uploadFlashcardImage(createdId, 'pergunta', perguntaImageFile))
                if (respostaImageFile) uploads.push(uploadFlashcardImage(createdId, 'resposta', respostaImageFile))
                if (uploads.length > 0) {
                    try {
                        await Promise.all(uploads)
                    } catch (e) {
                        setError(e instanceof Error ? e.message : 'Erro ao enviar imagem')
                    }
                }
            }

            setCreateDialogOpen(false)
            setFormModuloId(undefined)
            setFormPergunta('')
            setFormResposta('')
            setPerguntaImageFile(null)
            setRespostaImageFile(null)
            loadFlashcards()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar flashcard')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = async (flashcard: Flashcard) => {
        setSelectedFlashcard(flashcard)
        setFormPergunta(flashcard.pergunta)
        setFormResposta(flashcard.resposta)
        setPerguntaImageFile(null)
        setRespostaImageFile(null)
        setPerguntaImageUrl(null)
        setRespostaImageUrl(null)

        // Carregar disciplina e frente do flashcard
        const disciplinaIdFromFlashcard = flashcard.modulo.frente.disciplina.id
        const frenteIdFromFlashcard = flashcard.modulo.frente.id

        setDisciplinaId(disciplinaIdFromFlashcard)

        // Carregar frentes da disciplina
        try {
            const { data: frentesData, error: frentesError } = await supabase
                .from('frentes')
                .select('id, nome, disciplina_id')
                .eq('disciplina_id', disciplinaIdFromFlashcard)
                .order('nome', { ascending: true })

            if (!frentesError) {
                setFrentes((frentesData || []).filter((f): f is Frente => f.disciplina_id !== null))
                setFrenteId(frenteIdFromFlashcard)

                // Carregar módulos da frente
                const { data: modulosData, error: modulosError } = await supabase
                    .from('modulos')
                    .select('id, nome, numero_modulo, frente_id')
                    .eq('frente_id', frenteIdFromFlashcard)
                    .order('numero_modulo', { ascending: true })

                if (!modulosError) {
                    setModulos((modulosData || []).filter((m): m is Modulo => m.frente_id !== null))
                    setFormModuloId(flashcard.modulo_id)
                }
            }
        } catch (err) {
            console.error('Erro ao carregar dados para edição:', err)
        }

        try {
            await refreshFlashcardImages(flashcard.id)
        } catch (e) {
            console.error('Erro ao carregar imagens do flashcard:', e)
        }

        setEditDialogOpen(true)
    }

    const handleUpdate = async () => {
        if (!selectedFlashcard || !formModuloId || !formPergunta.trim() || !formResposta.trim()) {
            setError('Preencha todos os campos obrigatórios.')
            return
        }

        try {
            setSaving(true)
            setError(null)

            const res = await fetchWithAuth(`/api/flashcards/${selectedFlashcard.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    moduloId: formModuloId,
                    pergunta: formPergunta.trim(),
                    resposta: formResposta.trim(),
                }),
            })

            const body = await res.json()

            if (!res.ok) {
                throw new Error(body?.error || 'Erro ao atualizar flashcard')
            }

            const uploads: Promise<void>[] = []
            if (perguntaImageFile) uploads.push(uploadFlashcardImage(selectedFlashcard.id, 'pergunta', perguntaImageFile))
            if (respostaImageFile) uploads.push(uploadFlashcardImage(selectedFlashcard.id, 'resposta', respostaImageFile))
            if (uploads.length > 0) {
                await Promise.all(uploads)
            }

            setEditDialogOpen(false)
            setSelectedFlashcard(null)
            setFormModuloId(undefined)
            setFormPergunta('')
            setFormResposta('')
            setPerguntaImageFile(null)
            setRespostaImageFile(null)
            setPerguntaImageUrl(null)
            setRespostaImageUrl(null)
            loadFlashcards()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar flashcard')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedFlashcard) return

        try {
            setSaving(true)
            setError(null)

            const res = await fetchWithAuth(`/api/flashcards/${selectedFlashcard.id}`, {
                method: 'DELETE',
                body: JSON.stringify({
                    // Assuming the API might need some body in future, usually not for DELETE
                }),
            })

            if (!res.ok) {
                const body = await res.json()
                throw new Error(body?.error || 'Erro ao deletar flashcard')
            }

            setDeleteDialogOpen(false)
            setSelectedFlashcard(null)
            loadFlashcards()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar flashcard')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteMultiple = async () => {
        if (selectedIds.size === 0) return

        try {
            setSaving(true)
            setError(null)

            // Deletar todos os flashcards selecionados
            const deletePromises = Array.from(selectedIds).map((id) =>
                fetchWithAuth(`/api/flashcards/${id}`, {
                    method: 'DELETE',
                })
            )

            const results = await Promise.allSettled(deletePromises)
            const errors = results
                .map((result, index) => {
                    if (result.status === 'rejected') {
                        return `Flashcard ${Array.from(selectedIds)[index]}: ${result.reason} `
                    }
                    if (!result.value.ok) {
                        return `Flashcard ${Array.from(selectedIds)[index]}: Erro ao deletar`
                    }
                    return null
                })
                .filter(Boolean)

            if (errors.length > 0) {
                setError(`Erro ao deletar alguns flashcards: ${errors.join(', ')} `)
            }

            setDeleteMultipleDialogOpen(false)
            setSelectedIds(new Set())
            loadFlashcards()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar flashcards')
        } finally {
            setSaving(false)
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(flashcards.map((f) => f.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds)
        if (checked) {
            newSelected.add(id)
        } else {
            newSelected.delete(id)
        }
        setSelectedIds(newSelected)
    }

    const isAllSelected = flashcards.length > 0 && selectedIds.size === flashcards.length

    const handleOpenCreate = () => {
        setFormModuloId(undefined)
        setFormPergunta('')
        setFormResposta('')
        setPerguntaImageFile(null)
        setRespostaImageFile(null)
        setPerguntaImageUrl(null)
        setRespostaImageUrl(null)
        setCreateDialogOpen(true)
    }

    const handleOpenDelete = (flashcard: Flashcard) => {
        setSelectedFlashcard(flashcard)
        setDeleteDialogOpen(true)
    }

    const clearFilters = () => {
        setDisciplinaId(undefined)
        setFrenteId(undefined)
        setModuloId(undefined)
        setSearch('')
        setPage(1)
    }

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Gestão de Flashcards</h1>
                    <p className="page-subtitle">
                        Gerencie os flashcards do sistema. Total: {total}
                    </p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Flashcard
                </Button>
            </div>

            {/* Upload de Flashcards */}
            <FlashcardUploadCard
                cursos={cursos}
                onUploadSuccess={() => {
                    // Recarregar lista de flashcards após importação
                    loadFlashcards()
                }}
            />

            {/* Filtros */}
            <div className="rounded-md border p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-1">
                        {mounted && (
                            <Select
                                value={disciplinaId ?? 'all'}
                                onValueChange={(value) => {
                                    setDisciplinaId(value === 'all' ? undefined : value)
                                    setFrenteId(undefined)
                                    setModuloId(undefined)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Disciplinas</SelectItem>
                                    {disciplinas.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        {mounted && (
                            <Select
                                value={frenteId ?? 'all'}
                                onValueChange={(value) => {
                                    setFrenteId(value === 'all' ? undefined : value)
                                    setModuloId(undefined)
                                }}
                                disabled={!disciplinaId || loadingFrentes}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Frente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Frentes</SelectItem>
                                    {frentes.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        {mounted && (
                            <Select
                                value={moduloId ?? 'all'}
                                onValueChange={(value) => setModuloId(value === 'all' ? undefined : value)}
                                disabled={!frenteId || loadingModulos}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Módulos</SelectItem>
                                    {modulos.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome} ` : m.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pergunta ou resposta..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {(disciplinaId || frenteId || moduloId || search) && (
                        <Button variant="outline" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Erro */}
            {error && (
                <div className="rounded-md border border-destructive p-6">
                    <p className="text-destructive">{error}</p>
                </div>
            )}

            {/* Tabela */}
            <div className="rounded-md border">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : flashcards.length === 0 ? (
                    <Empty>
                        <EmptyMedia>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Search className="h-6 w-6" />
                            </div>
                        </EmptyMedia>
                        <EmptyHeader>
                            <EmptyTitle>Nenhum flashcard encontrado</EmptyTitle>
                            <EmptyDescription>
                                {disciplinaId || frenteId || moduloId || search
                                    ? 'Tente ajustar os filtros ou criar um novo flashcard.'
                                    : 'Comece criando seu primeiro flashcard.'}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center justify-between border-b p-4">
                                <div className="text-sm text-muted-foreground">
                                    {selectedIds.size} flashcard{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteMultipleDialogOpen(true)}
                                    disabled={saving}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Deletar selecionados
                                </Button>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Pergunta</TableHead>
                                        <TableHead>Resposta</TableHead>
                                        <TableHead>Disciplina</TableHead>
                                        <TableHead>Frente</TableHead>
                                        <TableHead>Módulo</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flashcards.map((flashcard) => (
                                        <TableRow key={flashcard.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(flashcard.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(flashcard.id, checked as boolean)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={flashcard.pergunta}>
                                                    {flashcard.pergunta}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={flashcard.resposta}>
                                                    {flashcard.resposta}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {flashcard.modulo.frente.disciplina.nome}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{flashcard.modulo.frente.nome}</TableCell>
                                            <TableCell>
                                                {flashcard.modulo.numero_modulo
                                                    ? `M${flashcard.modulo.numero_modulo}: ${flashcard.modulo.nome} `
                                                    : flashcard.modulo.nome}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(flashcard)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDelete(flashcard)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-muted-foreground">
                                    Página {page} de {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1 || loading}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || loading}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Criar */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Criar Flashcard</DialogTitle>
                        <DialogDescription>
                            Preencha os campos para criar um novo flashcard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div className="space-y-2">
                            <Label>Disciplina *</Label>
                            <Select
                                value={disciplinaId}
                                onValueChange={(v) => {
                                    setDisciplinaId(v)
                                    setFormModuloId(undefined)
                                }}
                                disabled={loadingDisciplinas}
                            >
                                <SelectTrigger id={CREATE_DISCIPLINA_SELECT_ID}>
                                    <SelectValue placeholder="Selecione uma disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                    {disciplinas.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Frente *</Label>
                            <Select
                                value={frenteId}
                                onValueChange={(v) => {
                                    setFrenteId(v)
                                    setFormModuloId(undefined)
                                }}
                                disabled={!disciplinaId || loadingFrentes}
                            >
                                <SelectTrigger id={CREATE_FRENTE_SELECT_ID}>
                                    <SelectValue placeholder="Selecione uma frente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frentes.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Módulo *</Label>
                            <Select
                                value={formModuloId}
                                onValueChange={setFormModuloId}
                                disabled={!frenteId || loadingModulos}
                            >
                                <SelectTrigger id={CREATE_MODULO_SELECT_ID}>
                                    <SelectValue placeholder="Selecione um módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modulos.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome} ` : m.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Pergunta *</Label>
                            <Textarea
                                value={formPergunta}
                                onChange={(e) => setFormPergunta(e.target.value)}
                                placeholder="Digite a pergunta do flashcard..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem da Pergunta (opcional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPerguntaImageFile(e.target.files?.[0] ?? null)}
                            />
                            {(perguntaImageFile || perguntaImageUrl) && (
                                <div className="rounded-md border p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={perguntaImageFile ? URL.createObjectURL(perguntaImageFile) : (perguntaImageUrl ?? '')}
                                        alt="Pré-visualização da imagem da pergunta"
                                        className="max-h-48 w-auto mx-auto"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Resposta *</Label>
                            <Textarea
                                value={formResposta}
                                onChange={(e) => setFormResposta(e.target.value)}
                                placeholder="Digite a resposta do flashcard..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem da Resposta (opcional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setRespostaImageFile(e.target.files?.[0] ?? null)}
                            />
                            {(respostaImageFile || respostaImageUrl) && (
                                <div className="rounded-md border p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={respostaImageFile ? URL.createObjectURL(respostaImageFile) : (respostaImageUrl ?? '')}
                                        alt="Pré-visualização da imagem da resposta"
                                        className="max-h-48 w-auto mx-auto"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="mt-4 border-t pt-4 bg-background">
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Criar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Editar */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Editar Flashcard</DialogTitle>
                        <DialogDescription>
                            Atualize os campos do flashcard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div className="space-y-2">
                            <Label>Disciplina *</Label>
                            <Select
                                value={disciplinaId}
                                onValueChange={(v) => {
                                    setDisciplinaId(v)
                                    setFormModuloId(undefined)
                                }}
                                disabled={loadingDisciplinas}
                            >
                                <SelectTrigger id={EDIT_DISCIPLINA_SELECT_ID}>
                                    <SelectValue placeholder="Selecione uma disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                    {disciplinas.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Frente *</Label>
                            <Select
                                value={frenteId}
                                onValueChange={(v) => {
                                    setFrenteId(v)
                                    setFormModuloId(undefined)
                                }}
                                disabled={!disciplinaId || loadingFrentes}
                            >
                                <SelectTrigger id={EDIT_FRENTE_SELECT_ID}>
                                    <SelectValue placeholder="Selecione uma frente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frentes.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Módulo *</Label>
                            <Select
                                value={formModuloId}
                                onValueChange={setFormModuloId}
                                disabled={!frenteId || loadingModulos}
                            >
                                <SelectTrigger id={EDIT_MODULO_SELECT_ID}>
                                    <SelectValue placeholder="Selecione um módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modulos.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome} ` : m.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Pergunta *</Label>
                            <Textarea
                                value={formPergunta}
                                onChange={(e) => setFormPergunta(e.target.value)}
                                placeholder="Digite a pergunta do flashcard..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem da Pergunta</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPerguntaImageFile(e.target.files?.[0] ?? null)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedFlashcard || saving || (!perguntaImageUrl && !perguntaImageFile)}
                                    onClick={async () => {
                                        if (!selectedFlashcard) return
                                        if (perguntaImageFile) {
                                            setPerguntaImageFile(null)
                                            return
                                        }
                                        try {
                                            setSaving(true)
                                            await deleteFlashcardImage(selectedFlashcard.id, 'pergunta')
                                            setPerguntaImageUrl(null)
                                        } catch (e) {
                                            setError(e instanceof Error ? e.message : 'Erro ao remover imagem')
                                        } finally {
                                            setSaving(false)
                                        }
                                    }}
                                >
                                    Remover
                                </Button>
                            </div>
                            {(perguntaImageFile || perguntaImageUrl) && (
                                <div className="rounded-md border p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={perguntaImageFile ? URL.createObjectURL(perguntaImageFile) : (perguntaImageUrl ?? '')}
                                        alt="Imagem da pergunta"
                                        className="max-h-48 w-auto mx-auto"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Resposta *</Label>
                            <Textarea
                                value={formResposta}
                                onChange={(e) => setFormResposta(e.target.value)}
                                placeholder="Digite a resposta do flashcard..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem da Resposta</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setRespostaImageFile(e.target.files?.[0] ?? null)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedFlashcard || saving || (!respostaImageUrl && !respostaImageFile)}
                                    onClick={async () => {
                                        if (!selectedFlashcard) return
                                        if (respostaImageFile) {
                                            setRespostaImageFile(null)
                                            return
                                        }
                                        try {
                                            setSaving(true)
                                            await deleteFlashcardImage(selectedFlashcard.id, 'resposta')
                                            setRespostaImageUrl(null)
                                        } catch (e) {
                                            setError(e instanceof Error ? e.message : 'Erro ao remover imagem')
                                        } finally {
                                            setSaving(false)
                                        }
                                    }}
                                >
                                    Remover
                                </Button>
                            </div>
                            {(respostaImageFile || respostaImageUrl) && (
                                <div className="rounded-md border p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={respostaImageFile ? URL.createObjectURL(respostaImageFile) : (respostaImageUrl ?? '')}
                                        alt="Imagem da resposta"
                                        className="max-h-48 w-auto mx-auto"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="mt-4 border-t pt-4 bg-background">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Deletar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar este flashcard? Esta ação não pode ser desfeita.
                            {selectedFlashcard && (
                                <div className="mt-2 rounded-md bg-muted p-2">
                                    <div className="text-sm font-medium">Pergunta:</div>
                                    <div className="text-sm">{selectedFlashcard.pergunta}</div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deletando...
                                </>
                            ) : (
                                'Deletar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Deletar Múltiplos */}
            <AlertDialog open={deleteMultipleDialogOpen} onOpenChange={setDeleteMultipleDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar {selectedIds.size} flashcard{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMultiple} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deletando...
                                </>
                            ) : (
                                'Deletar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
