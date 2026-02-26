/**
 * AI Agents API Route
 *
 * GET /api/ai-agents/[empresaId] - Get agent(s) for a tenant
 * Query params:
 *   - slug: Get specific agent by slug
 *   - config: If 'chat', returns chat config; if 'list', returns all agents
 */

import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { AIAgentsService } from "@/app/shared/services/ai-agents/ai-agents.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai-agents/[empresaId]
 *
 * Fetch AI agents for a specific empresa.
 * Supports query params:
 *   - slug: fetch a specific agent by slug
 *   - config: 'list' | 'chat' to get different views
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") || undefined;
    const configType = searchParams.get("config");

    const supabase = getDatabaseClient();
    const service = new AIAgentsService(supabase);

    // List all active agents
    if (configType === "list") {
      const agents = await service.getActiveForEmpresa(empresaId);
      return NextResponse.json({ success: true, data: agents });
    }

    // Get chat configuration
    if (configType === "chat") {
      const config = await service.getChatConfig(empresaId, slug);

      if (!config) {
        return NextResponse.json(
          {
            success: false,
            error: "Nenhum agente de IA encontrado",
            details: slug
              ? `Agente com slug "${slug}" não encontrado para esta organização`
              : "Nenhum agente padrão configurado para esta organização",
            suggestion:
              "Configure um agente de IA nas configurações da instituição ou entre em contato com o suporte",
            empresaId,
            slug,
          },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: config });
    }

    // Default: return all agents
    const agents = await service.getAllForEmpresa(empresaId);
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error("[AI Agents API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar agentes de IA",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
