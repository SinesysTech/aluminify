"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { TransactionStatus, Provider } from "@/types/shared/entities/financial";

interface TransactionFiltersProps {
  currentStatus?: TransactionStatus;
  currentProvider?: Provider;
  currentSearch?: string;
}

export function TransactionFilters({
  currentStatus,
  currentProvider,
  currentSearch,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset page when filtering
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("?");
  }, [router]);

  const hasFilters = currentStatus || currentProvider || currentSearch;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por email..."
          defaultValue={currentSearch}
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
            const timeoutId = setTimeout(() => {
              updateFilter("buyerEmail", value || null);
            }, 500);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>

      <Select
        value={currentStatus || "all"}
        onValueChange={(value) =>
          updateFilter("status", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="approved">Aprovado</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
          <SelectItem value="refunded">Reembolsado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentProvider || "all"}
        onValueChange={(value) =>
          updateFilter("provider", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as origens</SelectItem>
          <SelectItem value="hotmart">Hotmart</SelectItem>
          <SelectItem value="stripe">Stripe</SelectItem>
          <SelectItem value="internal">Interno</SelectItem>
          <SelectItem value="manual">Manual</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
