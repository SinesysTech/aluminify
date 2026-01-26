/**
 * @deprecated Use types from '@/app/shared/types/entities/activity' instead
 * This file is kept for backward compatibility
 */
export type {
  MetodoEstudo,
  LogPausaTipo,
  LogPausa,
  SessaoStatus,
  SessaoEstudo,
  IniciarSessaoInput,
  FinalizarSessaoInput,
  CalculoTempoResultado,
} from "@/app/shared/types/entities/activity";

// Re-export sala de estudos specific types
export type {
  AtividadeComProgresso,
  CursoComDisciplinas,
  DisciplinaComFrentes,
  FrenteComModulos,
  ModuloComAtividades,
  DesempenhoData,
  Frente,
} from "./types";
