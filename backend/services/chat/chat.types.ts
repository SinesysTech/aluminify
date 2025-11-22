export interface ChatMessage {
  input: string;
}

export interface ChatIds {
  sessionId: string;
  userId: string;
}

export interface ChatResponse {
  output: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

