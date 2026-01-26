import { TipoAtividade } from "@/app/shared/types/enums";

export interface RegraAtividade {
  id: string;
  cursoId: string | null;
  tipoAtividade: TipoAtividade;
  nomePadrao: string;
  frequenciaModulos: number;
  comecarNoModulo: number;
  acumulativo: boolean;
  acumulativoDesdeInicio: boolean;
  gerarNoUltimo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRegraAtividadeInput {
  cursoId: string;
  tipoAtividade: TipoAtividade;
  nomePadrao: string;
  frequenciaModulos?: number;
  comecarNoModulo?: number;
  acumulativo?: boolean;
  acumulativoDesdeInicio?: boolean;
  gerarNoUltimo?: boolean;
}

export interface UpdateRegraAtividadeInput {
  tipoAtividade?: TipoAtividade;
  nomePadrao?: string;
  frequenciaModulos?: number;
  comecarNoModulo?: number;
  acumulativo?: boolean;
  acumulativoDesdeInicio?: boolean;
  gerarNoUltimo?: boolean;
}
