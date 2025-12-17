-- Seed data para desenvolvimento
-- Este arquivo popula o banco com dados de teste para desenvolvimento

-- Inserir empresas de exemplo
insert into public.empresas (id, nome, slug, cnpj, email_contato, telefone, plano, ativo) values
  ('00000000-0000-0000-0000-000000000001', 'Cursinho Alpha', 'cursinho-alpha', '12345678000190', 'contato@alpha.com', '(11) 99999-9999', 'profissional', true),
  ('00000000-0000-0000-0000-000000000002', 'Cursinho Beta', 'cursinho-beta', '12345678000191', 'contato@beta.com', '(11) 88888-8888', 'basico', true),
  ('00000000-0000-0000-0000-000000000003', 'Cursinho Gamma', 'cursinho-gamma', '12345678000192', 'contato@gamma.com', '(11) 77777-7777', 'enterprise', true);

-- Nota: Para criar professores e alunos, você precisará criar usuários no auth.users primeiro
-- e então os registros serão criados automaticamente pela trigger handle_new_user()
-- com os metadata apropriados (empresa_id, is_admin, etc)

-- Exemplo de como criar um admin para a empresa Alpha (execute via Supabase Dashboard ou API):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   '11111111-1111-1111-1111-111111111111',
--   'admin@alpha.com',
--   crypt('senha123', gen_salt('bf')),
--   now(),
--   '{"role": "professor", "full_name": "Admin Alpha", "empresa_id": "00000000-0000-0000-0000-000000000001", "is_admin": true}'::jsonb
-- );

-- Depois, inserir em empresa_admins como owner:
-- INSERT INTO public.empresa_admins (empresa_id, user_id, is_owner, permissoes)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   '11111111-1111-1111-1111-111111111111',
--   true,
--   '{}'::jsonb
-- );

