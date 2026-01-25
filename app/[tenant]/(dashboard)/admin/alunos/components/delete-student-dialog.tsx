"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Student } from "@/types/shared/entities/user";
import { deleteStudentAction } from "../actions";
import { toast } from "@/hooks/use-toast";

interface DeleteStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Maps technical error messages to user-friendly messages
 */
function getErrorMessage(error: string): string {
  const errorMappings: Record<string, string> = {
    "permission denied": "Você não tem permissão para excluir este aluno. Verifique se você é administrador da empresa.",
    "not found": "Aluno não encontrado. Ele pode já ter sido excluído.",
    "network": "Erro de conexão. Verifique sua internet e tente novamente.",
    "timeout": "A operação demorou muito. Tente novamente.",
    "foreign key": "Este aluno possui dados vinculados que impedem a exclusão. Entre em contato com o suporte.",
  };

  const lowerError = error.toLowerCase();

  for (const [key, message] of Object.entries(errorMappings)) {
    if (lowerError.includes(key)) {
      return message;
    }
  }

  // Return original error if no mapping found, but make it more user-friendly
  if (lowerError.includes("failed to")) {
    return "Não foi possível excluir o aluno. Tente novamente ou entre em contato com o suporte.";
  }

  return error;
}

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
}: DeleteStudentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!student) return;

    setIsDeleting(true);
    try {
      const result = await deleteStudentAction(student.id);

      if (result.success) {
        onOpenChange(false);
        toast({
          title: "Aluno excluído",
          description: `${student.fullName || student.email} foi desativado com sucesso.`,
        });
        router.refresh();
      } else {
        const friendlyMessage = getErrorMessage(result.error || "Erro desconhecido");
        toast({
          variant: "destructive",
          title: "Erro ao excluir aluno",
          description: friendlyMessage,
        });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar a solicitação. Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o aluno{" "}
            <strong>{student?.fullName || student?.email}</strong>?
            <br />
            <br />
            Esta acao ira desativar o acesso do aluno a plataforma. Os dados
            serao mantidos para historico e podem ser recuperados se necessario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
