import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  StudentCourseSummary,
} from "./student.types";

import type {
  PaginationParams,
  PaginationMeta,
} from "@/types/shared/dtos/api-responses";

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface StudentRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Student>>;
  findById(id: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findByCpf(cpf: string): Promise<Student | null>;
  findByEnrollmentNumber(enrollmentNumber: string): Promise<Student | null>;
  create(payload: CreateStudentInput): Promise<Student>;
  update(id: string, payload: UpdateStudentInput): Promise<Student>;
  delete(id: string): Promise<void>;
  findByEmpresa(empresaId: string): Promise<Student[]>;
}

const TABLE = "alunos";
const COURSE_LINK_TABLE = "alunos_cursos";
const COURSES_TABLE = "cursos";

function formatSupabaseError(error: unknown): string {
  if (!error) return "Erro desconhecido (vazio)";
  if (error instanceof Error) return error.message || "Erro sem mensagem";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    const code = e.code ? `[${String(e.code)}]` : "";
    const message =
      typeof e.message === "string" && e.message.trim()
        ? e.message
        : typeof e.error === "string" && e.error.trim()
          ? e.error
          : "";
    const details = e.details ? ` Detalhes: ${String(e.details)}` : "";
    const hint = e.hint ? ` Hint: ${String(e.hint)}` : "";

    if (code || message || details || hint) {
      return `${[code, message].filter(Boolean).join(" ")}${details}${hint}`.trim();
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Erro desconhecido (objeto não serializável)";
    }
  }
  return String(error);
}

// Use generated Database types instead of manual definitions
type StudentRow = Database["public"]["Tables"]["alunos"]["Row"];
type StudentInsert = Database["public"]["Tables"]["alunos"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["alunos"]["Update"];

/**
 * Map database row to domain object
 *
 * Demonstrates proper handling of nullable fields from the database:
 * - nome_completo: string | null → fullName: string | null
 * - cpf: string | null → cpf: string | null
 * - telefone: string | null → phone: string | null
 * - data_nascimento: string | null → birthDate: Date | null (with conversion)
 * - endereco: string | null → address: string | null
 * - cep: string | null → zipCode: string | null
 * - numero_matricula: string | null → enrollmentNumber: string | null
 * - instagram: string | null → instagram: string | null
 * - twitter: string | null → twitter: string | null
 *
 * Best Practices:
 * - Preserve null values (don't convert to undefined or empty strings)
 * - Use ternary operator for type conversions (e.g., string to Date)
 * - Handle null explicitly when converting types
 *
 * For more information, see: docs/TYPESCRIPT_SUPABASE_GUIDE.md#nullable-fields
 */
function mapRow(
  row: StudentRow,
  courses: StudentCourseSummary[] = [],
): Student {
  // Cast para acessar empresa_id e deleted_at
  const rowWithExtras = row as StudentRow & {
    empresa_id?: string | null;
    deleted_at?: string | null;
  };

  return {
    id: row.id,
    empresaId: rowWithExtras.empresa_id ?? null,
    fullName: row.nome_completo,
    email: row.email,
    cpf: row.cpf,
    phone: row.telefone,
    birthDate: row.data_nascimento ? new Date(row.data_nascimento) : null,
    address: row.endereco,
    zipCode: row.cep,
    cidade: row.cidade ?? null,
    estado: row.estado ?? null,
    bairro: row.bairro ?? null,
    pais: row.pais ?? null,
    numeroEndereco: row.numero_endereco ?? null,
    complemento: row.complemento ?? null,
    enrollmentNumber: row.numero_matricula,
    instagram: row.instagram,
    twitter: row.twitter,
    hotmartId: row.hotmart_id ?? null,
    origemCadastro: row.origem_cadastro ?? null,
    courses,
    mustChangePassword: row.must_change_password,
    temporaryPassword: row.senha_temporaria,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: rowWithExtras.deleted_at
      ? new Date(rowWithExtras.deleted_at)
      : null,
  };
}

export class StudentRepositoryImpl implements StudentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Student>> {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 50;
    const sortBy = params?.sortBy ?? "nome_completo";
    const sortOrder = params?.sortOrder === "desc" ? false : true;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Para count, selecione apenas `id` para evitar falhas por permissões em outras colunas.
    let queryBuilder = this.client
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);

    if (params?.query) {
      const q = params.query;
      queryBuilder = queryBuilder.or(
        `nome_completo.ilike.%${q}%,email.ilike.%${q}%,numero_matricula.ilike.%${q}%`,
      );
    }

    // Get total count
    const { count, error: countError } = await queryBuilder;

    if (countError) {
      throw new Error(`Failed to count students: ${formatSupabaseError(countError)}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Get paginated data
    let dataQuery = this.client
      .from(TABLE)
      .select("*")
      .is("deleted_at", null)
      .order(sortBy, { ascending: sortOrder })
      .range(from, to);

    if (params?.query) {
      const q = params.query;
      dataQuery = dataQuery.or(
        `nome_completo.ilike.%${q}%,email.ilike.%${q}%,numero_matricula.ilike.%${q}%`,
      );
    }

    const { data, error } = await dataQuery;

    if (error) {
      throw new Error(`Failed to list students: ${formatSupabaseError(error)}`);
    }

    const students = await this.attachCourses(data ?? []);

    return {
      data: students,
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [student] = await this.attachCourses([data]);
    return student ?? null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student by email: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [student] = await this.attachCourses([data]);
    return student ?? null;
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("cpf", cpf)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student by CPF: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [student] = await this.attachCourses([data]);
    return student ?? null;
  }

  async findByEnrollmentNumber(
    enrollmentNumber: string,
  ): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("numero_matricula", enrollmentNumber)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch student by enrollment number: ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    const [student] = await this.attachCourses([data]);
    return student ?? null;
  }

  async create(payload: CreateStudentInput): Promise<Student> {
    // O ID deve sempre ser fornecido (vem do auth.users criado no service)
    if (!payload.id) {
      throw new Error(
        "Student ID is required. User must be created in auth.users first.",
      );
    }

    // Cast para incluir empresa_id e novos campos Hotmart
    const insertData = {
      id: payload.id,
      empresa_id: payload.empresaId ?? null,
      nome_completo: payload.fullName ?? null,
      email: payload.email.toLowerCase(),
      cpf: payload.cpf ?? null,
      telefone: payload.phone ?? null,
      data_nascimento: payload.birthDate ?? null,
      endereco: payload.address ?? null,
      cep: payload.zipCode ?? null,
      cidade: payload.cidade ?? null,
      estado: payload.estado ?? null,
      bairro: payload.bairro ?? null,
      pais: payload.pais ?? null,
      numero_endereco: payload.numeroEndereco ?? null,
      complemento: payload.complemento ?? null,
      numero_matricula: payload.enrollmentNumber ?? null,
      instagram: payload.instagram ?? null,
      twitter: payload.twitter ?? null,
      hotmart_id: payload.hotmartId ?? null,
      origem_cadastro: payload.origemCadastro ?? null,
      must_change_password: payload.mustChangePassword ?? false,
      senha_temporaria: payload.temporaryPassword ?? null,
    } as StudentInsert & { empresa_id?: string | null };

    const { data, error } = await this.client
      .from(TABLE)
      .upsert(insertData)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }

    await this.setCourses(payload.id, payload.courseIds ?? []);

    const [student] = await this.attachCourses([data]);
    return student;
  }

  async update(id: string, payload: UpdateStudentInput): Promise<Student> {
    const updateData: StudentUpdate = {};

    if (payload.fullName !== undefined) {
      updateData.nome_completo = payload.fullName;
    }

    if (payload.email !== undefined) {
      updateData.email = payload.email.toLowerCase();
    }

    if (payload.cpf !== undefined) {
      updateData.cpf = payload.cpf;
    }

    if (payload.phone !== undefined) {
      updateData.telefone = payload.phone;
    }

    if (payload.birthDate !== undefined) {
      updateData.data_nascimento = payload.birthDate;
    }

    if (payload.address !== undefined) {
      updateData.endereco = payload.address;
    }

    if (payload.zipCode !== undefined) {
      updateData.cep = payload.zipCode;
    }

    if (payload.enrollmentNumber !== undefined) {
      updateData.numero_matricula = payload.enrollmentNumber;
    }

    if (payload.instagram !== undefined) {
      updateData.instagram = payload.instagram;
    }

    if (payload.twitter !== undefined) {
      updateData.twitter = payload.twitter;
    }

    if (payload.cidade !== undefined) {
      updateData.cidade = payload.cidade;
    }

    if (payload.estado !== undefined) {
      updateData.estado = payload.estado;
    }

    if (payload.bairro !== undefined) {
      updateData.bairro = payload.bairro;
    }

    if (payload.pais !== undefined) {
      updateData.pais = payload.pais;
    }

    if (payload.numeroEndereco !== undefined) {
      updateData.numero_endereco = payload.numeroEndereco;
    }

    if (payload.complemento !== undefined) {
      updateData.complemento = payload.complemento;
    }

    if (payload.hotmartId !== undefined) {
      updateData.hotmart_id = payload.hotmartId;
    }

    if (payload.origemCadastro !== undefined) {
      updateData.origem_cadastro = payload.origemCadastro;
    }

    if (payload.mustChangePassword !== undefined) {
      updateData.must_change_password = payload.mustChangePassword;
    }

    if (payload.temporaryPassword !== undefined) {
      updateData.senha_temporaria = payload.temporaryPassword;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }

    if (payload.courseIds) {
      await this.setCourses(id, payload.courseIds);
    }

    const [student] = await this.attachCourses([data]);
    return student;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  private async attachCourses(rows: StudentRow[]): Promise<Student[]> {
    if (!rows.length) {
      return [];
    }

    const studentIds = rows.map((row) => row.id);
    const courseMap = await this.fetchCourses(studentIds);

    return rows.map((row) => mapRow(row, courseMap.get(row.id) ?? []));
  }

  private async fetchCourses(
    studentIds: string[],
  ): Promise<Map<string, StudentCourseSummary[]>> {
    const map = new Map<string, StudentCourseSummary[]>();
    if (!studentIds.length) {
      return map;
    }

    const { data: links, error: linksError } = await this.client
      .from(COURSE_LINK_TABLE)
      .select("aluno_id, curso_id")
      .in("aluno_id", studentIds);

    if (linksError) {
      throw new Error(`Failed to fetch student courses: ${linksError.message}`);
    }

    const courseIds = Array.from(
      new Set((links ?? []).map((link) => link.curso_id)),
    );
    if (!courseIds.length) {
      return map;
    }

    const { data: courses, error: courseError } = await this.client
      .from(COURSES_TABLE)
      .select("id, nome")
      .in("id", courseIds);

    if (courseError) {
      throw new Error(`Failed to fetch courses: ${courseError.message}`);
    }

    const courseLookup = new Map<string, StudentCourseSummary>(
      (courses ?? []).map((course) => [
        course.id,
        { id: course.id, name: course.nome },
      ]),
    );

    (links ?? []).forEach((link) => {
      const course = courseLookup.get(link.curso_id);
      if (!course) {
        return;
      }

      if (!map.has(link.aluno_id)) {
        map.set(link.aluno_id, []);
      }
      map.get(link.aluno_id)!.push(course);
    });

    return map;
  }

  async findByEmpresa(empresaId: string): Promise<Student[]> {
    // Buscar cursos da empresa
    const { data: cursos, error: cursosError } = await this.client
      .from(COURSES_TABLE)
      .select("id")
      .eq("empresa_id", empresaId);

    if (cursosError) {
      throw new Error(
        `Failed to fetch courses by empresa: ${cursosError.message}`,
      );
    }

    const cursoIds = (cursos ?? []).map((c: { id: string }) => c.id);

    if (!cursoIds.length) {
      return [];
    }

    // Buscar alunos matriculados nesses cursos
    const { data: alunosCursos, error: alunosCursosError } = await this.client
      .from(COURSE_LINK_TABLE)
      .select("aluno_id")
      .in("curso_id", cursoIds);

    if (alunosCursosError) {
      throw new Error(
        `Failed to fetch students by empresa: ${alunosCursosError.message}`,
      );
    }

    const alunoIds = Array.from(
      new Set(
        (alunosCursos ?? []).map((ac: { aluno_id: string }) => ac.aluno_id),
      ),
    );

    if (!alunoIds.length) {
      return [];
    }

    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .in("id", alunoIds)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (error) {
      throw new Error(`Failed to list students by empresa: ${error.message}`);
    }

    return this.attachCourses(data ?? []);
  }

  private async setCourses(
    studentId: string,
    courseIds: string[],
  ): Promise<void> {
    const { error: deleteError } = await this.client
      .from(COURSE_LINK_TABLE)
      .delete()
      .eq("aluno_id", studentId);

    if (deleteError) {
      throw new Error(
        `Failed to clear student courses: ${deleteError.message}`,
      );
    }

    if (!courseIds || !courseIds.length) {
      return;
    }

    const rows = courseIds.map((courseId) => ({
      aluno_id: studentId,
      curso_id: courseId,
    }));

    const { error: insertError } = await this.client
      .from(COURSE_LINK_TABLE)
      .insert(rows);
    if (insertError) {
      throw new Error(
        `Failed to link student to courses: ${insertError.message}`,
      );
    }
  }
}
