'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Empresa {
  id: string;
  nome: string;
}

export function EmpresaSelector() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');

  const fetchEmpresas = useCallback(async () => {
    try {
      const response = await fetch('/api/empresas');
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  function handleChange(value: string) {
    setSelectedEmpresa(value);
    // Atualizar URL com empresa_id
    const url = new URL(window.location.href);
    url.searchParams.set('empresa_id', value);
    window.location.href = url.toString();
  }

  return (
    <Select value={selectedEmpresa} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione uma empresa" />
      </SelectTrigger>
      <SelectContent>
        {empresas.map((empresa) => (
          <SelectItem key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

