/**
 * Error codes and messages for the scheduling system
 * Provides consistent, user-friendly error messages in Portuguese
 */

export const AGENDAMENTO_ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
  OUTSIDE_AVAILABILITY: 'OUTSIDE_AVAILABILITY',
  MINIMUM_ADVANCE_TIME: 'MINIMUM_ADVANCE_TIME',
  PAST_DATE: 'PAST_DATE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  BLOQUEIO_CONFLICT: 'BLOQUEIO_CONFLICT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  PROFESSOR_NOT_FOUND: 'PROFESSOR_NOT_FOUND',
  AGENDAMENTO_NOT_FOUND: 'AGENDAMENTO_NOT_FOUND',
  NO_AVAILABILITY: 'NO_AVAILABILITY',

  // Status errors
  INVALID_STATUS: 'INVALID_STATUS',
  CANNOT_CANCEL: 'CANNOT_CANCEL',
  ALREADY_CONFIRMED: 'ALREADY_CONFIRMED',
  ALREADY_CANCELLED: 'ALREADY_CANCELLED',

  // Server errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type AgendamentoErrorCode = typeof AGENDAMENTO_ERROR_CODES[keyof typeof AGENDAMENTO_ERROR_CODES]

/**
 * User-friendly error messages in Portuguese
 */
export const AGENDAMENTO_ERROR_MESSAGES: Record<AgendamentoErrorCode, string> = {
  // Authentication errors
  [AGENDAMENTO_ERROR_CODES.UNAUTHORIZED]: 'Voce precisa estar logado para realizar esta acao.',
  [AGENDAMENTO_ERROR_CODES.FORBIDDEN]: 'Voce nao tem permissao para realizar esta acao.',

  // Validation errors
  [AGENDAMENTO_ERROR_CODES.SLOT_NOT_AVAILABLE]: 'Este horario nao esta mais disponivel. Por favor, escolha outro horario.',
  [AGENDAMENTO_ERROR_CODES.SLOT_ALREADY_BOOKED]: 'Este horario ja foi agendado por outro aluno. Por favor, escolha outro horario.',
  [AGENDAMENTO_ERROR_CODES.OUTSIDE_AVAILABILITY]: 'O professor nao tem disponibilidade neste horario.',
  [AGENDAMENTO_ERROR_CODES.MINIMUM_ADVANCE_TIME]: 'Agendamentos devem ser feitos com pelo menos {hours} horas de antecedencia.',
  [AGENDAMENTO_ERROR_CODES.PAST_DATE]: 'Nao e possivel agendar para uma data no passado.',
  [AGENDAMENTO_ERROR_CODES.INVALID_DATE_RANGE]: 'O periodo selecionado e invalido. A data de fim deve ser posterior a data de inicio.',
  [AGENDAMENTO_ERROR_CODES.BLOQUEIO_CONFLICT]: 'Este horario esta bloqueado. O professor nao esta disponivel neste periodo.',

  // Resource errors
  [AGENDAMENTO_ERROR_CODES.NOT_FOUND]: 'Recurso nao encontrado.',
  [AGENDAMENTO_ERROR_CODES.PROFESSOR_NOT_FOUND]: 'Professor nao encontrado.',
  [AGENDAMENTO_ERROR_CODES.AGENDAMENTO_NOT_FOUND]: 'Agendamento nao encontrado.',
  [AGENDAMENTO_ERROR_CODES.NO_AVAILABILITY]: 'Este professor ainda nao configurou horarios de disponibilidade.',

  // Status errors
  [AGENDAMENTO_ERROR_CODES.INVALID_STATUS]: 'Status invalido para esta operacao.',
  [AGENDAMENTO_ERROR_CODES.CANNOT_CANCEL]: 'Nao e possivel cancelar este agendamento. Cancelamentos devem ser feitos com pelo menos {hours} horas de antecedencia.',
  [AGENDAMENTO_ERROR_CODES.ALREADY_CONFIRMED]: 'Este agendamento ja foi confirmado.',
  [AGENDAMENTO_ERROR_CODES.ALREADY_CANCELLED]: 'Este agendamento ja foi cancelado.',

  // Server errors
  [AGENDAMENTO_ERROR_CODES.DATABASE_ERROR]: 'Ocorreu um erro ao salvar os dados. Por favor, tente novamente.',
  [AGENDAMENTO_ERROR_CODES.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
}

/**
 * Create a user-friendly error message with optional parameter substitution
 */
export function getErrorMessage(code: AgendamentoErrorCode, params?: Record<string, string | number>): string {
  let message = AGENDAMENTO_ERROR_MESSAGES[code] || AGENDAMENTO_ERROR_MESSAGES.UNKNOWN_ERROR

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value))
    })
  }

  return message
}

/**
 * Custom error class for agendamento errors
 */
export class AgendamentoError extends Error {
  code: AgendamentoErrorCode
  details?: Record<string, unknown>

  constructor(
    code: AgendamentoErrorCode,
    params?: Record<string, string | number>,
    details?: Record<string, unknown>
  ) {
    super(getErrorMessage(code, params))
    this.name = 'AgendamentoError'
    this.code = code
    this.details = details
  }
}

/**
 * Helper to check if an error is an AgendamentoError
 */
export function isAgendamentoError(error: unknown): error is AgendamentoError {
  return error instanceof AgendamentoError
}

/**
 * Convert any error to a user-friendly message
 */
export function toUserFriendlyMessage(error: unknown): string {
  if (isAgendamentoError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    // Check for common Supabase errors
    const message = error.message.toLowerCase()

    if (message.includes('row level security') || message.includes('rls')) {
      return AGENDAMENTO_ERROR_MESSAGES.FORBIDDEN
    }

    if (message.includes('not found') || message.includes('nao encontrado')) {
      return AGENDAMENTO_ERROR_MESSAGES.NOT_FOUND
    }

    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return AGENDAMENTO_ERROR_MESSAGES.SLOT_ALREADY_BOOKED
    }

    // Return the original message if it looks user-friendly (starts with uppercase Portuguese)
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕ]/.test(error.message) && error.message.length < 200) {
      return error.message
    }
  }

  return AGENDAMENTO_ERROR_MESSAGES.UNKNOWN_ERROR
}
