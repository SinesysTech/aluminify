import { SupabaseClient } from '@supabase/supabase-js';
import { Course, CreateCourseInput, UpdateCourseInput, Modality, CourseType } from './course.types';
import type { PaginationParams, PaginationMeta } from '@/types/shared/dtos/api-responses';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CourseRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Course>>;
  findById(id: string): Promise<Course | null>;
  create(payload: CreateCourseInput): Promise<Course>;
  update(id: string, payload: UpdateCourseInput): Promise<Course>;
  delete(id: string): Promise<void>;
  findByEmpresa(empresaId: string): Promise<Course[]>;
  segmentExists(segmentId: string): Promise<boolean>;
  disciplineExists(disciplineId: string): Promise<boolean>;
  setCourseDisciplines(courseId: string, disciplineIds: string[]): Promise<void>;
  getCourseDisciplines(courseId: string): Promise<string[]>;
}

const TABLE = 'cursos';
const SEGMENT_TABLE = 'segmentos';
const DISCIPLINE_TABLE = 'disciplinas';
const COURSE_DISCIPLINES_TABLE = 'cursos_disciplinas';

type CourseRow = {
  id: string;
  empresa_id: string;
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

async function mapRow(row: CourseRow, client: SupabaseClient): Promise<Course> {
  // Buscar disciplinas relacionadas
  const disciplineIds = await getCourseDisciplinesFromDb(row.id, client);
  
  return {
    id: row.id,
    empresaId: row.empresa_id,
    segmentId: row.segmento_id,
    disciplineId: row.disciplina_id, // Mantido para compatibilidade
    disciplineIds, // Nova propriedade
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

async function getCourseDisciplinesFromDb(courseId: string, client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from(COURSE_DISCIPLINES_TABLE)
    .select('disciplina_id')
    .eq('curso_id', courseId);

  if (error) {
    console.error(`Failed to fetch course disciplines: ${error.message}`);
    return [];
  }

  return (data ?? []).map((row: { disciplina_id: string }) => row.disciplina_id);
}

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Course>> {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 50;
    const sortBy = params?.sortBy ?? 'nome';
    const sortOrder = params?.sortOrder === 'desc' ? false : true;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Get total count
    const { count, error: countError } = await this.client
      .from(TABLE)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count courses: ${countError.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Get paginated data
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order(sortBy, { ascending: sortOrder })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to list courses: ${error.message}`);
    }

    const courses = await Promise.all((data ?? []).map(row => mapRow(row, this.client)));

    return {
      data: courses,
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<Course | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data ? mapRow(data, this.client) : null;
  }

  async create(payload: CreateCourseInput): Promise<Course> {
    // Determinar disciplineIds: usar disciplineIds se fornecido, senão usar disciplineId (compatibilidade)
    const disciplineIds = payload.disciplineIds ?? (payload.disciplineId ? [payload.disciplineId] : []);

    const insertData: Record<string, unknown> = {
      empresa_id: payload.empresaId,
      segmento_id: payload.segmentId ?? null,
      disciplina_id: disciplineIds.length > 0 ? disciplineIds[0] : null, // Manter primeira disciplina para compatibilidade
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

    // Inserir relacionamentos de disciplinas
    if (disciplineIds.length > 0) {
      await this.setCourseDisciplines(data.id, disciplineIds);
    }

    return mapRow(data, this.client);
  }

  async update(id: string, payload: UpdateCourseInput): Promise<Course> {
    const updateData: Record<string, unknown> = {};

    if (payload.segmentId !== undefined) {
      updateData.segmento_id = payload.segmentId;
    }

    // Se disciplineIds foi fornecido, usar ele; senão, se disciplineId foi fornecido, usar ele
    if (payload.disciplineIds !== undefined) {
      // Atualizar relacionamentos de disciplinas
      await this.setCourseDisciplines(id, payload.disciplineIds);
      // Atualizar disciplina_id para compatibilidade (primeira disciplina)
      updateData.disciplina_id = payload.disciplineIds.length > 0 ? payload.disciplineIds[0] : null;
    } else if (payload.disciplineId !== undefined) {
      updateData.disciplina_id = payload.disciplineId;
      // Atualizar relacionamentos também
      await this.setCourseDisciplines(id, payload.disciplineId ? [payload.disciplineId] : []);
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

    return mapRow(data, this.client);
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

  async setCourseDisciplines(courseId: string, disciplineIds: string[]): Promise<void> {
    // Remover relacionamentos existentes
    const { error: deleteError } = await this.client
      .from(COURSE_DISCIPLINES_TABLE)
      .delete()
      .eq('curso_id', courseId);

    if (deleteError) {
      throw new Error(`Failed to remove course disciplines: ${deleteError.message}`);
    }

    // Inserir novos relacionamentos
    if (disciplineIds.length > 0) {
      const insertData = disciplineIds.map(disciplinaId => ({
        curso_id: courseId,
        disciplina_id: disciplinaId,
      }));

      const { error: insertError } = await this.client
        .from(COURSE_DISCIPLINES_TABLE)
        .insert(insertData);

      if (insertError) {
        throw new Error(`Failed to set course disciplines: ${insertError.message}`);
      }
    }
  }

  async getCourseDisciplines(courseId: string): Promise<string[]> {
    return getCourseDisciplinesFromDb(courseId, this.client);
  }

  async findByEmpresa(empresaId: string): Promise<Course[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Failed to list courses by empresa: ${error.message}`);
    }

    return Promise.all((data ?? []).map(row => mapRow(row, this.client)));
  }
}

