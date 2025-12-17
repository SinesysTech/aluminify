-- Migration: Update handle_new_user function for multi-tenancy
-- Description: Atualiza função handle_new_user() para suportar cadastro com empresa
-- Author: Auto-generated
-- Date: 2025-12-17

-- Atualizar função handle_new_user() para incluir empresa_id
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    user_role text;
    empresa_id_param uuid;
    is_admin_param boolean;
begin
    -- Tenta ler o papel do usuário (ex: { "role": "professor" })
    user_role := new.raw_user_meta_data->>'role';

    -- Tenta ler empresa_id do metadata
    if new.raw_user_meta_data->>'empresa_id' is not null then
        empresa_id_param := (new.raw_user_meta_data->>'empresa_id')::uuid;
    end if;

    -- Tenta ler is_admin do metadata
    is_admin_param := coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false);

    if user_role = 'professor' then
        -- Para professores, empresa_id é obrigatório
        if empresa_id_param is null then
            raise exception 'empresa_id é obrigatório para professores';
        end if;

        -- Validar que empresa_id existe e está ativa
        if not exists (
            select 1
            from public.empresas
            where id = empresa_id_param
            and ativo = true
        ) then
            raise exception 'Empresa não encontrada ou inativa: %', empresa_id_param;
        end if;

        -- Insert professor record with empresa_id
        insert into public.professores (id, email, nome_completo, empresa_id, is_admin)
        values (
            new.id,
            coalesce(new.email, ''),
            coalesce(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                split_part(coalesce(new.email, ''), '@', 1),
                'Novo Professor'
            ),
            empresa_id_param,
            is_admin_param
        )
        on conflict (id) do update
        set
            email = excluded.email,
            nome_completo = coalesce(nullif(professores.nome_completo, ''), excluded.nome_completo),
            empresa_id = coalesce(professores.empresa_id, excluded.empresa_id),
            is_admin = coalesce(professores.is_admin, excluded.is_admin),
            updated_at = now();

        -- Se is_admin = true, também inserir em empresa_admins
        if is_admin_param = true then
            insert into public.empresa_admins (empresa_id, user_id, is_owner, permissoes)
            values (empresa_id_param, new.id, false, '{}'::jsonb)
            on conflict (empresa_id, user_id) do nothing;
        end if;
    elsif user_role = 'superadmin' then
        -- Superadmins não têm registro em professores
        -- Não fazer nada, apenas retornar
    else
        -- Default: Se não vier nada ou vier 'aluno', cria como Aluno
        -- Alunos não têm empresa_id diretamente (são vinculados via matrículas)
        insert into public.alunos (id, email, nome_completo)
        values (
            new.id,
            coalesce(new.email, ''),
            coalesce(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                split_part(coalesce(new.email, ''), '@', 1),
                'Novo Aluno'
            )
        )
        on conflict (id) do update
        set
            email = excluded.email,
            nome_completo = coalesce(nullif(alunos.nome_completo, ''), excluded.nome_completo),
            updated_at = now();
    end if;

    return new;
end;
$$;

-- Adicionar comentário
comment on function public.handle_new_user() is 'Trigger function que cria registros de professor ou aluno ao criar usuário. Suporta empresa_id e is_admin via user_metadata.';

