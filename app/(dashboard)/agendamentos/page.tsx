import { AgendamentoScheduler } from "@/components/agendamento";
import { createClient } from "@/lib/server";
import { Suspense } from "react";

export default async function AgendamentosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In a real app, we might fetching the professor profile based on a slug in the URL
    // For now, we use the logged-in user as the professor to test the booking flow
    const professorId = user?.id || ""; 

	return (
		<main className="flex min-h-screen flex-col py-24 px-5 gap-8 max-w-5xl mx-auto">
			<div className="flex flex-col gap-2 items-center lg:px-10">
				<h1 className="font-bold text-4xl">Agendamentos</h1>
				<h2 className="font-medium text-xl text-muted-foreground text-center px-10">
					Agende sua sessão de mentoria ou dúvidas.
				</h2>
			</div>
			
			<div className="my-4">
                {professorId ? (
    				<Suspense fallback={<div>Carregando calendário...</div>}>
	    				<AgendamentoScheduler professorId={professorId} />
		    		</Suspense>
                ) : (
                    <div className="text-center text-red-500">
                        Você precisa estar logado para visualizar a agenda.
                    </div>
                )}
			</div>
		</main>
	);
}
