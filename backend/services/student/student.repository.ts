import { SupabaseClient } from '@supabase/supabase-js';
import { Student, CreateStudentInput, UpdateStudentInput } from './student.types';

export interface StudentRepository {
  list(): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findByCpf(cpf: string): Promise<Student | null>;
  findByEnrollmentNumber(enrollmentNumber: string): Promise<Student | null>;
  create(payload: CreateStudentInput): Promise<Student>;
  update(id: string, payload: UpdateStudentInput): Promise<Student>;
  delete(id: string): Promise<void>;
}

const TABLE = 'alunos';

type StudentRow = {
  id: string;
  nome_completo: string | null;
  email: string;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  cep: string | null;
  numero_matricula: string | null;
  instagram: string | null;
  twitter: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: StudentRow): Student {
  return {
    id: row.id,
    fullName: row.nome_completo,
    email: row.email,
    cpf: row.cpf,
    phone: row.telefone,
    birthDate: row.data_nascimento ? new Date(row.data_nascimento) : null,
    address: row.endereco,
    zipCode: row.cep,
    enrollmentNumber: row.numero_matricula,
    instagram: row.instagram,
    twitter: row.twitter,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class StudentRepositoryImpl implements StudentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Student[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) {
      throw new Error(`Failed to list students: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student by email: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const { data, error } = await this.client.from(TABLE).select('*').eq('cpf', cpf).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student by CPF: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async findByEnrollmentNumber(enrollmentNumber: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('numero_matricula', enrollmentNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch student by enrollment number: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(payload: CreateStudentInput): Promise<Student> {
    const insertData: Record<string, unknown> = {
      nome_completo: payload.fullName ?? null,
      email: payload.email.toLowerCase(),
      cpf: payload.cpf ?? null,
      telefone: payload.phone ?? null,
      data_nascimento: payload.birthDate ?? null,
      endereco: payload.address ?? null,
      cep: payload.zipCode ?? null,
      numero_matricula: payload.enrollmentNumber ?? null,
      instagram: payload.instagram ?? null,
      twitter: payload.twitter ?? null,
    };

    // Se o ID foi fornecido, usar ele (caso venha do auth.users)
    if (payload.id) {
      insertData.id = payload.id;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, payload: UpdateStudentInput): Promise<Student> {
    const updateData: Record<string, unknown> = {};

    if (payload.fullName !== undefined) {
      updateData.nome_completo = payload.fullName;
    }

    if (payload.email !== undefined) {
      updateData.email = payload.email.toLowerCase();
    }

    if (payload.cpf !== undefined) {
      updateData.cpf = payload.cpf;
    }

    if (payload.phone !== undefined) {
      updateData.telefone = payload.phone;
    }

    if (payload.birthDate !== undefined) {
      updateData.data_nascimento = payload.birthDate;
    }

    if (payload.address !== undefined) {
      updateData.endereco = payload.address;
    }

    if (payload.zipCode !== undefined) {
      updateData.cep = payload.zipCode;
    }

    if (payload.enrollmentNumber !== undefined) {
      updateData.numero_matricula = payload.enrollmentNumber;
    }

    if (payload.instagram !== undefined) {
      updateData.instagram = payload.instagram;
    }

    if (payload.twitter !== undefined) {
      updateData.twitter = payload.twitter;
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }
}

