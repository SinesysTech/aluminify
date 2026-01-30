export interface ChatMessage {
  input: string;
}

export interface ChatIds {
  sessionId: string;
  userId: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  token?: string;
  expiresAt?: number;
  downloadUrl?: string;
}

export interface ChatResponse {
  output: string;
  history?: unknown;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  attachments?: ChatAttachment[];
}
