import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/backend/clients/database';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { StudentRepositoryImpl } from '@/backend/services/student';
import { studentService } from '@/backend/services/student';
import { randomBytes } from 'crypto';

/**
 * POST /api/admin/alunos
 * Criar aluno (apenas superadmin)
 * Permite criar aluno com ou sem courseIds
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode criar alunos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      fullName,
      cpf,
      phone,
      birthDate,
      address,
      zipCode,
      enrollmentNumber,
      instagram,
      twitter,
      courseIds,
      temporaryPassword,
    } = body;

    // Validar email obrigatório
    if (!email) {
      return NextResponse.json(
        { error: 'email é obrigatório' },
        { status: 400 }
      );
    }

    // Se courseIds não fornecido ou vazio, garantir que temporaryPassword seja fornecida
    const hasCourses = courseIds && Array.isArray(courseIds) && courseIds.length > 0;
    if (!hasCourses && !temporaryPassword && !cpf) {
      return NextResponse.json(
        {
          error:
            'Quando não há cursos, é necessário fornecer CPF ou senha temporária (temporaryPassword)',
        },
        { status: 400 }
      );
    }

    // Validar senha temporária se fornecida
    if (temporaryPassword && temporaryPassword.length < 8) {
      return NextResponse.json(
        { error: 'A senha temporária deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Se não há cursos, gerar senha temporária se não fornecida
    let finalTemporaryPassword = temporaryPassword;
    if (!hasCourses && !finalTemporaryPassword) {
      // Usar CPF como senha padrão (apenas os dígitos)
      if (cpf) {
        finalTemporaryPassword = cpf.replace(/\D/g, '');
      } else {
        // Fallback: gerar senha aleatória segura se não tiver CPF
        finalTemporaryPassword = randomBytes(16).toString('hex');
      }
    }

    try {
      // Usar o service de aluno, mas precisamos ajustar para permitir courseIds vazio
      // Por enquanto, vamos criar diretamente usando o adminClient quando não há cursos
      const adminClient = getDatabaseClient();

      if (!hasCourses) {
        // Criar aluno sem curso - criar usuário no auth primeiro
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: finalTemporaryPassword!,
          email_confirm: true,
          user_metadata: {
            role: 'aluno',
            full_name: fullName,
            must_change_password: true,
          },
        });

        if (authError || !authUser?.user) {
          return NextResponse.json(
            { error: `Erro ao criar usuário: ${authError?.message || 'Unknown error'}` },
            { status: 500 }
          );
        }

        // O trigger handle_new_user criará o registro em alunos automaticamente
        // Aguardar um pouco para garantir
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Buscar aluno criado
        const repository = new StudentRepositoryImpl(adminClient);
        let aluno = await repository.findById(authUser.user.id);

        if (!aluno) {
          return NextResponse.json(
            { error: 'Aluno criado mas registro não encontrado. Tente novamente.' },
            { status: 500 }
          );
        }

        // Se há campos adicionais para atualizar, fazer update
        const updateData: Record<string, unknown> = {};
        if (cpf) updateData.cpf = cpf;
        if (phone) updateData.phone = phone;
        if (birthDate) updateData.birthDate = birthDate;
        if (address) updateData.address = address;
        if (zipCode) updateData.zipCode = zipCode;
        if (enrollmentNumber) updateData.enrollmentNumber = enrollmentNumber;
        if (instagram) updateData.instagram = instagram;
        if (twitter) updateData.twitter = twitter;

        if (Object.keys(updateData).length > 0) {
          aluno = await repository.update(authUser.user.id, updateData);
        }

        // Retornar aluno sem cursos
        return NextResponse.json(
          {
            id: aluno.id,
            email: aluno.email,
            fullName: aluno.fullName,
            cpf: aluno.cpf,
            phone: aluno.phone,
            birthDate: aluno.birthDate,
            address: aluno.address,
            zipCode: aluno.zipCode,
            enrollmentNumber: aluno.enrollmentNumber,
            instagram: aluno.instagram,
            twitter: aluno.twitter,
            courses: [],
            courseIds: [],
            mustChangePassword: aluno.mustChangePassword,
            temporaryPassword: finalTemporaryPassword,
            createdAt: aluno.createdAt,
            updatedAt: aluno.updatedAt,
          },
          { status: 201 }
        );
      } else {
        // Se há cursos, usar o service normalmente
        const student = await studentService.create({
          email,
          fullName,
          cpf,
          phone,
          birthDate,
          address,
          zipCode,
          enrollmentNumber,
          instagram,
          twitter,
          courseIds,
          temporaryPassword: finalTemporaryPassword,
        });

        return NextResponse.json(student, { status: 201 });
      }
    } catch (error) {
      console.error('Error creating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar aluno';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in admin alunos endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar aluno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

