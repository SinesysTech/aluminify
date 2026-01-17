import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: complete-past-appointments
 *
 * Purpose: Automatically marks confirmed appointments as completed
 * after their scheduled end time has passed.
 *
 * Should be triggered via cron (e.g., every hour) or manually.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuracao do servidor invalida" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();

    console.log("Processing auto-complete at:", now.toISOString());

    // Find confirmed appointments where the end time has passed
    const { data: agendamentos, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, professor_id, aluno_id, data_inicio, data_fim')
      .eq('status', 'confirmado')
      .lt('data_fim', now.toISOString());

    if (fetchError) {
      console.error("Error fetching agendamentos:", fetchError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar agendamentos", details: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!agendamentos || agendamentos.length === 0) {
      console.log("No appointments to complete");
      return new Response(
        JSON.stringify({
          success: true,
          completed: 0,
          message: "Nenhum agendamento para completar"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${agendamentos.length} appointments to complete`);

    let completedCount = 0;
    let errorCount = 0;
    const completedIds: string[] = [];
    const failedIds: string[] = [];

    for (const agendamento of agendamentos) {
      try {
        // Update the appointment status to completed
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update({
            status: 'concluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', agendamento.id);

        if (updateError) {
          console.error("Error completing agendamento:", agendamento.id, updateError);
          errorCount++;
          failedIds.push(agendamento.id);
        } else {
          completedCount++;
          completedIds.push(agendamento.id);
          console.log("Completed agendamento:", agendamento.id);
        }

      } catch (error) {
        console.error("Error processing agendamento:", agendamento.id, error);
        errorCount++;
        failedIds.push(agendamento.id);
      }
    }

    // Log audit trail
    console.log("Auto-complete summary:", {
      timestamp: now.toISOString(),
      totalFound: agendamentos.length,
      completed: completedCount,
      errors: errorCount,
      completedIds,
      failedIds
    });

    return new Response(
      JSON.stringify({
        success: true,
        completed: completedCount,
        errors: errorCount,
        total: agendamentos.length,
        completedIds,
        failedIds
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        detalhes: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
