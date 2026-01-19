export interface Discipline {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Duplicate removed

export interface UpdateDisciplineInput {
  name?: string;
}

export interface CreateDisciplineInput {
  name: string;
  empresaId: string;
  createdBy?: string;
}
