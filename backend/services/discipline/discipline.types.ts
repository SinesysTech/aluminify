export interface Discipline {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDisciplineInput {
  name: string;
  empresaId: string;
  createdBy?: string;
}

export interface UpdateDisciplineInput {
  name?: string;
  empresaId: string;
}
