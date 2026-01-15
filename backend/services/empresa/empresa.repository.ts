import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Empresa, CreateEmpresaInput, UpdateEmpresaInput } from './empresa.types';

export interface EmpresaRepository {
  create(input: CreateEmpresaInput): Promise<Empresa>;
  findById(id: string): Promise<Empresa | null>;
  findBySlug(slug: string): Promise<Empresa | null>;
  update(id: string, input: UpdateEmpresaInput): Promise<Empresa>;
  delete(id: string): Promise<void>;
  listAll(): Promise<Empresa[]>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}

const TABLE = 'empresas';

// Use generated Database types instead of manual definitions
type EmpresaRow = Database['public']['Tables']['empresas']['Row'];
type EmpresaInsert = Database['public']['Tables']['empresas']['Insert'];
type EmpresaUpdate = Database['public']['Tables']['empresas']['Update'];

function mapRow(row: EmpresaRow): Empresa {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    cnpj: row.cnpj,
    emailContato: row.email_contato,
    telefone: row.telefone,
    logoUrl: row.logo_url,
    plano: row.plano,
    ativo: row.ativo,
    configuracoes: (row.configuracoes as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class EmpresaRepositoryImpl implements EmpresaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: CreateEmpresaInput): Promise<Empresa> {
    const insertData: EmpresaInsert = {
      nome: input.nome,
      slug: input.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      cnpj: input.cnpj ?? null,
      email_contato: input.emailContato ?? null,
      telefone: input.telefone ?? null,
      logo_url: input.logoUrl ?? null,
      plano: input.plano ?? 'basico',
      configuracoes: input.configuracoes ?? {},
    };

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create empresa: ${error.message}`);
    }

    return mapRow(data);
  }

  async findById(id: string): Promise<Empresa | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch empresa: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findBySlug(slug: string): Promise<Empresa | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch empresa by slug: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async update(id: string, input: UpdateEmpresaInput): Promise<Empresa> {
    const updateData: EmpresaUpdate = {};

    if (input.nome !== undefined) {
      updateData.nome = input.nome;
      // Atualizar slug se nome mudou
      updateData.slug = input.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    if (input.cnpj !== undefined) {
      // Se CNPJ for string vazia, definir como null no banco
      updateData.cnpj = input.cnpj && input.cnpj.trim() ? input.cnpj : null;
    }

    if (input.emailContato !== undefined) {
      updateData.email_contato = input.emailContato;
    }

    if (input.telefone !== undefined) {
      updateData.telefone = input.telefone;
    }

    if (input.logoUrl !== undefined) {
      updateData.logo_url = input.logoUrl;
    }

    if (input.plano !== undefined) {
      updateData.plano = input.plano;
    }

    if (input.ativo !== undefined) {
      updateData.ativo = input.ativo;
    }

    if (input.configuracoes !== undefined) {
      updateData.configuracoes = input.configuracoes;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update empresa: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete empresa: ${error.message}`);
    }
  }

  async listAll(): Promise<Empresa[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Failed to list empresas: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async activate(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ ativo: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to activate empresa: ${error.message}`);
    }
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to deactivate empresa: ${error.message}`);
    }
  }
}

