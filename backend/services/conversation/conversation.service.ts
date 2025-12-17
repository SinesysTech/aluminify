import { createClient } from '@/lib/server';
import type {
  Conversation,
  ChatMessage,
  CreateConversationRequest,
  UpdateConversationRequest,
  ListConversationsRequest,
  DeleteConversationRequest,
  GetActiveConversationRequest,
} from './conversation.types';

// Helper function to map database conversation to Conversation type
interface ConversationRow {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  messages?: ChatMessage[] | null;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  history?: ChatMessage[];
  [key: string]: unknown;
}

function mapConversation(data: ConversationRow): Conversation {
  return {
    ...data,
    messages: (data.messages && typeof data.messages === 'object' && Array.isArray(data.messages))
      ? (data.messages as unknown as ChatMessage[])
      : null,
    created_at: data.created_at || '1970-01-01T00:00:00.000Z',
    updated_at: data.updated_at || '1970-01-01T00:00:00.000Z',
    is_active: data.is_active ?? true,
  } as Conversation;
}

export class ConversationService {
  /**
   * Criar nova conversa
   */
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const supabase = await createClient();

    // Gerar session_id único
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: request.userId,
        session_id: sessionId,
        title: request.title || 'Nova Conversa',
        is_active: true, // Nova conversa sempre começa ativa
      })
      .select()
      .single();

    if (error) {
      console.error('[Conversation Service] Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create conversation: No data returned');
    }

    console.log('[Conversation Service] ✅ Conversation created:', data.id);
    
    return mapConversation(data);
  }

  /**
   * Listar conversas do usuário
   */
  async listConversations(request: ListConversationsRequest): Promise<Conversation[]> {
    const supabase = await createClient();

    let query = supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', request.userId)
      .order('updated_at', { ascending: false });

    if (request.limit) {
      query = query.limit(request.limit);
    }

    if (request.offset) {
      query = query.range(request.offset, request.offset + (request.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Conversation Service] Error listing conversations:', error);
      throw new Error(`Failed to list conversations: ${error.message}`);
    }

    console.log('[Conversation Service] 📋 Listed', data?.length || 0, 'conversations');
    return (data || []).map(mapConversation);
  }

  /**
   * Obter conversa ativa do usuário
   */
  async getActiveConversation(request: GetActiveConversationRequest): Promise<Conversation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', request.userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[Conversation Service] Error getting active conversation:', error);
      throw new Error(`Failed to get active conversation: ${error.message}`);
    }

    if (data) {
      console.log('[Conversation Service] ✅ Active conversation:', data.id);
      return mapConversation(data);
    } else {
      console.log('[Conversation Service] ℹ️  No active conversation found');
      return null;
    }
  }

  /**
   * Obter conversa por ID
   */
  async getConversationById(id: string, userId: string): Promise<Conversation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Conversation Service] Error getting conversation:', error);
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data ? mapConversation(data) : null;
  }

  /**
   * Atualizar conversa
   */
  async updateConversation(request: UpdateConversationRequest): Promise<Conversation> {
    const supabase = await createClient();

    const updates: Record<string, unknown> = {};

    if (request.title !== undefined && request.title !== null) {
      const trimmedTitle = String(request.title).trim();
      if (trimmedTitle.length > 0) {
        updates.title = trimmedTitle;
      } else {
        throw new Error('Title cannot be empty');
      }
    }

    if (request.is_active !== undefined) {
      updates.is_active = Boolean(request.is_active);
    }

    // Verificar se há campos para atualizar
    if (Object.keys(updates).length === 0) {
      console.log('[Conversation Service] No fields to update, returning existing conversation');
      const existing = await this.getConversationById(request.id, request.userId);
      if (!existing) {
        throw new Error('Conversation not found');
      }
      return existing;
    }

    console.log('[Conversation Service] Updating conversation:', request.id, 'with:', updates);

    const { data, error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', request.id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) {
      console.error('[Conversation Service] Error updating conversation:', error);
      console.error('[Conversation Service] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    if (!data) {
      console.error('[Conversation Service] No data returned after update');
      throw new Error('Conversation not found or unauthorized');
    }

    console.log('[Conversation Service] ✅ Conversation updated:', data.id);
    return mapConversation(data);
  }

  /**
   * Marcar conversa como ativa (desmarca outras)
   */
  async setActiveConversation(id: string, userId: string): Promise<Conversation> {
    return this.updateConversation({
      id,
      userId,
      is_active: true,
    });
  }

  /**
   * Deletar conversa
   */
  async deleteConversation(request: DeleteConversationRequest): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', request.id)
      .eq('user_id', request.userId);

    if (error) {
      console.error('[Conversation Service] Error deleting conversation:', error);
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }

    console.log('[Conversation Service] 🗑️  Conversation deleted:', request.id);
  }

  /**
   * Obter ou criar conversa ativa
   * Se não houver conversa ativa, cria uma nova
   */
  async getOrCreateActiveConversation(userId: string): Promise<Conversation> {
    // Tentar obter conversa ativa
    let active = await this.getActiveConversation({ userId });

    // Se não houver, criar nova
    if (!active) {
      console.log('[Conversation Service] No active conversation, creating new one');
      active = await this.createConversation({ userId });
    }

    return active;
  }

  /**
   * Atualiza o histórico completo da conversa (JSONB)
   */
  async updateConversationHistory(conversationId: string, userId: string, history: ChatMessage[]): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('chat_conversation_history')
      .upsert(
        {
          conversation_id: conversationId,
          user_id: userId,
          history: history as unknown as ChatMessage[],
        },
        { onConflict: 'conversation_id' },
      );

    if (error) {
      console.error('[Conversation Service] Error updating conversation history:', error);
      throw new Error(`Failed to update conversation history: ${error.message}`);
    }

    console.log('[Conversation Service] ✅ Conversation history saved:', conversationId);
  }

  async getConversationHistory(conversationId: string, userId: string): Promise<ChatMessage[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('chat_conversation_history')
      .select('history')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Conversation Service] Error fetching conversation history:', error);
      throw new Error(`Failed to fetch conversation history: ${error.message}`);
    }

    if (Array.isArray(data?.history)) {
      return data?.history as unknown as ChatMessage[];
    }

    return [];
  }
}

export const conversationService = new ConversationService();
