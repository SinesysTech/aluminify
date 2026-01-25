
'use client'

import * as React from 'react'
import { Upload, FileText, CheckCircle2, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/client'
import { cn } from '@/lib/utils'
import { PdfViewerModal } from '@/components/shared/pdf-viewer-modal'

const MATERIAIS_BUCKET = 'materiais_didaticos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf']

interface ActivityUploadRowProps {
    atividadeId: string
    titulo: string
    tipo?: string
    arquivoUrl: string | null
    onUploadSuccess?: () => void
    className?: string
}

export function ActivityUploadRow({
    atividadeId,
    titulo,
    arquivoUrl,
    onUploadSuccess,
    className,
}: ActivityUploadRowProps) {
    const [isUploading, setIsUploading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isReplacing, setIsReplacing] = React.useState(false)
    const [pdfModalOpen, setPdfModalOpen] = React.useState(false)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validar tipo
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Tipo de arquivo não permitido. Use PDF.')
            return
        }

        // Validar tamanho
        if (file.size > MAX_FILE_SIZE) {
            setError(`Arquivo muito grande. Tamanho máximo: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`)
            return
        }

        setError(null)
        setIsUploading(true)

        try {
            const supabase = createClient()

            // Verificar autenticação
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                throw new Error('Não autenticado')
            }

            // Gerar nome único para o arquivo
            const timestamp = Date.now()
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `${atividadeId}/${timestamp}-${sanitizedFileName}`

            // Upload direto para o Storage
            const { error: uploadError } = await supabase.storage
                .from(MATERIAIS_BUCKET)
                .upload(filePath, file, {
                    contentType: 'application/pdf',
                    upsert: false,
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                throw new Error(uploadError.message || 'Erro ao fazer upload do arquivo')
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage.from(MATERIAIS_BUCKET).getPublicUrl(filePath)
            const publicUrl = urlData.publicUrl

            // Atualizar atividade no banco com a URL
            const response = await fetch(`/api/atividade/${atividadeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    arquivoUrl: publicUrl,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                await supabase.storage.from(MATERIAIS_BUCKET).remove([filePath])
                throw new Error(errorData.error || 'Erro ao salvar URL no banco de dados')
            }

            if (onUploadSuccess) {
                onUploadSuccess()
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
        } finally {
            setIsUploading(false)
            setIsReplacing(false)
        }
    }

    const handleReplace = () => {
        setIsReplacing(true)
        fileInputRef.current?.click()
    }

    const handleView = () => {
        if (arquivoUrl) {
            setPdfModalOpen(true)
        }
    }

    const hasFile = !!arquivoUrl

    return (
        <div className={cn('relative rounded-md border p-3', className)}>
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                    {hasFile ? (
                        <>
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium truncate">{titulo}</span>
                                </div>
                                <span className="text-xs text-muted-foreground truncate block">
                                    {arquivoUrl.split('/').pop()?.substring(0, 50)}...
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{titulo}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Arquivo não enviado</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                        aria-label={`Selecionar arquivo PDF para ${titulo}`}
                    />

                    {hasFile ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleView}
                                disabled={isUploading}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReplace}
                                disabled={isUploading}
                            >
                                {isReplacing && isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Substituindo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Substituir
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Enviar PDF
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            {hasFile && arquivoUrl && (
                <PdfViewerModal
                    open={pdfModalOpen}
                    onOpenChange={setPdfModalOpen}
                    pdfUrl={arquivoUrl}
                    title={titulo}
                />
            )}
        </div>
    )
}
