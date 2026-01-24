import { TipoAtividade } from "@/backend/services/atividade";
import {
  StatusAtividade,
  DificuldadePercebida,
} from "@/backend/services/progresso-atividade";

export interface AtividadeComProgresso {
  id: string;
  moduloId: string;
  tipo: TipoAtividade;
  titulo: string;
  arquivoUrl: string | null;
  gabaritoUrl: string | null;
  linkExterno: string | null;
  obrigatorio: boolean;
  ordemExibicao: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  moduloNome: string;
  moduloNumero: number | null;
  frenteNome: string;
  frenteId: string;
  disciplinaNome: string;
  disciplinaId: string;
  cursoNome: string;
  cursoId: string;
  progressoStatus: StatusAtividade | null;
  progressoDataInicio: string | null;
  progressoDataConclusao: string | null;
  // Campos de desempenho (quando concluído com check qualificado)
  questoesTotais?: number | null;
  questoesAcertos?: number | null;
  dificuldadePercebida?: DificuldadePercebida | null;
  anotacoesPessoais?: string | null;
}

export interface ModuloComAtividades {
  id: string;
  nome: string;
  numeroModulo: number | null;
  frenteId: string;
  atividades: AtividadeComProgresso[];
}

export interface FrenteComModulos {
  id: string;
  nome: string;
  disciplinaId: string;
  modulos: ModuloComAtividades[];
}

export interface DisciplinaComFrentes {
  id: string;
  nome: string;
  frentes: FrenteComModulos[];
}

export interface CursoComDisciplinas {
  id: string;
  nome: string;
  disciplinas: DisciplinaComFrentes[];
}

export interface Frente {
  id: string;
  nome: string;
  disciplina_id: string;
}

export interface DesempenhoData {
  questoesTotais: number;
  questoesAcertos: number;
  dificuldadePercebida: DificuldadePercebida;
  anotacoesPessoais?: string | null;
}
