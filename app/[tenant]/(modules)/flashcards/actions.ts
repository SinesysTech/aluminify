'use server'

import { createClient } from '@/app/shared/core/server'
import { flashcardsService } from './services/flashcards.service'
import { FlashcardsReviewScope } from './services/flashcards.service'

export async function getCursos(empresaId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    return flashcardsService.getCursos(user.id, empresaId)
}

export async function getDisciplinas(cursoId: string) {
    return flashcardsService.getDisciplinas(cursoId)
}

export async function getFrentes(cursoId: string, disciplinaId: string) {
    return flashcardsService.getFrentes(cursoId, disciplinaId)
}

export async function getModulos(cursoId: string, frenteId: string) {
    return flashcardsService.getModulos(cursoId, frenteId)
}

export async function submitFeedback(cardId: string, feedback: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    return flashcardsService.sendFeedback(user.id, cardId, feedback)
}

export async function getFlashcards(
    modo: string,
    scope: FlashcardsReviewScope,
    cursoId?: string,
    frenteId?: string,
    moduloId?: string,
    excludeIds?: string[],
    empresaId?: string,
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const filters = {
        cursoId,
        frenteId,
        moduloId
    }

    return flashcardsService.listForReview(user.id, modo, filters, excludeIds, scope, empresaId)
}
