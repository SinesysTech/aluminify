import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { ChatAttachment } from './chat.types';
import { ChatValidationError } from './errors';

const DEFAULT_UPLOAD_ROOT =
  process.env.CHAT_UPLOAD_DIR ||
  (process.platform === 'win32' ? path.join(process.cwd(), 'tmp') : '/tmp');
const UPLOAD_DIR = path.join(DEFAULT_UPLOAD_ROOT, 'chat-uploads');
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
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
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
  return path.join(UPLOAD_DIR, id);
}

function getMetaPath(id: string) {
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
    const attachmentDir = getAttachmentDir(id);
    await fs.mkdir(attachmentDir, { recursive: true });
    const filePath = path.join(attachmentDir, file.name);

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
        await fs.rm(getAttachmentDir(attachment.id), { recursive: true, force: true });
      } catch (error) {
        console.warn(`[Chat Attachments] Falha ao remover arquivo temporário ${attachment.path}`, error);
      }
    }),
  );
}

