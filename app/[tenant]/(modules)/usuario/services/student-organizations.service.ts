import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Student Organization - represents an organization where the student is enrolled
 */
export interface StudentOrganization {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  courseCount: number;
}

/**
 * Response for student organizations query
 */
export interface StudentOrganizationsResponse {
  organizations: StudentOrganization[];
  isMultiOrg: boolean;
}

/**
 * Course with organization info
 */
export interface StudentCourseWithOrg {
  id: string;
  nome: string;
  modalidade: string | null;
  tipo: string | null;
  anoVigencia: number | null;
  dataInicio: string | null;
  dataTermino: string | null;
}

/**
 * Organization with its courses
 */
export interface OrganizationWithCourses {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  courses: StudentCourseWithOrg[];
}

/**
 * Response for courses grouped by organization
 */
export interface CoursesByOrgResponse {
  organizations: OrganizationWithCourses[];
}

/**
 * Service to manage student organizations and cross-tenant access.
 *
 * This service uses the database function `get_aluno_empresas()` to fetch
 * all organizations where the current student is enrolled via course enrollments.
 */
export class StudentOrganizationsService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Get all organizations where the current student is enrolled.
   * Uses the RPC function `get_aluno_empresas()` which is defined in the database.
   */
  async getStudentOrganizations(): Promise<StudentOrganizationsResponse> {
    // Call the RPC function to get empresa IDs for the current student
    const { data: empresaIds, error: rpcError } =
      await this.client.rpc("get_aluno_empresas");

    if (rpcError) {
      throw new Error(
        `Failed to get student organizations: ${rpcError.message}`,
      );
    }

    if (!empresaIds || empresaIds.length === 0) {
      return {
        organizations: [],
        isMultiOrg: false,
      };
    }

    // Extract empresa_id values from the RPC result
    const orgIds = empresaIds.map(
      (row: { empresa_id: string }) => row.empresa_id,
    );

    // Fetch organization details
    const { data: empresas, error: empresasError } = await this.client
      .from("empresas")
      .select("id, nome, slug, logo_url")
      .in("id", orgIds)
      .eq("ativo", true);

    if (empresasError) {
      throw new Error(
        `Failed to fetch organization details: ${empresasError.message}`,
      );
    }

    // Count courses per organization
    const courseCounts = await this.getCourseCounts(orgIds);

    const organizations: StudentOrganization[] = (empresas ?? []).map(
      (empresa) => ({
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        logoUrl: empresa.logo_url,
        courseCount: courseCounts.get(empresa.id) ?? 0,
      }),
    );

    return {
      organizations,
      isMultiOrg: organizations.length > 1,
    };
  }

  /**
   * Get courses grouped by organization for the current student.
   */
  async getCoursesByOrganization(): Promise<CoursesByOrgResponse> {
    // First get the student's course enrollments
    const { data: enrollments, error: enrollmentsError } = await this.client
      .from("alunos_cursos")
      .select("curso_id");

    if (enrollmentsError) {
      throw new Error(
        `Failed to fetch student enrollments: ${enrollmentsError.message}`,
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return { organizations: [] };
    }

    const courseIds = enrollments.map((e) => e.curso_id);

    // Fetch courses with their empresa_id
    const { data: courses, error: coursesError } = await this.client
      .from("cursos")
      .select(
        "id, nome, modalidade, tipo, ano_vigencia, data_inicio, data_termino, empresa_id",
      )
      .in("id", courseIds);

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`);
    }

    if (!courses || courses.length === 0) {
      return { organizations: [] };
    }

    // Get unique empresa IDs
    const empresaIds = [
      ...new Set(courses.map((c) => c.empresa_id).filter(Boolean)),
    ] as string[];

    // Fetch organization details
    const { data: empresas, error: empresasError } = await this.client
      .from("empresas")
      .select("id, nome, slug, logo_url")
      .in("id", empresaIds)
      .eq("ativo", true);

    if (empresasError) {
      throw new Error(
        `Failed to fetch organization details: ${empresasError.message}`,
      );
    }

    // Group courses by organization
    const orgMap = new Map<string, OrganizationWithCourses>();

    for (const empresa of empresas ?? []) {
      orgMap.set(empresa.id, {
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        logoUrl: empresa.logo_url,
        courses: [],
      });
    }

    for (const course of courses) {
      if (!course.empresa_id) continue;

      const org = orgMap.get(course.empresa_id);
      if (org) {
        org.courses.push({
          id: course.id,
          nome: course.nome,
          modalidade: course.modalidade,
          tipo: course.tipo,
          anoVigencia: course.ano_vigencia,
          dataInicio: course.data_inicio,
          dataTermino: course.data_termino,
        });
      }
    }

    // Sort courses by name within each org
    for (const org of orgMap.values()) {
      org.courses.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    // Convert to array and sort by org name
    const organizations = Array.from(orgMap.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );

    return { organizations };
  }

  /**
   * Get course counts per organization for the current student.
   */
  private async getCourseCounts(
    orgIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    if (orgIds.length === 0) {
      return counts;
    }

    // Get student's enrolled courses
    const { data: enrollments, error: enrollmentsError } = await this.client
      .from("alunos_cursos")
      .select("curso_id");

    if (enrollmentsError || !enrollments) {
      return counts;
    }

    const courseIds = enrollments.map((e) => e.curso_id);

    if (courseIds.length === 0) {
      return counts;
    }

    // Count courses per organization
    const { data: courses, error: coursesError } = await this.client
      .from("cursos")
      .select("id, empresa_id")
      .in("id", courseIds)
      .in("empresa_id", orgIds);

    if (coursesError || !courses) {
      return counts;
    }

    for (const course of courses) {
      if (course.empresa_id) {
        counts.set(course.empresa_id, (counts.get(course.empresa_id) ?? 0) + 1);
      }
    }

    return counts;
  }
}

/**
 * Factory function to create StudentOrganizationsService with a Supabase client.
 * The client should have the user context for RLS to work correctly.
 */
export function createStudentOrganizationsService(
  client: SupabaseClient,
): StudentOrganizationsService {
  return new StudentOrganizationsService(client);
}
