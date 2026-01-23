/**
 * Script para importar alunos da Hotmart para o sistema Aluminify
 *
 * Uso: npx tsx scripts/import-hotmart-alunos.ts
 *
 * Requisitos:
 * - Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY configuradas
 * - Arquivo hotmart-alunos-import.json gerado pelo script Python
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Configuração
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7"; // Jana Rabelo
const ORIGEM_CADASTRO = "hotmart";
const DRY_RUN = process.argv.includes("--dry-run");

interface HotmartAluno {
  fullName: string | null;
  email: string;
  cpf: string | null;
  phone: string | null;
  zipCode: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  pais: string | null;
  address: string | null;
  numeroEndereco: string | null;
  complemento: string | null;
  hotmartId: string | null;
  instagram: string | null;
}

interface ImportResult {
  email: string;
  status: "created" | "exists" | "error";
  message?: string;
}

async function main() {
  // Validar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios"
    );
    console.log("Configure as variáveis no arquivo .env.local");
    process.exit(1);
  }

  // Criar cliente Supabase com service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Carregar dados do JSON
  const jsonPath = path.join(__dirname, "hotmart-alunos-import.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo não encontrado: ${jsonPath}`);
    console.log("Execute o script Python primeiro para gerar o arquivo JSON.");
    process.exit(1);
  }

  const alunos: HotmartAluno[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`${alunos.length} alunos para importar`);
  console.log(`Empresa: Jana Rabelo (${EMPRESA_ID})`);

  if (DRY_RUN) {
    console.log("\nMODO DRY-RUN: Nenhuma alteracao sera feita\n");
  }

  // Pré-carregar usuários auth existentes para evitar múltiplas chamadas
  console.log("Carregando usuarios auth existentes...");
  const authEmailsSet = new Set<string>();
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const { data: authPage } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (authPage?.users && authPage.users.length > 0) {
      for (const u of authPage.users) {
        if (u.email) authEmailsSet.add(u.email.toLowerCase());
      }
      page++;
      if (authPage.users.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  console.log(`  ${authEmailsSet.size} usuarios auth carregados`);

  const results: ImportResult[] = [];
  let created = 0;
  let exists = 0;
  let errors = 0;

  for (const aluno of alunos) {
    if (!aluno.email) {
      results.push({
        email: "N/A",
        status: "error",
        message: "Email não fornecido",
      });
      errors++;
      continue;
    }

    try {
      // Verificar se já existe por email
      const { data: existingAluno } = await supabase
        .from("alunos")
        .select("id, email")
        .eq("email", aluno.email.toLowerCase())
        .maybeSingle();

      if (existingAluno) {
        results.push({
          email: aluno.email,
          status: "exists",
          message: "Aluno já existe no sistema",
        });
        exists++;
        continue;
      }

      // Verificar se já existe no auth usando o Set pré-carregado
      if (authEmailsSet.has(aluno.email.toLowerCase())) {
        results.push({
          email: aluno.email,
          status: "exists",
          message: "Usuario ja existe no auth",
        });
        exists++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Criaria: ${aluno.email} (${aluno.fullName})`);
        results.push({
          email: aluno.email,
          status: "created",
          message: "Seria criado (dry-run)",
        });
        created++;
        continue;
      }

      // Gerar senha temporária (CPF ou aleatória)
      const temporaryPassword = aluno.cpf
        ? aluno.cpf.replace(/\D/g, "")
        : Math.random().toString(36).slice(-10) + "A1!";

      // Criar usuário no auth
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: aluno.email.toLowerCase(),
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            role: "aluno",
            full_name: aluno.fullName,
            must_change_password: true,
            empresa_id: EMPRESA_ID,
          },
        });

      if (authError || !authUser?.user) {
        throw new Error(authError?.message || "Erro ao criar usuário no auth");
      }

      // Aguardar trigger criar o registro base
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Atualizar dados do aluno
      const { error: updateError } = await supabase
        .from("alunos")
        .update({
          nome_completo: aluno.fullName,
          cpf: aluno.cpf?.replace(/\D/g, "") || null,
          telefone: aluno.phone,
          cep: aluno.zipCode,
          cidade: aluno.cidade,
          estado: aluno.estado,
          bairro: aluno.bairro,
          pais: aluno.pais || "Brasil",
          endereco: aluno.address,
          numero_endereco: aluno.numeroEndereco,
          complemento: aluno.complemento,
          hotmart_id: aluno.hotmartId,
          instagram: aluno.instagram,
          origem_cadastro: ORIGEM_CADASTRO,
          empresa_id: EMPRESA_ID,
          must_change_password: true,
          senha_temporaria: temporaryPassword,
        })
        .eq("id", authUser.user.id);

      if (updateError) {
        console.error(`  ⚠️ Erro ao atualizar ${aluno.email}: ${updateError.message}`);
      }

      results.push({
        email: aluno.email,
        status: "created",
        message: `Criado com sucesso (senha: ${temporaryPassword})`,
      });
      created++;
      console.log(`  ✅ ${aluno.email} (${aluno.fullName})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      results.push({
        email: aluno.email,
        status: "error",
        message,
      });
      errors++;
      console.error(`  ❌ ${aluno.email}: ${message}`);
    }
  }

  // Resumo
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMO DA IMPORTAÇÃO");
  console.log("=".repeat(50));
  console.log(`✅ Criados: ${created}`);
  console.log(`⏭️ Já existiam: ${exists}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📝 Total processado: ${alunos.length}`);

  // Salvar relatório
  const reportPath = path.join(__dirname, "import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  if (DRY_RUN) {
    console.log("\n💡 Execute sem --dry-run para aplicar as alterações");
  }
}

main().catch(console.error);
