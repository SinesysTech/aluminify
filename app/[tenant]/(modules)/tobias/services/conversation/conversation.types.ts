export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  messages?: ChatMessage[] | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  history?: ChatMessage[];
}

export interface CreateConversationRequest {
  userId: string;
  title?: string;
}

export interface UpdateConversationRequest {
  id: string;
  userId: string;
  title?: string;
  is_active?: boolean;
}

export interface ListConversationsRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface DeleteConversationRequest {
  id: string;
  userId: string;
}

export interface GetActiveConversationRequest {
  userId: string;
}

export interface ConversationHistoryRecord {
  conversation_id: string;
  user_id: string;
  history: ChatMessage[];
  created_at: string;
  updated_at: string;
}
