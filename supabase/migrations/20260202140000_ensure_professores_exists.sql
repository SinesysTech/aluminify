-- Ensure professores table exists
-- This migration restores the table if it was accidentally dropped or missing
-- Based on 20251120202412_create_professores_table.sql

create table if not exists public.professores (
    id uuid primary key references auth.users(id) on delete cascade,
    nome_completo text not null,
    email text unique not null,
    cpf text unique,
    telefone text,
    biografia text,
    foto_url text,
    especialidade text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    empresa_id uuid, -- Added based on later migrations
    is_admin boolean default false, -- Added based on usages seen
    deleted_at timestamptz -- Added for consistency
);

-- Recreate trigger if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_update_professores') then
    create trigger on_update_professores
    before update on public.professores
    for each row
    execute procedure public.handle_updated_at();
  end if;
end $$;

-- Enable RLS
alter table public.professores enable row level security;

-- Restore base policies if they don't exist
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Perfil dos professores é público' and tablename = 'professores') then
    create policy "Perfil dos professores é público" on public.professores
    for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Professor edita seu perfil' and tablename = 'professores') then
    create policy "Professor edita seu perfil" on public.professores
    for update using (auth.uid() = id);
  end if;
end $$;
