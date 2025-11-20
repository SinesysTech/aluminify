Perfeito. Como você está começando do zero, removi toda a parte de limpeza (`DROP`) para o código ficar mais limpo e direto.

Aqui estão os blocos separados por **ordem de execução**. Vá copiando e colando um bloco por vez no SQL Editor do Supabase e clicando em "Run".

### Passo 1: Configurações Iniciais (Enums e Funções)

*Aqui criamos os tipos personalizados e a função que atualiza a data de edição automaticamente.*

```sql
-- 1. Criando Tipos Personalizados (Enums)
CREATE TYPE enum_modalidade AS ENUM ('EAD', 'LIVE');
CREATE TYPE enum_tipo_curso AS ENUM ('Superextensivo', 'Extensivo', 'Intensivo', 'Superintensivo', 'Revisão');
CREATE TYPE enum_tipo_material AS ENUM ('Apostila', 'Lista de Exercícios', 'Planejamento', 'Resumo', 'Gabarito', 'Outros');

-- 2. Função Genérica para atualizar o 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Passo 2: Criação das Tabelas

*Estrutura do banco de dados. Note que a ordem importa por causa das dependências (chaves estrangeiras).*

```sql
-- 1. Tabelas Auxiliares (Sem dependências)
CREATE TABLE public.segmentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.disciplinas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Cursos (Depende de Segmentos e Disciplinas)
CREATE TABLE public.cursos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segmento_id UUID REFERENCES public.segmentos(id) ON DELETE SET NULL,
    disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    modalidade enum_modalidade NOT NULL,
    tipo enum_tipo_curso NOT NULL,
    descricao TEXT,
    ano_vigencia INTEGER NOT NULL,
    data_inicio DATE,
    data_termino DATE,
    meses_acesso INTEGER,
    planejamento_url TEXT,
    imagem_capa_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Alunos (Depende do Auth do Supabase)
CREATE TABLE public.alunos (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE,
    telefone TEXT,
    data_nascimento DATE,
    endereco TEXT,
    cep TEXT,
    numero_matricula TEXT UNIQUE,
    instagram TEXT,
    twitter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabelas de Relação (Dependem de Alunos e Cursos)
CREATE TABLE public.matriculas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    data_matricula TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_inicio_acesso DATE DEFAULT CURRENT_DATE,
    data_fim_acesso DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.materiais_curso (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao_opcional TEXT,
    tipo enum_tipo_material DEFAULT 'Apostila',
    arquivo_url TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Passo 3: Automação (Triggers)

*Aqui ativamos a atualização de datas e, principalmente, a criação automática do aluno quando ele faz login/cadastro.*

```sql
-- 1. Triggers para manter o 'updated_at' sempre atual
CREATE TRIGGER on_update_segmentos BEFORE UPDATE ON public.segmentos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_update_disciplinas BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_update_cursos BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_update_alunos BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_update_matriculas BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_update_materiais BEFORE UPDATE ON public.materiais_curso FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Função e Trigger para Auto-Cadastro (Auth -> Public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.alunos (id, email, nome_completo)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name' -- Pega o nome se o login social enviar
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Liga a trigger ao evento de criação de usuário no Supabase Auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Passo 4: Segurança (RLS - Row Level Security)

*Define quem pode ver o quê. Isso tranca o banco para acessos indevidos.*

```sql
-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_curso ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Leitura Pública (Catálogo)
CREATE POLICY "Catálogo de Segmentos é Público" ON public.segmentos FOR SELECT USING (true);
CREATE POLICY "Catálogo de Disciplinas é Público" ON public.disciplinas FOR SELECT USING (true);
CREATE POLICY "Catálogo de Cursos é Público" ON public.cursos FOR SELECT USING (true);

-- 3. Políticas de Dados do Usuário (Privacidade)
CREATE POLICY "Usuários veem o próprio perfil" ON public.alunos 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários atualizam o próprio perfil" ON public.alunos 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Aluno vê suas próprias matrículas" ON public.matriculas 
    FOR SELECT USING (auth.uid() = aluno_id);

-- 4. Política de Conteúdo (Acesso condicional à compra)
-- Só libera o material se existir uma matrícula ativa para aquele curso e aluno
CREATE POLICY "Acesso a materiais apenas para matriculados" ON public.materiais_curso 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            WHERE m.curso_id = materiais_curso.curso_id 
            AND m.aluno_id = auth.uid()
            AND m.ativo = true
        )
    );
```

### Passo 5: Dados Iniciais (Seed) - Opcional

*Rode apenas se quiser popular o banco com categorias básicas para começar.*

```sql
INSERT INTO public.segmentos (nome, slug) VALUES 
('Pré-vestibular', 'pre-vestibular'),
('Concursos', 'concursos');

INSERT INTO public.disciplinas (nome) VALUES 
('Física'), ('Matemática'), ('História'), ('Geografia'), ('Química');
```

Perfeito. Focaremos 100% na estrutura do banco de dados (Backend).

Entendido que não precisamos de migrações "seguras" (podemos alterar estruturas livremente pois está vazio) e que a diferenciação entre Aluno e Professor será feita via metadados no momento do cadastro (`auth.users`), gerenciado pela trigger.

Aqui está a estrutura atualizada do banco de dados. Antes dos códigos, veja como a entidade **Professor** entra no diagrama:

Abaixo estão os blocos SQL para você executar sequencialmente.

### Parte 1: Criar a Tabela de Professores

Esta tabela armazenará os dados públicos dos docentes.

```sql
-- 1. Criação da tabela Professores
CREATE TABLE public.professores (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE,
    telefone TEXT,
    
    -- Campos específicos para a vitrine do curso
    biografia TEXT, 
    foto_url TEXT,
    especialidade TEXT, -- Ex: 'Doutor em História'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger para manter updated_at atualizado
CREATE TRIGGER on_update_professores 
    BEFORE UPDATE ON public.professores 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

### Parte 2: Alterar Tabelas existentes (`created_by`)

Aqui adicionamos a coluna de auditoria/autoria nas tabelas de conteúdo. Usamos `ON DELETE SET NULL` para que, se um professor for deletado, os cursos que ele criou **não** sejam apagados (apenas ficam sem dono).

```sql
-- Adicionar coluna created_by em Segmentos
ALTER TABLE public.segmentos 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna created_by em Disciplinas
ALTER TABLE public.disciplinas 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna created_by em Cursos
ALTER TABLE public.cursos 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna created_by em Materiais
ALTER TABLE public.materiais_curso 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### Parte 3: Automação de Autoria (Auto-fill `created_by`)

Para você não precisar enviar manualmente o ID do professor em todo `INSERT` no backend, esta trigger pega o ID do usuário logado automaticamente.

```sql
-- 1. Função que preenche o created_by
CREATE OR REPLACE FUNCTION public.handle_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não foi enviado manualmente, usa o ID do usuário autenticado
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicando a trigger nas tabelas
CREATE TRIGGER set_created_by_segmentos BEFORE INSERT ON public.segmentos FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();
CREATE TRIGGER set_created_by_disciplinas BEFORE INSERT ON public.disciplinas FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();
CREATE TRIGGER set_created_by_cursos BEFORE INSERT ON public.cursos FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();
CREATE TRIGGER set_created_by_materiais BEFORE INSERT ON public.materiais_curso FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();
```

### Parte 4: Atualizar a Lógica de Cadastro (Aluno vs Professor)

Substituímos a função antiga. Agora ela verifica o metadado `role` dentro do objeto `auth.users` para decidir em qual tabela inserir.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Tenta ler o papel do usuário (ex: { "role": "professor" })
    user_role := new.raw_user_meta_data->>'role';

    IF user_role = 'professor' THEN
        INSERT INTO public.professores (id, email, nome_completo)
        VALUES (
            new.id, 
            new.email, 
            COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Professor')
        );
    ELSE
        -- Default: Se não vier nada ou vier 'aluno', cria como Aluno
        INSERT INTO public.alunos (id, email, nome_completo)
        VALUES (
            new.id, 
            new.email, 
            COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Aluno')
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Parte 5: Atualizar Segurança (RLS)

Agora precisamos permitir que os professores **escrevam** no banco de dados.

```sql
-- 1. Permissões na tabela PROFESSORES
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Público pode ver perfil dos professores
CREATE POLICY "Perfil dos professores é público" ON public.professores FOR SELECT USING (true);

-- Apenas o próprio professor edita seu perfil
CREATE POLICY "Professor edita seu perfil" ON public.professores FOR UPDATE USING (auth.uid() = id);


-- 2. Permissões de ESCRITA para Professores (Cursos, Materiais, etc)
-- Lógica: Permitir INSERT/UPDATE se o ID do usuário estiver na tabela 'professores'

-- Cursos
CREATE POLICY "Professores criam cursos" ON public.cursos 
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));

CREATE POLICY "Professores editam seus cursos" ON public.cursos 
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Professores deletam seus cursos" ON public.cursos 
    FOR DELETE USING (created_by = auth.uid());

-- Materiais
CREATE POLICY "Professores gerenciam materiais" ON public.materiais_curso 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));

-- Segmentos e Disciplinas (Geralmente professores podem criar, ou apenas admins)
-- Aqui estou liberando para professores criarem também
CREATE POLICY "Professores criam disciplinas" ON public.disciplinas 
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));

CREATE POLICY "Professores criam segmentos" ON public.segmentos 
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.professores WHERE id = auth.uid()));
```