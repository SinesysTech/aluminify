export interface Segment {
  id: string;
  name: string;
  slug: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSegmentInput {
  name: string;
  slug?: string;
}

export interface UpdateSegmentInput {
  name?: string;
  slug?: string;
}

export interface CreateSegmentInput {
  name: string;
  slug?: string;
  empresaId?: string | null;
  createdBy?: string;
}
