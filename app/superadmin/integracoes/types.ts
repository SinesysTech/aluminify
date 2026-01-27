export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  errorRate: number;
  empresasWithIntegrations: number;
  totalEmpresas: number;
  activeApiKeys: number;
  expiredApiKeys: number;
  integrationsByProvider: {
    providerId: string;
    name: string;
    connected: number;
    active: number;
    error: number;
  }[];
  dailyActivity: {
    date: string;
    requests: number;
    errors: number;
  }[];
}

export type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "pending";

// Individual integration record for an empresa
export interface IntegrationRecord {
  providerId: string;
  status: IntegrationStatus;
  lastSync: string | null;
  config?: Record<string, unknown>;
}

// Aggregated view for the table
export interface EmpresaIntegration {
  id: string;
  empresaId: string;
  empresaNome: string;
  empresaSlug: string;
  plano: string;
  integrations: IntegrationRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key: string;
  keyPreview: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  createdBy: string;
}
