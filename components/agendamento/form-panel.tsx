'use client'

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createAgendamento } from "@/app/actions/agendamentos";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FormPanelProps {
  professorId: string;
  timeZone: string;
}

export function FormPanel({ professorId, timeZone }: FormPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotParam = searchParams.get("slot");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    observacoes: "",
    link_reuniao: "" // Optional if we want user to provide it or generated later
  });

  if (!slotParam) {
    return <div>No slot selected</div>;
  }

  const startDate = new Date(slotParam);
  // Assume 30 min duration for now, or match logic
  const endDate = new Date(startDate.getTime() + 30 * 60000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAgendamento({
        professor_id: professorId,
        aluno_id: "", // Filled by server
        data_inicio: startDate.toISOString(), // Converter para ISO string para Server Action
        data_fim: endDate.toISOString(), // Converter para ISO string para Server Action
        // status: 'pendente' filled by server
        observacoes: formData.observacoes || null,
        link_reuniao: null // Or generate one
      });
      // Redirect or show success
      toast.success("Agendamento solicitado com sucesso!");
      router.push("/meus-agendamentos"); // Reset or go to list
      router.refresh();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao agendar";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-[360px]">
      <div className="flex flex-col space-y-1.5">
        <Label>Data e Hora</Label>
        <div className="text-sm font-medium">
          {startDate.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone })}
        </div>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Compartilhe detalhes para a reunião"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.back()}
          disabled={loading}
        >
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Agendamento
        </Button>
      </div>
    </form>
  );
}
