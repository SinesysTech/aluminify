/**
 * Script temporário para aplicar políticas RLS na tabela alunos_cursos
 * Execute com: node scripts/apply-rls-policies.js
 * 
 * NOTA: Este script requer SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente
 * ou você pode executar o SQL diretamente no dashboard do Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado nas variáveis de ambiente');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado nas variáveis de ambiente');
  console.log('\n💡 Alternativa: Execute o SQL diretamente no dashboard do Supabase:');
  console.log('   1. Acesse https://supabase.com/dashboard');
  console.log('   2. Vá em SQL Editor');
  console.log('   3. Cole o conteúdo de supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sql = `
-- Enable RLS on alunos_cursos if not already enabled
ALTER TABLE public.alunos_cursos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own course associations" ON public.alunos_cursos;
DROP POLICY IF EXISTS "Authenticated users can insert course associations" ON public.alunos_cursos;
DROP POLICY IF EXISTS "Authenticated users can delete course associations" ON public.alunos_cursos;

-- Policy: Students can view their own course associations
CREATE POLICY "Students can view their own course associations"
    ON public.alunos_cursos FOR SELECT
    USING (auth.uid() = aluno_id);

-- Policy: Allow authenticated users to insert course associations (for admin/professor use)
CREATE POLICY "Authenticated users can insert course associations"
    ON public.alunos_cursos FOR INSERT
    WITH CHECK (true);

-- Policy: Allow deletion (typically by admins/professors)
CREATE POLICY "Authenticated users can delete course associations"
    ON public.alunos_cursos FOR DELETE
    USING (true);
`;

async function applyMigration() {
  console.log('🔄 Aplicando políticas RLS na tabela alunos_cursos...\n');

  try {
    // O Supabase JS client não suporta execução direta de SQL múltiplo
    // Vamos executar cada comando separadamente
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.includes('ALTER TABLE') || command.includes('DROP POLICY') || command.includes('CREATE POLICY')) {
        console.log(`Executando: ${command.substring(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          // Tentar método alternativo usando query direta
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0); // Apenas para testar conexão
          
          console.error('❌ Erro ao executar SQL:', error.message);
          console.log('\n💡 Por favor, execute o SQL manualmente no dashboard do Supabase:');
          console.log('   Arquivo: supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql');
          process.exit(1);
        }
      }
    }

    console.log('\n✅ Políticas RLS aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Por favor, execute o SQL manualmente no dashboard do Supabase:');
    console.log('   Arquivo: supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql');
    process.exit(1);
  }
}

// O Supabase JS client não permite executar SQL arbitrário por segurança
// A melhor opção é usar o dashboard ou psql
console.log('⚠️  O Supabase JS client não permite executar SQL arbitrário.');
console.log('💡 Por favor, execute o SQL manualmente:\n');
console.log('   1. Acesse: https://supabase.com/dashboard');
console.log('   2. Selecione seu projeto');
console.log('   3. Vá em SQL Editor');
console.log('   4. Cole o conteúdo de: supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql');
console.log('   5. Clique em "Run"\n');







