import { SupabaseClient } from '@supabase/supabase-js';
import { Course, CreateCourseInput, UpdateCourseInput, Modality, CourseType } from './course.types';

export interface CourseRepository {
  list(): Promise<Course[]>;
  findById(id: string): Promise<Course | null>;
  create(payload: CreateCourseInput): Promise<Course>;
  update(id: string, payload: UpdateCourseInput): Promise<Course>;
  delete(id: string): Promise<void>;
  segmentExists(segmentId: string): Promise<boolean>;
  disciplineExists(disciplineId: string): Promise<boolean>;
}

const TABLE = 'cursos';
const SEGMENT_TABLE = 'segmentos';
const DISCIPLINE_TABLE = 'disciplinas';

type CourseRow = {
  id: string;
  segmento_id: string | null;
  disciplina_id: string | null;
  nome: string;
  modalidade: Modality;
  tipo: CourseType;
  descricao: string | null;
  ano_vigencia: number;
  data_inicio: string | null;
  data_termino: string | null;
  meses_acesso: number | null;
  planejamento_url: string | null;
  imagem_capa_url: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CourseRow): Course {
  return {
    id: row.id,
    segmentId: row.segmento_id,
    disciplineId: row.disciplina_id,
    name: row.nome,
    modality: row.modalidade,
    type: row.tipo,
    description: row.descricao,
    year: row.ano_vigencia,
    startDate: row.data_inicio ? new Date(row.data_inicio) : null,
    endDate: row.data_termino ? new Date(row.data_termino) : null,
    accessMonths: row.meses_acesso,
    planningUrl: row.planejamento_url,
    coverImageUrl: row.imagem_capa_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Course[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Failed to list courses: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<Course | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateCourseInput): Promise<Course> {
    const insertData: Record<string, unknown> = {
      segmento_id: payload.segmentId ?? null,
      disciplina_id: payload.disciplineId ?? null,
      nome: payload.name,
      modalidade: payload.modality,
      tipo: payload.type,
      descricao: payload.description ?? null,
      ano_vigencia: payload.year,
      data_inicio: payload.startDate ?? null,
      data_termino: payload.endDate ?? null,
      meses_acesso: payload.accessMonths ?? null,
      planejamento_url: payload.planningUrl ?? null,
      imagem_capa_url: payload.coverImageUrl ?? null,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateCourseInput): Promise<Course> {
    const updateData: Record<string, unknown> = {};

    if (payload.segmentId !== undefined) {
      updateData.segmento_id = payload.segmentId;
    }

    if (payload.disciplineId !== undefined) {
      updateData.disciplina_id = payload.disciplineId;
    }

    if (payload.name !== undefined) {
      updateData.nome = payload.name;
    }

    if (payload.modality !== undefined) {
      updateData.modalidade = payload.modality;
    }

    if (payload.type !== undefined) {
      updateData.tipo = payload.type;
    }

    if (payload.description !== undefined) {
      updateData.descricao = payload.description;
    }

    if (payload.year !== undefined) {
      updateData.ano_vigencia = payload.year;
    }

    if (payload.startDate !== undefined) {
      updateData.data_inicio = payload.startDate;
    }

    if (payload.endDate !== undefined) {
      updateData.data_termino = payload.endDate;
    }

    if (payload.accessMonths !== undefined) {
      updateData.meses_acesso = payload.accessMonths;
    }

    if (payload.planningUrl !== undefined) {
      updateData.planejamento_url = payload.planningUrl;
    }

    if (payload.coverImageUrl !== undefined) {
      updateData.imagem_capa_url = payload.coverImageUrl;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  async segmentExists(segmentId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(SEGMENT_TABLE)
      .select('id')
      .eq('id', segmentId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check segment existence: ${error.message}`);
    }

    return !!data;
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(DISCIPLINE_TABLE)
      .select('id')
      .eq('id', disciplineId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check discipline existence: ${error.message}`);
    }

    return !!data;
  }
}

