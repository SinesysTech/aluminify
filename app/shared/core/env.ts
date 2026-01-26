import { z } from "zod";

const envSchema = z.object({
  // Core
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Supabase
  SUPABASE_URL: z.string().url(),

  // Keys - pelo menos um par de chaves deve existir (Client e Server)
  // Server-side keys (Service Role)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),

  // Client-side keys (Anon/Public)
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

// Validação refinada para garantir que temos chaves suficientes
const refinedEnv = envSchema.superRefine((data, ctx) => {
  const hasServerKey = !!(
    data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_SECRET_KEY
  );
  const hasClientKey = !!(
    data.SUPABASE_ANON_KEY || data.SUPABASE_PUBLISHABLE_KEY
  );

  if (!hasServerKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "É necessário definir SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY",
      path: ["SUPABASE_SERVICE_ROLE_KEY"],
    });
  }

  if (!hasClientKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "É necessário definir SUPABASE_ANON_KEY ou SUPABASE_PUBLISHABLE_KEY",
      path: ["SUPABASE_ANON_KEY"],
    });
  }
});

// Process env validation
const _env = refinedEnv.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    _env.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
