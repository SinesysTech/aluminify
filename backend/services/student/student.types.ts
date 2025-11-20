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
}

