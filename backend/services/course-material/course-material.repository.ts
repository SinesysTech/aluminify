import { SupabaseClient } from '@supabase/supabase-js';
import {
  CourseMaterial,
  CreateCourseMaterialInput,
  UpdateCourseMaterialInput,
  MaterialType,
} from './course-material.types';

export interface CourseMaterialRepository {
  list(): Promise<CourseMaterial[]>;
  findById(id: string): Promise<CourseMaterial | null>;
  findByCourseId(courseId: string): Promise<CourseMaterial[]>;
  create(payload: CreateCourseMaterialInput): Promise<CourseMaterial>;
  update(id: string, payload: UpdateCourseMaterialInput): Promise<CourseMaterial>;
  delete(id: string): Promise<void>;
  courseExists(courseId: string): Promise<boolean>;
}

const TABLE = 'materiais_curso';
const COURSE_TABLE = 'cursos';

type CourseMaterialRow = {
  id: string;
  curso_id: string;
  titulo: string;
  descricao_opcional: string | null;
  tipo: MaterialType;
  arquivo_url: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CourseMaterialRow): CourseMaterial {
  return {
    id: row.id,
    courseId: row.curso_id,
    title: row.titulo,
    description: row.descricao_opcional,
    type: row.tipo,
    fileUrl: row.arquivo_url,
    order: row.ordem,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class CourseMaterialRepositoryImpl implements CourseMaterialRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<CourseMaterial[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list course materials: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<CourseMaterial | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch course material: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByCourseId(courseId: string): Promise<CourseMaterial[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('curso_id', courseId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch course materials by course: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(payload: CreateCourseMaterialInput): Promise<CourseMaterial> {
    const { data: course, error: courseError } = await this.client
      .from(COURSE_TABLE)
      .select('empresa_id')
      .eq('id', payload.courseId)
      .maybeSingle();

    if (courseError) {
      throw new Error(`Failed to fetch course empresa_id: ${courseError.message}`);
    }

    const empresaId = (course as { empresa_id?: string | null } | null)?.empresa_id ?? null;
    if (!empresaId) {
      throw new Error(`Course "${payload.courseId}" does not have empresa_id (inconsistent data)`);
    }

    const insertData: Record<string, unknown> = {
      curso_id: payload.courseId,
      empresa_id: empresaId,
      titulo: payload.title,
      descricao_opcional: payload.description ?? null,
      tipo: payload.type || 'Apostila',
      arquivo_url: payload.fileUrl,
      ordem: payload.order ?? 0,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create course material: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateCourseMaterialInput): Promise<CourseMaterial> {
    const updateData: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updateData.titulo = payload.title;
    }

    if (payload.description !== undefined) {
      updateData.descricao_opcional = payload.description;
    }

    if (payload.type !== undefined) {
      updateData.tipo = payload.type;
    }

    if (payload.fileUrl !== undefined) {
      updateData.arquivo_url = payload.fileUrl;
    }

    if (payload.order !== undefined) {
      updateData.ordem = payload.order;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update course material: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete course material: ${error.message}`);
    }
  }

  async courseExists(courseId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(COURSE_TABLE)
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check course existence: ${error.message}`);
    }

    return !!data;
  }
}

