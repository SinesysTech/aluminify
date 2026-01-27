import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import {
  DEFAULT_CONFIGS,
  type SystemConfig,
} from "@/app/superadmin/configuracoes/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// In-memory storage for configs (in production, this would be in a database table)
const configStore: Map<string, SystemConfig> = new Map();
let isInitialized = false;

function initializeConfigs() {
  if (isInitialized) return;

  DEFAULT_CONFIGS.forEach((config, index) => {
    configStore.set(config.key, {
      id: `config-${index}`,
      ...config,
      updatedAt: new Date().toISOString(),
    });
  });

  isInitialized = true;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Create admin client to verify user
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Verify user is superadmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Check if user is superadmin
    const { data: isSuperAdmin, error: roleError } =
      await supabaseAdmin.rpc("is_superadmin");

    if (roleError || !isSuperAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmins podem acessar." },
        { status: 403 },
      );
    }

    // Initialize configs if needed
    initializeConfigs();

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    // Get all configs
    let configs = Array.from(configStore.values());

    // Filter by category if provided
    if (category && category !== "all") {
      configs = configs.filter((c) => c.category === category);
    }

    // Group by category
    const groupedConfigs: Record<string, SystemConfig[]> = {};
    configs.forEach((config) => {
      if (!groupedConfigs[config.category]) {
        groupedConfigs[config.category] = [];
      }
      groupedConfigs[config.category].push(config);
    });

    return NextResponse.json({
      data: {
        configs,
        groupedConfigs,
      },
    });
  } catch (error) {
    console.error("Error in configuracoes API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Create admin client to verify user
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Verify user is superadmin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Check if user is superadmin
    const { data: isSuperAdmin, error: roleError } =
      await supabaseAdmin.rpc("is_superadmin");

    if (roleError || !isSuperAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmins podem acessar." },
        { status: 403 },
      );
    }

    // Initialize configs if needed
    initializeConfigs();

    // Get body
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Chave da configuração é obrigatória" },
        { status: 400 },
      );
    }

    // Get existing config
    const existingConfig = configStore.get(key);
    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuração não encontrada" },
        { status: 404 },
      );
    }

    // Validate type
    const expectedType = existingConfig.type;
    const valueType = typeof value;

    if (expectedType === "number" && valueType !== "number") {
      return NextResponse.json(
        { error: "Valor deve ser um número" },
        { status: 400 },
      );
    }

    if (expectedType === "boolean" && valueType !== "boolean") {
      return NextResponse.json(
        { error: "Valor deve ser verdadeiro ou falso" },
        { status: 400 },
      );
    }

    if (expectedType === "string" && valueType !== "string") {
      return NextResponse.json(
        { error: "Valor deve ser texto" },
        { status: 400 },
      );
    }

    // Update config
    const updatedConfig: SystemConfig = {
      ...existingConfig,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    configStore.set(key, updatedConfig);

    return NextResponse.json({
      data: updatedConfig,
      message: "Configuração atualizada com sucesso",
    });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
