import {
  RegraAtividade,
  CreateRegraAtividadeInput,
  UpdateRegraAtividadeInput,
} from "./regras.types";
import { RegraAtividadeRepository } from "./regras.repository";
import {
  RegraAtividadeNotFoundError,
  RegraAtividadeValidationError,
} from "./regras.errors";
import { TipoAtividade } from "@/app/shared/types/enums";

const VALID_TIPOS: TipoAtividade[] = [
  "Nivel_1",
  "Nivel_2",
  "Nivel_3",
  "Nivel_4",
  "Conceituario",
  "Lista_Mista",
  "Simulado_Diagnostico",
  "Simulado_Cumulativo",
  "Simulado_Global",
  "Flashcards",
  "Revisao",
];

export class RegraAtividadeService {
  constructor(private readonly repository: RegraAtividadeRepository) {}

  async listByCurso(cursoId: string): Promise<RegraAtividade[]> {
    this.ensureId(cursoId, "curso_id");
    return this.repository.listByCurso(cursoId);
  }

  async getById(id: string): Promise<RegraAtividade> {
    return this.ensureExists(id);
  }

  async create(input: CreateRegraAtividadeInput): Promise<RegraAtividade> {
    this.ensureId(input.cursoId, "curso_id");
    this.ensureTipo(input.tipoAtividade);
    const nomePadrao = this.ensureNome(input.nomePadrao);
    const frequencia = this.ensurePositiveInt(
      input.frequenciaModulos ?? 1,
      "frequencia_modulos",
    );
    const comecarNoModulo = this.ensurePositiveInt(
      input.comecarNoModulo ?? 1,
      "comecar_no_modulo",
    );

    return this.repository.create({
      ...input,
      nomePadrao,
      frequenciaModulos: frequencia,
      comecarNoModulo,
      acumulativo: input.acumulativo ?? false,
      acumulativoDesdeInicio: input.acumulativoDesdeInicio ?? false,
      gerarNoUltimo: input.gerarNoUltimo ?? false,
    });
  }

  async update(
    id: string,
    payload: UpdateRegraAtividadeInput,
  ): Promise<RegraAtividade> {
    await this.ensureExists(id);

    const updateData: UpdateRegraAtividadeInput = {};

    if (payload.tipoAtividade !== undefined) {
      this.ensureTipo(payload.tipoAtividade);
      updateData.tipoAtividade = payload.tipoAtividade;
    }

    if (payload.nomePadrao !== undefined) {
      updateData.nomePadrao = this.ensureNome(payload.nomePadrao);
    }

    if (payload.frequenciaModulos !== undefined) {
      updateData.frequenciaModulos = this.ensurePositiveInt(
        payload.frequenciaModulos,
        "frequencia_modulos",
      );
    }

    if (payload.comecarNoModulo !== undefined) {
      updateData.comecarNoModulo = this.ensurePositiveInt(
        payload.comecarNoModulo,
        "comecar_no_modulo",
      );
    }

    if (payload.acumulativo !== undefined) {
      updateData.acumulativo = payload.acumulativo;
    }

    if (payload.acumulativoDesdeInicio !== undefined) {
      updateData.acumulativoDesdeInicio = payload.acumulativoDesdeInicio;
    }

    if (payload.gerarNoUltimo !== undefined) {
      updateData.gerarNoUltimo = payload.gerarNoUltimo;
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.delete(id);
  }

  private ensureId(value?: string, field?: string) {
    if (!value || !value.trim()) {
      throw new RegraAtividadeValidationError(`${field ?? "id"} é obrigatório`);
    }
  }

  private ensureNome(nome?: string): string {
    const trimmed = nome?.trim();
    if (!trimmed) {
      throw new RegraAtividadeValidationError("nome_padrao é obrigatório");
    }
    if (trimmed.length < 3) {
      throw new RegraAtividadeValidationError(
        "nome_padrao deve ter ao menos 3 caracteres",
      );
    }
    return trimmed;
  }

  private ensureTipo(tipo?: TipoAtividade) {
    if (!tipo) {
      throw new RegraAtividadeValidationError("tipo_atividade é obrigatório");
    }
    if (!VALID_TIPOS.includes(tipo)) {
      throw new RegraAtividadeValidationError("tipo_atividade inválido");
    }
  }

  private ensurePositiveInt(value: number, field: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RegraAtividadeValidationError(
        `${field} deve ser um inteiro positivo`,
      );
    }
    return value;
  }

  private async ensureExists(id: string): Promise<RegraAtividade> {
    this.ensureId(id);
    const regra = await this.repository.findById(id);
    if (!regra) {
      throw new RegraAtividadeNotFoundError(id);
    }
    return regra;
  }
}
