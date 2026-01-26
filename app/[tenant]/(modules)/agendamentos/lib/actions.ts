"use server";

/**
 * Agendamentos Actions Index
 *
 * This file re-exports all server action functions from specialized modules to maintain
 * backward compatibility while allowing a more modular and maintainable structure.
 *
 * NOTE: Types should be imported directly from "@/app/[tenant]/(modules)/agendamentos/types"
 * because "use server" files can only export async server action functions.
 *
 * IMPORTANT: Server Actions require explicit re-exports, not barrel exports (export * from).
 */

// Availability actions
export {
  getDisponibilidade,
  upsertDisponibilidade,
  getAvailableSlots,
  getAvailableSlotsLegacy,
  getAvailabilityForMonth,
  deleteDisponibilidade,
  bulkUpsertDisponibilidade,
  getProfessoresDisponibilidade,
} from "./availability-actions";

// Appointment actions
export {
  createAgendamento,
  getAgendamentosProfessor,
  getAgendamentosAluno,
  getAgendamentoById,
  confirmarAgendamento,
  rejeitarAgendamento,
  cancelAgendamentoWithReason,
  updateAgendamento,
  getAgendamentosEmpresa,
  getAgendamentoStats,
} from "./appointment-actions";

// Config actions
export {
  getConfiguracoesProfessor,
  updateConfiguracoesProfessor,
  getIntegracaoProfessor,
  updateIntegracaoProfessor,
} from "./config-actions";

// Recurrence actions
export {
  getRecorrencias,
  createRecorrencia,
  updateRecorrencia,
  deleteRecorrencia,
  getBloqueios,
  createBloqueio,
  updateBloqueio,
  deleteBloqueio,
} from "./recurrence-actions";

// Validation actions
export { validateAgendamento, checkConflitos } from "./validation-actions";

// Report actions
export { gerarRelatorio, getRelatorios, getRelatorioById } from "./report-actions";

// Professor selection actions
export {
  getProfessoresDisponiveis,
  getProfessorById,
} from "./professor-selection-actions";
