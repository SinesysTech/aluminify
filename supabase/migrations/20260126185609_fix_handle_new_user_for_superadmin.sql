-- Migration: Fix handle_new_user for superadmin users
-- Description: Superadmins não devem criar registro em professores
-- Author: Claude
-- Date: 2026-01-26

-- Atualizar função handle_new_user() para tratar superadmin separadamente
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

    -- SUPERADMIN: Não cria nenhum registro adicional
    -- Superadmins são apenas usuários em auth.users com role='superadmin' no metadata
    if user_role = 'superadmin' then
        -- Nada a fazer - superadmin não precisa de registro em outras tabelas
        return new;
    end if;

    if user_role = 'professor' or user_role = 'usuario' then
        -- Validar que empresa_id existe e está ativa (se fornecido)
        if empresa_id_param is not null then
            if not exists (
                select 1
                from public.empresas
                where id = empresa_id_param
                and ativo = true
            ) then
                raise exception 'Empresa não encontrada ou inativa: %', empresa_id_param;
            end if;
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

        -- Se is_admin = true, também inserir em empresa_admins (se empresa_id fornecido)
        if is_admin_param = true and empresa_id_param is not null then
            insert into public.empresa_admins (empresa_id, user_id, is_owner, permissoes)
            values (empresa_id_param, new.id, false, '{}'::jsonb)
            on conflict (empresa_id, user_id) do nothing;
        end if;
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
comment on function public.handle_new_user() is 'Trigger function que cria registros de professor ou aluno ao criar usuário. Superadmins não criam registros adicionais.';
