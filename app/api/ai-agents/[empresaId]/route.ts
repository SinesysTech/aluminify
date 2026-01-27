/**
 * AI Agents API Route
 *
 * GET /api/ai-agents/[empresaId] - Get agent(s) for a tenant
 * Query params:
 *   - slug: Get specific agent by slug
 *   - config: If 'chat', returns chat config; if 'list', returns all agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { AIAgentsService } from '@/app/shared/services/ai-agents';

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { empresaId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug') || undefined;
    const configType = searchParams.get('config') || 'chat';

    const client = getDatabaseClient();
    const service = new AIAgentsService(client);

    if (configType === 'list') {
      // Return all active agents for sidebar/navigation
      const agents = await service.getActiveForEmpresa(empresaId);
      return NextResponse.json({
        success: true,
        agents,
      });
    }

    // Default: return chat config
    const config = await service.getChatConfig(empresaId, slug);

    if (!config) {
      return NextResponse.json(
        { error: 'Nenhum agente encontrado para esta empresa' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: config,
    });
  } catch (error) {
    console.error('Error fetching AI agent:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração do agente' },
      { status: 500 }
    );
  }
}
