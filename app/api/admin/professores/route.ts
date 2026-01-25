import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { TeacherRepositoryImpl } from '@/app/[tenant]/(dashboard)/professor/services';
import { EmpresaRepositoryImpl } from '@/app/[tenant]/(dashboard)/empresa/services';
import { createClient } from '@/app/shared/core/server';

/**
 * POST /api/admin/professores
 * Criar professor (apenas superadmin)
 * Permite criar professor com ou sem empresaId
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode criar professores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, password, empresaId, cpf, phone, biography, photoUrl, specialty, isAdmin } = body;

    // Validar campos obrigatórios
    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'email, fullName e password são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar senha mínima
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Validar empresa se fornecida
    if (empresaId) {
      const supabase = await createClient();
      const empresaRepository = new EmpresaRepositoryImpl(supabase);
      const empresa = await empresaRepository.findById(empresaId);
      
      if (!empresa) {
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 404 }
        );
      }
    }

    // Usar cliente admin para criar usuário
    const adminClient = getDatabaseClient();

    // Se empresaId não foi fornecido, precisamos criar o registro manualmente
    // porque a trigger exige empresa_id. Vamos criar o usuário sem role='professor'
    // no metadata inicialmente, criar o registro manualmente, e depois atualizar o metadata
    let newUser;
    
    if (!empresaId) {
      // Criar usuário temporariamente sem role='professor' para evitar trigger
      const { data: tempUser, error: tempError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          // Não incluir role para evitar trigger de professor
          full_name: fullName,
        },
      });

      if (tempError || !tempUser.user) {
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${tempError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      // Criar registro de professor diretamente usando adminClient (bypass RLS e trigger)
      const { error: insertError } = await adminClient
        .from('professores')
        .insert({
          id: tempUser.user.id,
          email: email.toLowerCase(),
          nome_completo: fullName,
          empresa_id: empresaId || null,
          is_admin: isAdmin || false,
          cpf: cpf || null,
          telefone: phone || null,
          biografia: biography || null,
          foto_url: photoUrl || null,
          especialidade: specialty || null,
        });

      if (insertError) {
        console.error('Error creating professor record:', insertError);
        // Tentar deletar o usuário criado
        await adminClient.auth.admin.deleteUser(tempUser.user.id);
        return NextResponse.json(
          { error: `Erro ao criar registro de professor: ${insertError.message}` },
          { status: 500 }
        );
      }

      // Atualizar metadata do usuário para incluir role='professor'
      const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
        tempUser.user.id,
        {
          user_metadata: {
            role: 'professor',
            full_name: fullName,
            is_admin: isAdmin || false,
          },
        }
      );

      if (updateError || !updatedUser.user) {
        console.error('Error updating user metadata:', updateError);
        // Não falhar, o registro já foi criado
      }

      newUser = { user: updatedUser?.user || tempUser.user };
    } else {
      // Se empresaId foi fornecido, criar normalmente com trigger
      const userMetadata: Record<string, unknown> = {
        role: 'professor',
        full_name: fullName,
        empresa_id: empresaId,
        is_admin: isAdmin || false,
      };

      const { data: createdUser, error: userError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (userError) {
        console.error('Error creating auth user:', userError);
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${userError.message}` },
          { status: 500 }
        );
      }

      if (!createdUser.user) {
        return NextResponse.json(
          { error: 'Erro ao criar usuário' },
          { status: 500 }
        );
      }

      newUser = createdUser;
      // Aguardar um pouco para garantir que o trigger executou
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Buscar professor criado
    const supabase = await createClient();
    const repository = new TeacherRepositoryImpl(supabase);
    const professor = await repository.findById(newUser.user.id);

    if (!professor) {
      return NextResponse.json(
        { error: 'Professor criado mas registro não encontrado. Tente novamente.' },
        { status: 500 }
      );
    }

    // Se há campos adicionais para atualizar (e empresaId foi fornecido, então trigger criou)
    if (empresaId && (cpf || phone || biography || photoUrl || specialty)) {
      const updateData: Record<string, unknown> = {};
      if (cpf) updateData.cpf = cpf;
      if (phone) updateData.phone = phone;
      if (biography) updateData.biography = biography;
      if (photoUrl) updateData.photoUrl = photoUrl;
      if (specialty) updateData.specialty = specialty;
      
      if (Object.keys(updateData).length > 0) {
        const updatedProfessor = await repository.update(newUser.user.id, updateData);
        return NextResponse.json(updatedProfessor, { status: 201 });
      }
    }

    return NextResponse.json(professor, { status: 201 });
  } catch (error) {
    console.error('Error creating professor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar professor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

