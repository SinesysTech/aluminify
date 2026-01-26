/**
 * Consolidated types for Pessoas (People) module.
 * Re-exports from shared types ensuring single source of truth.
 */

// Re-export common user types
export * from "@/app/shared/types/entities/user";

// =============================================
// Dashboard View Types
// =============================================

/**
 * Aluno sob cuidado do professor (visão de dashboard)
 */
export interface StudentUnderCare {
  id: string;
  name: string;
  avatarUrl: string | null;
  cursoNome: string;
  progresso: number; // Percentual (0-100)
  ultimaAtividade: string | null; // Data ISO
  aproveitamento: number; // Percentual (0-100)
}
