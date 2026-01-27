import { NextRequest, NextResponse } from 'next/server';
import { cleanupChatAttachments, loadAttachmentMetadata } from '@/app/[tenant]/(modules)/agente/services/chat/attachments.service';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Mapeamento de extensões para Content-Type
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

function getContentTypeFromFilename(filename: string, fallback?: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || fallback || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await context.params;
  const token = request.nextUrl.searchParams.get('token');
  
  console.log('[Chat Attachments] Requisição recebida:', {
    id,
    filename,
    hasToken: !!token,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  if (!token) {
    console.error('[Chat Attachments] Token não fornecido na URL');
    return NextResponse.json(
      { error: 'Token é obrigatório. Adicione ?token=... na URL' },
      { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const attachment = await loadAttachmentMetadata(id);

  if (!attachment) {
    console.error('[Chat Attachments] Metadata não encontrada para ID:', id);
    return NextResponse.json(
      { error: 'Arquivo não encontrado' },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (!attachment.token || attachment.token !== token) {
    console.error('[Chat Attachments] Token inválido para ID:', id);
    console.error('[Chat Attachments] Token esperado:', attachment.token?.substring(0, 8), '...');
    console.error('[Chat Attachments] Token recebido:', token.substring(0, 8), '...');
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (attachment.expiresAt && attachment.expiresAt < Date.now()) {
    console.warn('[Chat Attachments] Arquivo expirado:', id);
    await cleanupChatAttachments([attachment]);
    return NextResponse.json(
      { error: 'Arquivo expirado' },
      { status: 410, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Verificar se o arquivo existe
  console.log('[Chat Attachments] Tentando ler arquivo do caminho:', attachment.path);
  console.log('[Chat Attachments] Tipo MIME:', attachment.mimeType);
  console.log('[Chat Attachments] Nome do arquivo:', attachment.name);
  
  try {
    await fs.access(attachment.path);
  } catch (error) {
    console.error('[Chat Attachments] Arquivo não encontrado no caminho:', attachment.path);
    console.error('[Chat Attachments] Erro:', error);
    return NextResponse.json(
      { error: 'Arquivo não encontrado no servidor' },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const buffer = await fs.readFile(attachment.path);
  
  console.log('[Chat Attachments] Arquivo lido com sucesso. Tamanho:', buffer.length, 'bytes');
  console.log('[Chat Attachments] Primeiros bytes (hex):', buffer.slice(0, 16).toString('hex'));

  // Detectar Content-Type baseado na extensão do arquivo na URL (para garantir que o agente reconheça o formato)
  // Usar o mimeType salvo como prioridade, mas validar com a extensão do filename na URL
  const contentTypeFromUrl = getContentTypeFromFilename(filename, attachment.mimeType);
  const contentType = attachment.mimeType || contentTypeFromUrl;
  
  console.log('[Chat Attachments] Content-Type detectado:', contentType);
  console.log('[Chat Attachments] Extensão do arquivo na URL:', path.extname(filename));

  // Headers otimizados para permitir leitura direta pelo agente
  // O formato do arquivo está incorporado na URL (extensão) e no Content-Type
  const headers: HeadersInit = {
    'Content-Type': contentType,
    'Content-Length': buffer.length.toString(),
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'Access-Control-Allow-Origin': '*', // Permitir CORS para o agente acessar
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const response = new NextResponse(buffer, { headers });
  
  console.log('[Chat Attachments] Resposta criada com headers:', Object.fromEntries(response.headers.entries()));

  // Remover arquivo após o download ser iniciado
  cleanupChatAttachments([attachment]).catch((error) => {
    console.warn('[Chat Attachments] Falha ao limpar arquivo após download', error);
  });

  return response;
}

// Handler para requisições OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


