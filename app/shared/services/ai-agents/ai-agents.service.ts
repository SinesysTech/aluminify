/**
 * AI Agents Service
 *
 * Business logic layer for AI agent operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AIAgentsRepositoryImpl } from './ai-agents.repository';
import type {
  AIAgent,
  AIAgentSummary,
  AIAgentChatConfig,
  CreateAIAgentInput,
  UpdateAIAgentInput,
} from './ai-agents.types';

export class AIAgentsService {
  private readonly repository: AIAgentsRepositoryImpl;

  constructor(client: SupabaseClient) {
    this.repository = new AIAgentsRepositoryImpl(client);
  }

  /**
   * Get agent by ID
   */
  async getById(id: string): Promise<AIAgent | null> {
    return this.repository.findById(id);
  }

  /**
   * Get agent by slug for a specific empresa
   */
  async getBySlug(empresaId: string, slug: string): Promise<AIAgent | null> {
    return this.repository.findBySlug(empresaId, slug);
  }

  /**
   * Get the default agent for an empresa
   */
  async getDefault(empresaId: string): Promise<AIAgent | null> {
    return this.repository.findDefaultByEmpresa(empresaId);
  }

  /**
   * Get all agents for an empresa (admin view)
   */
  async getAllForEmpresa(empresaId: string): Promise<AIAgent[]> {
    return this.repository.findAllByEmpresa(empresaId);
  }

  /**
   * Get active agents for an empresa (for sidebar/navigation)
   */
  async getActiveForEmpresa(empresaId: string): Promise<AIAgentSummary[]> {
    return this.repository.findActiveByEmpresa(empresaId);
  }

  /**
   * Get agent configuration for the chat UI
   * If slug is provided, gets that specific agent
   * Otherwise, gets the default agent for the empresa
   */
  async getChatConfig(empresaId: string, slug?: string): Promise<AIAgentChatConfig | null> {
    return this.repository.getChatConfig(empresaId, slug);
  }

  /**
   * Create a new agent
   */
  async create(input: CreateAIAgentInput, userId?: string): Promise<AIAgent> {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(input.slug)) {
      throw new Error('Slug deve conter apenas letras minúsculas, números e hífens');
    }

    // Check if slug already exists for this empresa
    const existing = await this.repository.findBySlug(input.empresaId, input.slug);
    if (existing) {
      throw new Error(`Já existe um agente com o slug "${input.slug}" nesta empresa`);
    }

    // If this is the first agent or marked as default, handle default logic
    if (input.isDefault) {
      const agents = await this.repository.findAllByEmpresa(input.empresaId);
      if (agents.length > 0) {
        // Unset existing default
        const currentDefault = agents.find(a => a.isDefault);
        if (currentDefault) {
          await this.repository.update(currentDefault.id, { isDefault: false }, userId);
        }
      }
    }

    return this.repository.create(input, userId);
  }

  /**
   * Update an existing agent
   */
  async update(id: string, input: UpdateAIAgentInput, userId?: string): Promise<AIAgent> {
    const agent = await this.repository.findById(id);
    if (!agent) {
      throw new Error('Agente não encontrado');
    }

    // Validate slug if being changed
    if (input.slug && input.slug !== agent.slug) {
      if (!/^[a-z0-9-]+$/.test(input.slug)) {
        throw new Error('Slug deve conter apenas letras minúsculas, números e hífens');
      }

      const existing = await this.repository.findBySlug(agent.empresaId, input.slug);
      if (existing && existing.id !== id) {
        throw new Error(`Já existe um agente com o slug "${input.slug}" nesta empresa`);
      }
    }

    // Handle default change
    if (input.isDefault === true && !agent.isDefault) {
      await this.repository.setDefault(agent.empresaId, id);
      // Remove isDefault from input since setDefault already handles it
      const { isDefault: _, ...restInput } = input;
      return this.repository.update(id, restInput, userId);
    }

    return this.repository.update(id, input, userId);
  }

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<void> {
    const agent = await this.repository.findById(id);
    if (!agent) {
      throw new Error('Agente não encontrado');
    }

    if (agent.isDefault) {
      throw new Error('Não é possível excluir o agente padrão. Defina outro agente como padrão primeiro.');
    }

    return this.repository.delete(id);
  }

  /**
   * Set an agent as the default for its empresa
   */
  async setDefault(agentId: string, userId?: string): Promise<AIAgent> {
    const agent = await this.repository.findById(agentId);
    if (!agent) {
      throw new Error('Agente não encontrado');
    }

    await this.repository.setDefault(agent.empresaId, agentId);
    return this.repository.findById(agentId) as Promise<AIAgent>;
  }
}
