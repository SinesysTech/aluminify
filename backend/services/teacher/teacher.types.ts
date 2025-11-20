export interface Teacher {
  id: string;
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

