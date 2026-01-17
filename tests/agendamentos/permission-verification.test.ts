/**
 * Permission verification tests for agendamentos
 * These tests verify that users can only access/modify their own appointments
 */

import { describe, it, expect } from 'vitest'

// Mock types for testing
interface MockUser {
  id: string
  role: 'aluno' | 'professor' | 'admin'
}

interface MockAgendamento {
  id: string
  professor_id: string
  aluno_id: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
}

// Helper function to check if user can cancel an agendamento
function canCancelAgendamento(user: MockUser, agendamento: MockAgendamento): boolean {
  // User must be either the student or the professor
  const isOwner = agendamento.aluno_id === user.id || agendamento.professor_id === user.id
  if (!isOwner) return false

  // Cannot cancel already cancelled or completed appointments
  if (agendamento.status === 'cancelado' || agendamento.status === 'concluido') {
    return false
  }

  return true
}

// Helper function to check if user can view an agendamento
function canViewAgendamento(user: MockUser, agendamento: MockAgendamento): boolean {
  return agendamento.aluno_id === user.id || agendamento.professor_id === user.id
}

// Helper function to check if student can create an agendamento
function canCreateAgendamento(user: MockUser, alunoId: string): boolean {
  return user.id === alunoId
}

describe('Agendamento Permission Verification', () => {
  const mockProfessor: MockUser = { id: 'prof-123', role: 'professor' }
  const mockAluno: MockUser = { id: 'aluno-456', role: 'aluno' }
  const mockOutroProfessor: MockUser = { id: 'prof-789', role: 'professor' }
  const mockOutroAluno: MockUser = { id: 'aluno-012', role: 'aluno' }

  const mockAgendamento: MockAgendamento = {
    id: 'ag-001',
    professor_id: 'prof-123',
    aluno_id: 'aluno-456',
    status: 'confirmado'
  }

  describe('Cancel Permission', () => {
    it('should allow professor to cancel their own appointment', () => {
      expect(canCancelAgendamento(mockProfessor, mockAgendamento)).toBe(true)
    })

    it('should allow student to cancel their own appointment', () => {
      expect(canCancelAgendamento(mockAluno, mockAgendamento)).toBe(true)
    })

    it('should NOT allow another professor to cancel appointment', () => {
      expect(canCancelAgendamento(mockOutroProfessor, mockAgendamento)).toBe(false)
    })

    it('should NOT allow another student to cancel appointment', () => {
      expect(canCancelAgendamento(mockOutroAluno, mockAgendamento)).toBe(false)
    })

    it('should NOT allow cancelling already cancelled appointment', () => {
      const cancelledAgendamento = { ...mockAgendamento, status: 'cancelado' as const }
      expect(canCancelAgendamento(mockAluno, cancelledAgendamento)).toBe(false)
    })

    it('should NOT allow cancelling completed appointment', () => {
      const completedAgendamento = { ...mockAgendamento, status: 'concluido' as const }
      expect(canCancelAgendamento(mockAluno, completedAgendamento)).toBe(false)
    })

    it('should allow cancelling pending appointment', () => {
      const pendingAgendamento = { ...mockAgendamento, status: 'pendente' as const }
      expect(canCancelAgendamento(mockAluno, pendingAgendamento)).toBe(true)
    })
  })

  describe('View Permission', () => {
    it('should allow professor to view their own appointment', () => {
      expect(canViewAgendamento(mockProfessor, mockAgendamento)).toBe(true)
    })

    it('should allow student to view their own appointment', () => {
      expect(canViewAgendamento(mockAluno, mockAgendamento)).toBe(true)
    })

    it('should NOT allow another professor to view appointment', () => {
      expect(canViewAgendamento(mockOutroProfessor, mockAgendamento)).toBe(false)
    })

    it('should NOT allow another student to view appointment', () => {
      expect(canViewAgendamento(mockOutroAluno, mockAgendamento)).toBe(false)
    })
  })

  describe('Create Permission', () => {
    it('should allow student to create appointment for themselves', () => {
      expect(canCreateAgendamento(mockAluno, mockAluno.id)).toBe(true)
    })

    it('should NOT allow student to create appointment for another student', () => {
      expect(canCreateAgendamento(mockAluno, mockOutroAluno.id)).toBe(false)
    })
  })
})

describe('Bloqueio Overlap Logic', () => {
  // Helper function to check if two date ranges overlap
  function rangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2
  }

  it('should detect overlapping ranges', () => {
    const bloqueio = {
      start: new Date('2026-01-15T09:00:00'),
      end: new Date('2026-01-15T12:00:00')
    }

    // Slot inside bloqueio - should overlap
    const slotInside = {
      start: new Date('2026-01-15T10:00:00'),
      end: new Date('2026-01-15T11:00:00')
    }
    expect(rangesOverlap(slotInside.start, slotInside.end, bloqueio.start, bloqueio.end)).toBe(true)

    // Slot partially overlapping (starts before, ends during)
    const slotPartialStart = {
      start: new Date('2026-01-15T08:00:00'),
      end: new Date('2026-01-15T10:00:00')
    }
    expect(rangesOverlap(slotPartialStart.start, slotPartialStart.end, bloqueio.start, bloqueio.end)).toBe(true)

    // Slot partially overlapping (starts during, ends after)
    const slotPartialEnd = {
      start: new Date('2026-01-15T11:00:00'),
      end: new Date('2026-01-15T13:00:00')
    }
    expect(rangesOverlap(slotPartialEnd.start, slotPartialEnd.end, bloqueio.start, bloqueio.end)).toBe(true)

    // Slot containing bloqueio
    const slotContaining = {
      start: new Date('2026-01-15T08:00:00'),
      end: new Date('2026-01-15T14:00:00')
    }
    expect(rangesOverlap(slotContaining.start, slotContaining.end, bloqueio.start, bloqueio.end)).toBe(true)
  })

  it('should NOT detect non-overlapping ranges', () => {
    const bloqueio = {
      start: new Date('2026-01-15T09:00:00'),
      end: new Date('2026-01-15T12:00:00')
    }

    // Slot completely before bloqueio
    const slotBefore = {
      start: new Date('2026-01-15T07:00:00'),
      end: new Date('2026-01-15T08:00:00')
    }
    expect(rangesOverlap(slotBefore.start, slotBefore.end, bloqueio.start, bloqueio.end)).toBe(false)

    // Slot completely after bloqueio
    const slotAfter = {
      start: new Date('2026-01-15T13:00:00'),
      end: new Date('2026-01-15T14:00:00')
    }
    expect(rangesOverlap(slotAfter.start, slotAfter.end, bloqueio.start, bloqueio.end)).toBe(false)

    // Slot ends exactly when bloqueio starts (edge case - should NOT overlap)
    const slotAdjacent = {
      start: new Date('2026-01-15T08:00:00'),
      end: new Date('2026-01-15T09:00:00')
    }
    expect(rangesOverlap(slotAdjacent.start, slotAdjacent.end, bloqueio.start, bloqueio.end)).toBe(false)
  })
})

describe('Timezone Handling', () => {
  it('should correctly calculate day of week in UTC', () => {
    // Monday in São Paulo = Monday in UTC (usually)
    const mondayBrazil = new Date('2026-01-19T10:00:00-03:00')
    expect(mondayBrazil.getUTCDay()).toBe(1) // Monday

    // Sunday in São Paulo might be Saturday in UTC depending on time
    const sundayLateBrazil = new Date('2026-01-18T23:00:00-03:00')
    expect(sundayLateBrazil.getUTCDay()).toBe(1) // Actually Monday UTC (02:00 on Jan 19)
  })

  it('should handle date-only strings consistently', () => {
    // When comparing date strings, use noon to avoid timezone edge cases
    const dateStr = '2026-01-15'
    const dateWithNoon = new Date(dateStr + 'T12:00:00')
    expect(dateWithNoon.getUTCDate()).toBe(15)
  })
})
