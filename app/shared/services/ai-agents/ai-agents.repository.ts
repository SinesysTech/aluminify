/**
 * AI Agents Repository
 *
 * Data access layer for AI agent configuration.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  AIAgent,
  AIAgentRow,
  AIAgentSummary,
  AIAgentChatConfig,
  CreateAIAgentInput,
  UpdateAIAgentInput,
  IntegrationType,
  IntegrationConfig,
} from './ai-agents.types';

const TABLE = 'ai_agents';

// ============================================
// Row Mapper
// ============================================

function mapRow(row: AIAgentRow): AIAgent {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url,
    greetingMessage: row.greeting_message,
    placeholderText: row.placeholder_text,
    systemPrompt: row.system_prompt,
    model: row.model,
    temperature: Number(row.temperature),
    integrationType: row.integration_type as IntegrationType,
    integrationConfig: row.integration_config as IntegrationConfig,
    supportsAttachments: row.supports_attachments,
    supportsVoice: row.supports_voice,
    isActive: row.is_active,
    isDefault: row.is_default,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapToSummary(row: AIAgentRow): AIAgentSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    avatarUrl: row.avatar_url,
    isDefault: row.is_default,
  };
}

function mapToChatConfig(row: AIAgentRow): AIAgentChatConfig {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    avatarUrl: row.avatar_url,
    greetingMessage: row.greeting_message,
    placeholderText: row.placeholder_text,
    systemPrompt: row.system_prompt,
    model: row.model,
    temperature: Number(row.temperature),
    integrationType: row.integration_type as IntegrationType,
    integrationConfig: row.integration_config as IntegrationConfig,
    supportsAttachments: row.supports_attachments,
  };
}

// ============================================
// Repository Interface
// ============================================

export interface AIAgentsRepository {
  // Queries
  findById(id: string): Promise<AIAgent | null>;
  findBySlug(empresaId: string, slug: string): Promise<AIAgent | null>;
  findDefaultByEmpresa(empresaId: string): Promise<AIAgent | null>;
  findAllByEmpresa(empresaId: string): Promise<AIAgent[]>;
  findActiveByEmpresa(empresaId: string): Promise<AIAgentSummary[]>;
  getChatConfig(empresaId: string, slug?: string): Promise<AIAgentChatConfig | null>;

  // Mutations
  create(input: CreateAIAgentInput, userId?: string): Promise<AIAgent>;
  update(id: string, input: UpdateAIAgentInput, userId?: string): Promise<AIAgent>;
  delete(id: string): Promise<void>;
  setDefault(empresaId: string, agentId: string): Promise<void>;
}

// ============================================
// Repository Implementation
// ============================================

export class AIAgentsRepositoryImpl implements AIAgentsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<AIAgent | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findBySlug(empresaId: string, slug: string): Promise<AIAgent | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch agent by slug: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findDefaultByEmpresa(empresaId: string): Promise<AIAgent | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch default agent: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findAllByEmpresa(empresaId: string): Promise<AIAgent[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findActiveByEmpresa(empresaId: string): Promise<AIAgentSummary[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('id, slug, name, avatar_url, is_default')
      .eq('empresa_id', empresaId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active agents: ${error.message}`);
    }

    return (data ?? []).map(mapToSummary);
  }

  async getChatConfig(empresaId: string, slug?: string): Promise<AIAgentChatConfig | null> {
    let query = this.client
      .from(TABLE)
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('is_active', true);

    if (slug) {
      query = query.eq('slug', slug);
    } else {
      query = query.eq('is_default', true);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch agent chat config: ${error.message}`);
    }

    return data ? mapToChatConfig(data) : null;
  }

  async create(input: CreateAIAgentInput, userId?: string): Promise<AIAgent> {
    const insertData = {
      empresa_id: input.empresaId,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      avatar_url: input.avatarUrl ?? null,
      greeting_message: input.greetingMessage ?? null,
      placeholder_text: input.placeholderText ?? 'Digite sua mensagem...',
      system_prompt: input.systemPrompt ?? null,
      model: input.model ?? 'gpt-4o-mini',
      temperature: input.temperature ?? 0.7,
      integration_type: input.integrationType ?? 'copilotkit',
      integration_config: input.integrationConfig ?? {},
      supports_attachments: input.supportsAttachments ?? false,
      supports_voice: input.supportsVoice ?? false,
      is_active: input.isActive ?? true,
      is_default: input.isDefault ?? false,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateAIAgentInput, userId?: string): Promise<AIAgent> {
    const updateData: Record<string, unknown> = {
      updated_by: userId ?? null,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.greetingMessage !== undefined) updateData.greeting_message = input.greetingMessage;
    if (input.placeholderText !== undefined) updateData.placeholder_text = input.placeholderText;
    if (input.systemPrompt !== undefined) updateData.system_prompt = input.systemPrompt;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.temperature !== undefined) updateData.temperature = input.temperature;
    if (input.integrationType !== undefined) updateData.integration_type = input.integrationType;
    if (input.integrationConfig !== undefined) updateData.integration_config = input.integrationConfig;
    if (input.supportsAttachments !== undefined) updateData.supports_attachments = input.supportsAttachments;
    if (input.supportsVoice !== undefined) updateData.supports_voice = input.supportsVoice;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault;

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  async setDefault(empresaId: string, agentId: string): Promise<void> {
    // First, unset all defaults for this empresa
    const { error: unsetError } = await this.client
      .from(TABLE)
      .update({ is_default: false })
      .eq('empresa_id', empresaId)
      .eq('is_default', true);

    if (unsetError) {
      throw new Error(`Failed to unset default agent: ${unsetError.message}`);
    }

    // Then set the new default
    const { error: setError } = await this.client
      .from(TABLE)
      .update({ is_default: true })
      .eq('id', agentId);

    if (setError) {
      throw new Error(`Failed to set default agent: ${setError.message}`);
    }
  }
}
