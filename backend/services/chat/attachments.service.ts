import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { ChatAttachment } from './chat.types';
import { ChatValidationError } from './errors';

// Determinar o diretório para uploads
// Em ambientes serverless (Vercel/Lambda), usar /tmp diretamente (sem subdiretórios)
// Em Windows, usar tmp/chat-uploads local; caso contrário, usar /tmp/chat-uploads
function getUploadDir(): string {
  if (process.env.CHAT_UPLOAD_DIR) {
    return process.env.CHAT_UPLOAD_DIR;
  }
  
  // Em ambientes serverless, usar /tmp diretamente (sem criar subdiretórios)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV;
  if (isServerless) {
    return '/tmp';
  }
  
  // Em Windows, usar tmp/chat-uploads local
  if (process.platform === 'win32') {
    return path.join(process.cwd(), 'tmp', 'chat-uploads');
  }
  
  // Default: /tmp/chat-uploads
  return '/tmp/chat-uploads';
}

const UPLOAD_DIR = getUploadDir();
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ATTACHMENT_TTL_MS = 10 * 60 * 1000; // 10 minutos
const METADATA_FILENAME = 'meta.json';

async function ensureUploadDir() {
  try {
    // Tentar criar o diretório com recursive
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Em serverless, se UPLOAD_DIR for /tmp, não precisa criar (já existe)
    if (UPLOAD_DIR === '/tmp') {
      // Verificar se /tmp existe e é acessível
      try {
        await fs.access('/tmp');
        return; // /tmp existe, tudo ok
      } catch {
        throw new Error(`Cannot access /tmp directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    // Para outros casos, relançar o erro
    throw error;
  }
}

function assertAllowedMimeType(type: string | undefined): asserts type {
  if (!type || !ALLOWED_MIME_TYPES.includes(type)) {
    throw new ChatValidationError(
      'Tipo de arquivo não suportado. Permitidos: imagens (png, jpg, webp, gif) e PDF.',
    );
  }
}

function assertFileSize(size: number) {
  if (size === 0) {
    throw new ChatValidationError('Arquivo vazio não pode ser enviado.');
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    throw new ChatValidationError(`Arquivo excede o limite de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }
}

function getAttachmentDir(id: string) {
  // Em serverless (/tmp), não criar subdiretórios, usar o diretório raiz
  if (UPLOAD_DIR === '/tmp') {
    return UPLOAD_DIR;
  }
  return path.join(UPLOAD_DIR, id);
}

function getFilePath(id: string, fileName: string) {
  // Em serverless (/tmp), salvar arquivo diretamente com nome único
  if (UPLOAD_DIR === '/tmp') {
    return path.join(UPLOAD_DIR, `${id}-${fileName}`);
  }
  return path.join(getAttachmentDir(id), fileName);
}

function getMetaPath(id: string) {
  // Em serverless (/tmp), salvar metadata com nome único
  if (UPLOAD_DIR === '/tmp') {
    return path.join(UPLOAD_DIR, `${id}-meta.json`);
  }
  return path.join(getAttachmentDir(id), METADATA_FILENAME);
}

export async function cleanupExpiredAttachments(): Promise<void> {
  await ensureUploadDir();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(UPLOAD_DIR);
  } catch {
    return;
  }

  // Em serverless (/tmp), arquivos estão diretamente no diretório, não em subdiretórios
  if (UPLOAD_DIR === '/tmp') {
    // Processar apenas arquivos de metadata
    const metaFiles = entries.filter((entry) => entry.endsWith('-meta.json'));
    await Promise.all(metaFiles.map(async (metaFile) => {
      try {
        const id = metaFile.replace('-meta.json', '');
        const meta = await loadAttachmentMetadata(id);
        const expiresAt = meta?.expiresAt ?? 0;
        const expired = !meta || expiresAt < Date.now();
        if (expired && meta) {
          // Remover arquivo e metadata
          await fs.rm(meta.path, { force: true }).catch(() => undefined);
          await fs.rm(getMetaPath(id), { force: true }).catch(() => undefined);
        }
      } catch {
        // Ignorar erros na limpeza
      }
    }));
    return;
  }

  // Para ambientes não-serverless, processar subdiretórios
  await Promise.all(entries.map(async (entry) => {
    const dir = path.join(UPLOAD_DIR, entry);
    try {
      const stat = await fs.stat(dir);
      if (!stat.isDirectory()) {
        return;
      }

      const meta = await loadAttachmentMetadata(entry);
      const expiresAt = meta?.expiresAt ?? 0;
      const expired = !meta || expiresAt < Date.now();
      if (expired) {
        await fs.rm(dir, { recursive: true, force: true });
      }
    } catch {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }));
}

export async function saveChatAttachments(files: File[]): Promise<ChatAttachment[]> {
  if (!files.length) {
    return [];
  }

  if (files.length > 1) {
    throw new ChatValidationError('Envie apenas um arquivo por mensagem.');
  }

  await ensureUploadDir();
  await cleanupExpiredAttachments();

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    throw new ChatValidationError(`Os arquivos excedem o tamanho total permitido de ${MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  const attachments: ChatAttachment[] = [];

  for (const file of files) {
    assertAllowedMimeType(file.type);
    assertFileSize(file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const token = randomUUID();
    const filePath = getFilePath(id, file.name);

    // Em serverless, não criar subdiretórios
    if (UPLOAD_DIR !== '/tmp') {
      const attachmentDir = getAttachmentDir(id);
      await fs.mkdir(attachmentDir, { recursive: true });
    }

    await fs.writeFile(filePath, buffer);

    const attachment: ChatAttachment = {
      id,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      token,
      expiresAt: Date.now() + ATTACHMENT_TTL_MS,
    };

    await fs.writeFile(getMetaPath(id), JSON.stringify(attachment), 'utf-8');

    attachments.push(attachment);
  }

  return attachments;
}

export async function loadAttachmentMetadata(id: string): Promise<ChatAttachment | null> {
  try {
    const meta = await fs.readFile(getMetaPath(id), 'utf-8');
    return JSON.parse(meta) as ChatAttachment;
  } catch {
    return null;
  }
}

export async function cleanupChatAttachments(attachments: ChatAttachment[]) {
  await Promise.all(
    attachments.map(async (attachment) => {
      try {
        // Em serverless, remover arquivo e metadata diretamente
        if (UPLOAD_DIR === '/tmp') {
          await fs.rm(attachment.path, { force: true }).catch(() => undefined);
          await fs.rm(getMetaPath(attachment.id), { force: true }).catch(() => undefined);
        } else {
          // Em ambientes não-serverless, remover o diretório inteiro
          await fs.rm(getAttachmentDir(attachment.id), { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`[Chat Attachments] Falha ao remover arquivo temporário ${attachment.path}`, error);
      }
    }),
  );
}

