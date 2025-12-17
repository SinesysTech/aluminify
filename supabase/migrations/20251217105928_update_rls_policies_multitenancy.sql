-- Migration: Update RLS policies for multi-tenancy
-- Description: Refatora todas as RLS policies existentes para incluir filtro por empresa_id
-- Author: Auto-generated
-- Date: 2025-12-17

-- 1. Atualizar RLS policies de professores
drop policy if exists "Users can view their own professor data" on public.professores;
drop policy if exists "Usuários veem seu próprio registro de professor" on public.professores;
drop policy if exists "Professores podem criar seu próprio registro" on public.professores;

-- SELECT: Professores veem apenas professores da mesma empresa
create policy "Professores veem apenas professores da mesma empresa"
    on public.professores
    for select
    to authenticated
    using (
        -- Professor vê sua própria empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin vê todos
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- UPDATE: Professor pode atualizar apenas seus próprios dados
create policy "Professores podem atualizar seus próprios dados"
    on public.professores
    for update
    to authenticated
    using (
        id = (select auth.uid())
        and empresa_id = public.get_user_empresa_id()
    )
    with check (
        id = (select auth.uid())
        and empresa_id = public.get_user_empresa_id()
    );

-- INSERT: Apenas admins da empresa ou superadmin podem criar professores
create policy "Admins podem criar professores em sua empresa"
    on public.professores
    for insert
    to authenticated
    with check (
        -- Admin da empresa
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- 2. Atualizar RLS policies de cursos
-- SELECT: Público pode ver cursos (ou filtrar por empresa se necessário)
-- Manter política pública existente ou criar nova conforme necessário
drop policy if exists "Cursos são públicos para leitura" on public.cursos;

create policy "Cursos são públicos para leitura"
    on public.cursos
    for select
    to authenticated, anon
    using (true);

-- INSERT: Apenas admins da empresa podem criar cursos
drop policy if exists "Professores podem criar cursos" on public.cursos;

create policy "Admins podem criar cursos em sua empresa"
    on public.cursos
    for insert
    to authenticated
    with check (
        -- Admin da empresa
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- UPDATE/DELETE: Criador do curso ou admin da empresa
drop policy if exists "Professores podem atualizar seus próprios cursos" on public.cursos;

create policy "Criador ou admin pode atualizar cursos"
    on public.cursos
    for update
    to authenticated
    using (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    )
    with check (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

create policy "Criador ou admin pode deletar cursos"
    on public.cursos
    for delete
    to authenticated
    using (
        (
            created_by = (select auth.uid())
            and empresa_id = public.get_user_empresa_id()
        )
        or
        (
            empresa_id = public.get_user_empresa_id()
            and public.is_empresa_admin()
        )
        or
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- 3. Atualizar RLS policies de materiais_curso, frentes, modulos, aulas
-- Padrão: Alunos matriculados OU professores da mesma empresa

-- Materiais curso
drop policy if exists "Materiais são públicos para leitura" on public.materiais_curso;

create policy "Materiais visíveis para alunos matriculados e professores da empresa"
    on public.materiais_curso
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        (
            empresa_id = public.get_user_empresa_id()
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- Frentes
drop policy if exists "Frentes são públicas para leitura" on public.frentes;
drop policy if exists "Professores podem criar frentes" on public.frentes;
drop policy if exists "Professores podem atualizar frentes" on public.frentes;
drop policy if exists "Professores podem deletar frentes" on public.frentes;

create policy "Frentes visíveis para alunos matriculados e professores da empresa"
    on public.frentes
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem criar frentes"
    on public.frentes
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem atualizar frentes"
    on public.frentes
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem deletar frentes"
    on public.frentes
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Módulos
drop policy if exists "Modulos são públicos para leitura" on public.modulos;
drop policy if exists "Professores podem criar modulos" on public.modulos;
drop policy if exists "Professores podem atualizar modulos" on public.modulos;
drop policy if exists "Professores podem deletar modulos" on public.modulos;

create policy "Modulos visíveis para alunos matriculados e professores da empresa"
    on public.modulos
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem criar modulos"
    on public.modulos
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem atualizar modulos"
    on public.modulos
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem deletar modulos"
    on public.modulos
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Aulas
drop policy if exists "Aulas são públicas para leitura" on public.aulas;
drop policy if exists "Professores podem criar aulas" on public.aulas;
drop policy if exists "Professores podem atualizar aulas" on public.aulas;
drop policy if exists "Professores podem deletar aulas" on public.aulas;

create policy "Aulas visíveis para alunos matriculados e professores da empresa"
    on public.aulas
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem criar aulas"
    on public.aulas
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem atualizar aulas"
    on public.aulas
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem deletar aulas"
    on public.aulas
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Flashcards
drop policy if exists "Flashcards são públicos para leitura" on public.flashcards;
drop policy if exists "Professores podem criar flashcards" on public.flashcards;
drop policy if exists "Professores podem atualizar flashcards" on public.flashcards;
drop policy if exists "Professores podem deletar flashcards" on public.flashcards;

create policy "Flashcards visíveis para alunos matriculados e professores da empresa"
    on public.flashcards
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem criar flashcards"
    on public.flashcards
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem atualizar flashcards"
    on public.flashcards
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem deletar flashcards"
    on public.flashcards
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Atividades
drop policy if exists "Atividades são públicas para leitura" on public.atividades;
drop policy if exists "Professores podem criar atividades" on public.atividades;
drop policy if exists "Professores podem atualizar atividades" on public.atividades;
drop policy if exists "Professores podem deletar atividades" on public.atividades;

create policy "Atividades visíveis para alunos matriculados e professores da empresa"
    on public.atividades
    for select
    to authenticated
    using (
        -- Aluno matriculado em curso da empresa
        public.aluno_matriculado_empresa(empresa_id)
        or
        -- Professor da empresa
        empresa_id = public.get_user_empresa_id()
        or
        -- Superadmin
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem criar atividades"
    on public.atividades
    for insert
    to authenticated
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem atualizar atividades"
    on public.atividades
    for update
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    )
    with check (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

create policy "Professores da empresa podem deletar atividades"
    on public.atividades
    for delete
    to authenticated
    using (
        empresa_id = public.get_user_empresa_id()
        or
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 4. Atualizar RLS policies de alunos
-- Manter policies individuais e adicionar policy para admins

create policy "Admins podem ver alunos de sua empresa"
    on public.alunos
    for select
    to authenticated
    using (
        -- Aluno vê seus próprios dados (policy existente já cobre)
        id = (select auth.uid())
        or
        -- Admin da empresa pode ver alunos matriculados em cursos da empresa
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.alunos_cursos
                inner join public.cursos on cursos.id = alunos_cursos.curso_id
                where alunos_cursos.aluno_id = alunos.id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

-- 5. Atualizar RLS policies de alunos_cursos (matrículas)
drop policy if exists "Alunos podem ver suas matrículas" on public.alunos_cursos;

create policy "Alunos veem suas matrículas e admins veem matrículas de sua empresa"
    on public.alunos_cursos
    for select
    to authenticated
    using (
        -- Aluno vê suas próprias matrículas
        aluno_id = (select auth.uid())
        or
        -- Admin da empresa vê matrículas em cursos da empresa
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

create policy "Apenas admins podem criar matrículas"
    on public.alunos_cursos
    for insert
    to authenticated
    with check (
        -- Admin da empresa do curso
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

create policy "Apenas admins podem deletar matrículas"
    on public.alunos_cursos
    for delete
    to authenticated
    using (
        -- Admin da empresa do curso
        (
            public.is_empresa_admin()
            and exists (
                select 1
                from public.cursos
                where cursos.id = alunos_cursos.curso_id
                and cursos.empresa_id = public.get_user_empresa_id()
            )
        )
        or
        -- Superadmin
        (
            exists (
                select 1
                from auth.users
                where id = (select auth.uid())
                and raw_user_meta_data->>'role' = 'superadmin'
            )
        )
    );

