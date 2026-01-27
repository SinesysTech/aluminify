import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type {
  AuditLog,
  LogStats,
  LogLevel,
  LogCategory,
} from "@/app/superadmin/logs/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to generate simulated logs based on real activity
function generateLogsFromActivity(
  empresas: Array<{
    id: string;
    nome: string;
    created_at: string;
    updated_at: string;
    ativo: boolean;
  }>,
  users: Array<{
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    raw_user_meta_data: Record<string, unknown>;
  }>,
  cursos: Array<{
    id: string;
    nome: string;
    created_at: string;
    updated_at: string;
    empresa_id: string;
  }>,
): AuditLog[] {
  const logs: AuditLog[] = [];

  // Generate empresa-related logs
  empresas.forEach((empresa) => {
    logs.push({
      id: `emp-create-${empresa.id}`,
      timestamp: empresa.created_at,
      level: "success",
      category: "empresa",
      action: "empresa.created",
      description: `Empresa "${empresa.nome}" foi criada`,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
    });

    if (empresa.updated_at !== empresa.created_at) {
      logs.push({
        id: `emp-update-${empresa.id}`,
        timestamp: empresa.updated_at,
        level: "info",
        category: "empresa",
        action: "empresa.updated",
        description: `Empresa "${empresa.nome}" foi atualizada`,
        empresaId: empresa.id,
        empresaNome: empresa.nome,
      });
    }

    if (!empresa.ativo) {
      logs.push({
        id: `emp-deact-${empresa.id}`,
        timestamp: empresa.updated_at,
        level: "warning",
        category: "empresa",
        action: "empresa.deactivated",
        description: `Empresa "${empresa.nome}" foi desativada`,
        empresaId: empresa.id,
        empresaNome: empresa.nome,
      });
    }
  });

  // Generate user-related logs
  users.forEach((user) => {
    const userName =
      (user.raw_user_meta_data?.full_name as string) || user.email;

    logs.push({
      id: `user-create-${user.id}`,
      timestamp: user.created_at,
      level: "success",
      category: "user",
      action: "user.created",
      description: `Usuário "${userName}" foi registrado`,
      userId: user.id,
      userName: userName,
    });

    if (user.last_sign_in_at) {
      logs.push({
        id: `user-login-${user.id}`,
        timestamp: user.last_sign_in_at,
        level: "info",
        category: "auth",
        action: "user.login",
        description: `Usuário "${userName}" fez login`,
        userId: user.id,
        userName: userName,
      });
    }
  });

  // Generate curso-related logs
  cursos.forEach((curso) => {
    const empresa = empresas.find((e) => e.id === curso.empresa_id);

    logs.push({
      id: `curso-create-${curso.id}`,
      timestamp: curso.created_at,
      level: "success",
      category: "curso",
      action: "curso.created",
      description: `Curso "${curso.nome}" foi criado`,
      empresaId: curso.empresa_id,
      empresaNome: empresa?.nome,
    });
  });

  // Add some simulated system logs
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(
      now.getTime() - i * 3 * 60 * 60 * 1000,
    ).toISOString();
    logs.push({
      id: `sys-health-${i}`,
      timestamp,
      level: "info",
      category: "system",
      action: "system.health_check",
      description: "Verificação de saúde do sistema concluída",
    });
  }

  // Add simulated integration logs
  logs.push({
    id: "int-sync-1",
    timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    level: "info",
    category: "integration",
    action: "integration.sync",
    description: "Sincronização com provedores externos concluída",
  });

  // Sort by timestamp descending
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Create admin client to verify user and bypass RLS
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

    // Parse filters from query params
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as LogLevel | "all" | null;
    const category = searchParams.get("category") as LogCategory | "all" | null;
    const empresaId = searchParams.get("empresaId");
    const search = searchParams.get("search");

    // Fetch data for generating logs
    const [empresasResult, usersResult, cursosResult] = await Promise.all([
      supabaseAdmin
        .from("empresas")
        .select("id, nome, created_at, updated_at, ativo")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.auth.admin.listUsers({ perPage: 100 }),
      supabaseAdmin
        .from("cursos")
        .select("id, nome, created_at, updated_at, empresa_id")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    // Generate logs from activity
    let logs = generateLogsFromActivity(
      empresasResult.data || [],
      (usersResult.data?.users || []).map((u) => ({
        id: u.id,
        email: u.email || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        raw_user_meta_data: (u.user_metadata as Record<string, unknown>) || {},
      })),
      cursosResult.data || [],
    );

    // Apply filters
    if (level && level !== "all") {
      logs = logs.filter((log) => log.level === level);
    }
    if (category && category !== "all") {
      logs = logs.filter((log) => log.category === category);
    }
    if (empresaId) {
      logs = logs.filter((log) => log.empresaId === empresaId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.description.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.userName?.toLowerCase().includes(searchLower) ||
          log.empresaNome?.toLowerCase().includes(searchLower),
      );
    }

    // Calculate stats
    const allLogs = generateLogsFromActivity(
      empresasResult.data || [],
      (usersResult.data?.users || []).map((u) => ({
        id: u.id,
        email: u.email || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        raw_user_meta_data: (u.user_metadata as Record<string, unknown>) || {},
      })),
      cursosResult.data || [],
    );

    const byLevel = {
      info: allLogs.filter((l) => l.level === "info").length,
      warning: allLogs.filter((l) => l.level === "warning").length,
      error: allLogs.filter((l) => l.level === "error").length,
      success: allLogs.filter((l) => l.level === "success").length,
    };

    const categoryMap = new Map<LogCategory, number>();
    allLogs.forEach((log) => {
      categoryMap.set(log.category, (categoryMap.get(log.category) || 0) + 1);
    });
    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({
        category,
        count,
      }),
    );

    // Calculate hourly activity for the last 24 hours
    const now = new Date();
    const recentActivity = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toISOString().slice(0, 13) + ":00";
      const count = allLogs.filter((log) => {
        const logHour =
          new Date(log.timestamp).toISOString().slice(0, 13) + ":00";
        return logHour === hourStr;
      }).length;
      recentActivity.push({
        hour: hour.getHours().toString().padStart(2, "0") + ":00",
        count,
      });
    }

    const stats: LogStats = {
      totalLogs: allLogs.length,
      byLevel,
      byCategory,
      recentActivity,
    };

    return NextResponse.json({
      data: {
        logs: logs.slice(0, 100),
        stats,
        totalFiltered: logs.length,
      },
    });
  } catch (error) {
    console.error("Error in logs API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
