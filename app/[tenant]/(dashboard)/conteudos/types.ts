export type TipoAtividade =
  | "Nivel_1"
  | "Nivel_2"
  | "Nivel_3"
  | "Nivel_4"
  | "Conceituario"
  | "Lista_Mista"
  | "Simulado_Diagnostico"
  | "Simulado_Cumulativo"
  | "Simulado_Global"
  | "Flashcards"
  | "Revisao";

export interface Atividade {
  id: string;
  moduloId: string;
  tipo: TipoAtividade;
  titulo: string;
  arquivoUrl: string | null;
  gabaritoUrl: string | null;
  linkExterno: string | null;
  obrigatorio: boolean;
  ordemExibicao: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuloComAtividades {
  id: string;
  nome: string;
  numero_modulo: number | null;
  frente_id: string;
  atividades: Atividade[];
}

export interface RegraAtividade {
  id: string;
  cursoId: string | null;
  tipoAtividade: TipoAtividade;
  nomePadrao: string;
  frequenciaModulos: number;
  comecarNoModulo: number;
  acumulativo: boolean;
  acumulativoDesdeInicio?: boolean;
  gerarNoUltimo: boolean;
}
