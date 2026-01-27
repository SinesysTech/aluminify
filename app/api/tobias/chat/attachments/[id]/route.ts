import { NextRequest, NextResponse } from 'next/server';
import { cleanupChatAttachments, loadAttachmentMetadata } from '@/app/[tenant]/(modules)/agente/services/chat/attachments.service';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
  }

  const attachment = await loadAttachmentMetadata(id);

  if (!attachment) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  if (!attachment.token || attachment.token !== token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
  }

  if (attachment.expiresAt && attachment.expiresAt < Date.now()) {
    await cleanupChatAttachments([attachment]);
    return NextResponse.json({ error: 'Arquivo expirado' }, { status: 410 });
  }

  // Verificar se o arquivo existe
  try {
    await fs.access(attachment.path);
  } catch {
    console.error('[Chat Attachments] Arquivo não encontrado no caminho:', attachment.path);
    return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 });
  }

  const buffer = await fs.readFile(attachment.path);

  // Headers otimizados para permitir leitura direta pelo agente
  const headers: HeadersInit = {
    'Content-Type': attachment.mimeType || 'application/octet-stream',
    'Content-Length': buffer.length.toString(),
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'Access-Control-Allow-Origin': '*', // Permitir CORS para o agente acessar
  };

  const response = new NextResponse(buffer, { headers });

  // Remover arquivo após o download ser iniciado
  cleanupChatAttachments([attachment]).catch((error) => {
    console.warn('[Chat Attachments] Falha ao limpar arquivo após download', error);
  });

  return response;
}


