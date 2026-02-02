"use client";

import { useState, useEffect, useCallback } from "react";

interface PlantaoQuotaInfo {
  totalQuota: number;
  usedThisMonth: number;
  remaining: number;
}

interface UsePlantaoQuotaReturn extends PlantaoQuotaInfo {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePlantaoQuota(empresaId: string | null): UsePlantaoQuotaReturn {
  const [data, setData] = useState<PlantaoQuotaInfo>({
    totalQuota: 0,
    usedThisMonth: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agendamentos/quota");

      if (!response.ok) {
        if (response.status === 401) {
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch quota");
      }

      const result = await response.json();

      if (result.success) {
        setData({
          totalQuota: result.totalQuota,
          usedThisMonth: result.usedThisMonth,
          remaining: result.remaining,
        });
      }
    } catch (err) {
      console.error("Error fetching plantao quota:", err);
      setError(err instanceof Error ? err.message : "Failed to load quota");
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchQuota,
  };
}
