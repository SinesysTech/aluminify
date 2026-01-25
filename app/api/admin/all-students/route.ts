import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';

/**
 * GET /api/admin/all-students
 * Lista todos os alunos de todas as empresas (apenas superadmin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode listar todos os alunos.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Shape esperado do select com relações embutidas (pode vir como objeto ou array dependendo da relação)
    type AlunoComCursos = {
      id: string
      email: string
      nome_completo: string | null
      cpf: string | null
      created_at: string
      updated_at: string
      alunos_cursos?: Array<{
        curso_id: string
        cursos?:
          | {
              id: string
              nome: string
              empresa_id: string | null
              empresas?: { nome: string } | Array<{ nome: string }> | null
            }
          | Array<{
              id: string
              nome: string
              empresa_id: string | null
              empresas?: { nome: string } | Array<{ nome: string }> | null
            }>
          | null
      }>
    }

    // Buscar todos os alunos com informações dos cursos e empresas
    const { data: alunos, error } = await supabase
      .from('alunos')
      .select(`
        id,
        email,
        nome_completo,
        cpf,
        created_at,
        updated_at,
        alunos_cursos (
          curso_id,
          cursos (
            id,
            nome,
            empresa_id,
            empresas ( nome )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .returns<AlunoComCursos[]>();

    if (error) {
      throw error;
    }

    // Transformar dados para facilitar visualização
    const alunosFormatados = (alunos || []).map((aluno) => {
      const empresas = new Set<string>();
      const cursos = (aluno.alunos_cursos || []).map((ac) => {
        const curso = Array.isArray(ac.cursos) ? (ac.cursos[0] ?? null) : (ac.cursos ?? null)
        const empresaNome = Array.isArray(curso?.empresas)
          ? (curso.empresas[0]?.nome ?? undefined)
          : curso?.empresas?.nome

        if (empresaNome) empresas.add(empresaNome)
        return {
          id: curso?.id,
          nome: curso?.nome,
          empresaId: curso?.empresa_id,
          empresaNome,
        };
      });

      return {
        id: aluno.id,
        email: aluno.email,
        nomeCompleto: aluno.nome_completo,
        cpf: aluno.cpf,
        empresas: Array.from(empresas),
        cursos,
        createdAt: aluno.created_at,
        updatedAt: aluno.updated_at,
      };
    });

    return NextResponse.json(alunosFormatados);
  } catch (error) {
    console.error('Error listing all students:', error);
    return NextResponse.json(
      { error: 'Erro ao listar alunos' },
      { status: 500 }
    );
  }
}

