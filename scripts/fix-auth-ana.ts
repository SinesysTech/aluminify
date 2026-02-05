import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env
const envPath = path.resolve(process.cwd(), ".env.local");
const envPathFallback = path.resolve(__dirname, "..", ".env.local");

console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log(`Failed to load from cwd, trying fallback: ${envPathFallback}`);
  dotenv.config({ path: envPathFallback });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Searching for user 'Ana Carolina' or 'Moura'...");

  // Search in public.usuarios first
  const { data: users, error } = await supabase
    .from("usuarios")
    .select("*")
    .or("nome_completo.ilike.%Ana Carolina%,nome_completo.ilike.%Moura%");

  if (error) {
    console.error("Error searching usuarios:", error);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No user found in public.usuarios");
    return;
  }

  console.log(`Found ${users.length} users:`);
  for (const user of users) {
    console.log(
      `- [${user.id}] ${user.nome_completo} (${user.email}) - Role: ${user.papel_id || "N/A"}`,
    );

    // Check Auth User
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.admin.getUserById(user.id);

    if (authError) {
      console.error(`  Auth Error for ${user.id}:`, authError.message);
    } else {
      console.log(
        `  Auth Status: ${authUser?.aud} | Confirmed: ${authUser?.email_confirmed_at ? "Yes" : "No"} | Last Sign In: ${authUser?.last_sign_in_at}`,
      );

      // Reset Password if requested
      if (process.argv.includes("--reset")) {
        const newPassword = "JANA@2026!";
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            password: newPassword,
          },
        );
        if (updateError) {
          console.error(`  Failed to reset password: ${updateError.message}`);
        } else {
          console.log(`  ✅ Password reset to '${newPassword}'`);
        }
      }
    }
  }

  if (!process.argv.includes("--reset")) {
    console.log("\nTo reset password for these users, run with --reset flag");
  }
}

main();
