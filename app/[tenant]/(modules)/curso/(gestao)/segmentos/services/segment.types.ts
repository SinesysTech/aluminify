export interface Segment {
  id: string;
  name: string;
  slug: string | null;
  empresaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSegmentInput {
  name: string;
  slug?: string;
  empresaId: string;
  createdBy?: string;
}

export interface UpdateSegmentInput {
  name?: string;
  slug?: string;
}
