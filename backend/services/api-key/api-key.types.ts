export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdBy: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  active?: boolean;
  expiresAt?: string | null;
}

