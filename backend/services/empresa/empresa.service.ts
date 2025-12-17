import { SupabaseClient } from '@supabase/supabase-js';
import { EmpresaRepositoryImpl } from './empresa.repository';
import { Empresa, CreateEmpresaInput, UpdateEmpresaInput } from './empresa.types';

export class EmpresaService {
  constructor(
    private readonly repository: EmpresaRepositoryImpl,
    private readonly client: SupabaseClient
  ) {}

  async create(input: CreateEmpresaInput): Promise<Empresa> {
    // Validar CNPJ se fornecido
    if (input.cnpj) {
      this.validateCnpj(input.cnpj);
    }

    // Verificar se slug já existe
    const slug = this.generateSlug(input.nome);
    const existingBySlug = await this.repository.findBySlug(slug);
    if (existingBySlug) {
      throw new Error(`Empresa com slug "${slug}" já existe`);
    }

    // Verificar se CNPJ já existe
    if (input.cnpj) {
      const { data: existingByCnpj } = await this.client
        .from('empresas')
        .select('id')
        .eq('cnpj', input.cnpj)
        .maybeSingle();

      if (existingByCnpj) {
        throw new Error(`CNPJ "${input.cnpj}" já está cadastrado`);
      }
    }

    return this.repository.create({
      ...input,
      nome: input.nome.trim(),
    });
  }

  async findById(id: string): Promise<Empresa | null> {
    return this.repository.findById(id);
  }

  async findBySlug(slug: string): Promise<Empresa | null> {
    return this.repository.findBySlug(slug);
  }

  async update(id: string, input: UpdateEmpresaInput): Promise<Empresa> {
    // Validar CNPJ se fornecido
    if (input.cnpj) {
      this.validateCnpj(input.cnpj);

      // Verificar se CNPJ já existe em outra empresa
      const { data: existingByCnpj } = await this.client
        .from('empresas')
        .select('id')
        .eq('cnpj', input.cnpj)
        .neq('id', id)
        .maybeSingle();

      if (existingByCnpj) {
        throw new Error(`CNPJ "${input.cnpj}" já está cadastrado em outra empresa`);
      }
    }

    // Se nome mudou, verificar se novo slug já existe
    if (input.nome) {
      const slug = this.generateSlug(input.nome);
      const existingBySlug = await this.repository.findBySlug(slug);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new Error(`Empresa com slug "${slug}" já existe`);
      }
    }

    return this.repository.update(id, {
      ...input,
      nome: input.nome?.trim(),
    });
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async listAll(): Promise<Empresa[]> {
    return this.repository.listAll();
  }

  async activate(id: string): Promise<void> {
    return this.repository.activate(id);
  }

  async deactivate(id: string): Promise<void> {
    return this.repository.deactivate(id);
  }

  private validateCnpj(cnpj: string): void {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1+$/.test(cleanCnpj)) {
      throw new Error('CNPJ inválido');
    }

    // Validação básica de dígitos verificadores (pode ser expandida)
    // Por enquanto, apenas valida formato
  }

  private generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, '') // Remove caracteres especiais
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início e fim
  }
}

