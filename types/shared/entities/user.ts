/**
 * Tipos de entidades de usuário compartilhados
 */

export type AppUserRole = 'aluno' | 'professor' | 'superadmin';

export interface AppUser {
  id: string;
  email: string;
  role: AppUserRole;
  fullName?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  empresaId?: string;
  empresaNome?: string;
  isEmpresaAdmin?: boolean;
}

export interface StudentCourseSummary {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  fullName: string | null;
  email: string;
  cpf: string | null;
  phone: string | null;
  birthDate: Date | null;
  address: string | null;
  zipCode: string | null;
  enrollmentNumber: string | null;
  instagram: string | null;
  twitter: string | null;
  courses: StudentCourseSummary[];
  mustChangePassword: boolean;
  temporaryPassword: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentInput {
  id?: string;
  fullName?: string;
  email: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  zipCode?: string;
  enrollmentNumber?: string;
  instagram?: string;
  twitter?: string;
  courseIds: string[];
  temporaryPassword?: string;
  mustChangePassword?: boolean;
}

export interface UpdateStudentInput {
  fullName?: string | null;
  email?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  zipCode?: string | null;
  enrollmentNumber?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  courseIds?: string[];
  temporaryPassword?: string | null;
  mustChangePassword?: boolean;
}

export interface Teacher {
  id: string;
  empresaId: string;
  isAdmin: boolean;
  fullName: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  biography: string | null;
  photoUrl: string | null;
  specialty: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherInput {
  id?: string;
  empresaId: string;
  isAdmin?: boolean;
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  biography?: string;
  photoUrl?: string;
  specialty?: string;
}

export interface UpdateTeacherInput {
  fullName?: string;
  email?: string;
  cpf?: string | null;
  phone?: string | null;
  biography?: string | null;
  photoUrl?: string | null;
  specialty?: string | null;
}

