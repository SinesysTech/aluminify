// NOTE: Este arquivo roda no runtime Deno (Supabase Edge Functions).
// O TypeScript Server do VS Code (projeto Next.js) não resolve specifiers `jsr:`.
// Mantemos os imports para o runtime, mas ignoramos no TS Server para evitar erros no editor.
// @ts-expect-error - specifier `jsr:` é resolvido no runtime do Deno/Supabase
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-expect-error - specifier `jsr:` é resolvido no runtime do Deno/Supabase
import { createClient } from "jsr:@supabase/supabase-js@2";

// Declaração mínima para o TypeScript Server (não afeta o runtime Deno).
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

interface NotificacaoPayload {
  agendamento_id: string;
  tipo: 'criacao' | 'confirmacao' | 'cancelamento' | 'lembrete' | 'alteracao' | 'rejeicao' | 'bloqueio_criado' | 'recorrencia_alterada' | 'substituicao_solicitada';
  destinatario_id: string;
}

 
interface _AgendamentoData {
  id: string;
  professor_id: string;
  aluno_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  link_reuniao: string | null;
  observacoes: string | null;
  motivo_cancelamento: string | null;
}

 
interface _UserData {
  id: string;
  email: string;
  raw_user_meta_data: {
    name?: string;
    full_name?: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemplateData {
  alunoNome?: string;
  professorNome?: string;
  nomeOutraParte?: string;
  dataFormatada?: string;
  horario?: string;
  observacoes?: string;
  linkReuniao?: string;
  motivo?: string;
  mensagem?: string;
}

type EmailTemplate = {
  subject: string;
  getBody: (data: TemplateData) => string;
};

const emailTemplates: Record<NotificacaoPayload['tipo'], EmailTemplate> = {
  criacao: {
    subject: "Novo agendamento de atendimento",
    getBody: (data: TemplateData) => `
      <h2>Novo Agendamento de Atendimento</h2>
      <p>Voce recebeu um novo pedido de agendamento de atendimento.</p>
      <p><strong>Aluno:</strong> ${data.alunoNome}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.observacoes ? `<p><strong>Observacoes:</strong> ${data.observacoes}</p>` : ''}
      <p>Acesse a plataforma para confirmar ou rejeitar este agendamento.</p>
    `
  },
  confirmacao: {
    subject: "Seu agendamento foi confirmado!",
    getBody: (data: TemplateData) => `
      <h2>Agendamento Confirmado!</h2>
      <p>Seu agendamento de atendimento foi confirmado.</p>
      <p><strong>Professor:</strong> ${data.professorNome}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.linkReuniao ? `<p><strong>Link da reuniao:</strong> <a href="${data.linkReuniao}">${data.linkReuniao}</a></p>` : ''}
      <p>Adicione ao seu calendario para nao esquecer!</p>
    `
  },
  cancelamento: {
    subject: "Agendamento cancelado",
    getBody: (data: TemplateData) => `
      <h2>Agendamento Cancelado</h2>
      <p>Um agendamento de atendimento foi cancelado.</p>
      <p><strong>Com:</strong> ${data.nomeOutraParte}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.motivo ? `<p><strong>Motivo:</strong> ${data.motivo}</p>` : ''}
    `
  },
  rejeicao: {
    subject: "Agendamento nao aprovado",
    getBody: (data: TemplateData) => `
      <h2>Agendamento Nao Aprovado</h2>
      <p>Infelizmente seu pedido de agendamento nao foi aprovado.</p>
      <p><strong>Professor:</strong> ${data.professorNome}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.motivo ? `<p><strong>Motivo:</strong> ${data.motivo}</p>` : ''}
      <p>Voce pode tentar agendar em outro horario.</p>
    `
  },
  lembrete: {
    subject: "Lembrete: Agendamento de atendimento amanha",
    getBody: (data: TemplateData) => `
      <h2>Lembrete de Agendamento</h2>
      <p>Voce tem um agendamento de atendimento amanha!</p>
      <p><strong>Com:</strong> ${data.nomeOutraParte}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.linkReuniao ? `<p><strong>Link da reuniao:</strong> <a href="${data.linkReuniao}">${data.linkReuniao}</a></p>` : ''}
    `
  },
  alteracao: {
    subject: "Agendamento atualizado",
    getBody: (data: TemplateData) => `
      <h2>Agendamento Atualizado</h2>
      <p>Um agendamento de atendimento foi atualizado.</p>
      <p><strong>Com:</strong> ${data.nomeOutraParte}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      <p>Acesse a plataforma para ver os detalhes.</p>
    `
  },
  bloqueio_criado: {
    subject: "Agendamento afetado por bloqueio de agenda",
    getBody: (data: TemplateData) => `
      <h2>Agendamento Afetado por Bloqueio</h2>
      <p>Seu agendamento foi afetado por um bloqueio de agenda.</p>
      <p><strong>Com:</strong> ${data.nomeOutraParte}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      ${data.motivo ? `<p><strong>Motivo do bloqueio:</strong> ${data.motivo}</p>` : ''}
      <p>Por favor, entre em contato para reagendar ou verifique outras opcoes disponiveis.</p>
    `
  },
  recorrencia_alterada: {
    subject: "Disponibilidade do professor alterada",
    getBody: (data: TemplateData) => `
      <h2>Disponibilidade Alterada</h2>
      <p>O professor ${data.nomeOutraParte} alterou sua disponibilidade.</p>
      ${data.mensagem ? `<p>${data.mensagem}</p>` : ''}
      <p>Acesse a plataforma para ver os novos horarios disponiveis.</p>
    `
  },
  substituicao_solicitada: {
    subject: "Solicitacao de substituicao de agendamento",
    getBody: (data: TemplateData) => `
      <h2>Solicitacao de Substituicao</h2>
      <p>Foi solicitada uma substituicao para seu agendamento.</p>
      <p><strong>Com:</strong> ${data.nomeOutraParte}</p>
      <p><strong>Data:</strong> ${data.dataFormatada}</p>
      <p><strong>Horario:</strong> ${data.horario}</p>
      <p>Acesse a plataforma para mais detalhes.</p>
    `
  }
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") || "noreply@aluminify.com";

  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject: subject,
        html: htmlBody
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error sending email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Metodo nao permitido" }),
      { status: 405, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuracao do servidor invalida" }),
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificacaoPayload = await req.json();

    if (!payload.agendamento_id || !payload.tipo || !payload.destinatario_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatorios: agendamento_id, tipo, destinatario_id" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // Fetch agendamento data
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', payload.agendamento_id)
      .single();

    if (agendamentoError || !agendamento) {
      console.error("Error fetching agendamento:", agendamentoError);
      return new Response(
        JSON.stringify({ error: "Agendamento nao encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // Fetch destinatario data
    const { data: destinatario, error: destinatarioError } = await supabase.auth.admin.getUserById(payload.destinatario_id);

    if (destinatarioError || !destinatario.user) {
      console.error("Error fetching destinatario:", destinatarioError);
      return new Response(
        JSON.stringify({ error: "Destinatario nao encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // Fetch the other party's data (professor or aluno)
    const outraParteId = payload.destinatario_id === agendamento.professor_id
      ? agendamento.aluno_id
      : agendamento.professor_id;

    const { data: outraParte } = await supabase.auth.admin.getUserById(outraParteId);

    const destinatarioEmail = destinatario.user.email;
     
    const _destinatarioNome = destinatario.user.user_metadata?.name || destinatario.user.user_metadata?.full_name || destinatarioEmail;
    const outraParteNome = outraParte?.user?.user_metadata?.name || outraParte?.user?.user_metadata?.full_name || "Usuario";

    const dataFormatada = formatDate(agendamento.data_inicio);
    const horario = formatTime(agendamento.data_inicio, agendamento.data_fim);

    let emailSubject = "";
    let emailBody = "";

    const template = emailTemplates[payload.tipo];
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Tipo de notificacao invalido" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    emailSubject = template.subject;

    switch (payload.tipo) {
      case 'criacao':
        emailBody = template.getBody({
          alunoNome: outraParteNome,
          dataFormatada,
          horario,
          observacoes: agendamento.observacoes || undefined
        });
        break;
      case 'confirmacao':
        emailBody = template.getBody({
          professorNome: outraParteNome,
          dataFormatada,
          horario,
          linkReuniao: agendamento.link_reuniao || undefined
        });
        break;
      case 'cancelamento':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          dataFormatada,
          horario,
          motivo: agendamento.motivo_cancelamento || undefined
        });
        break;
      case 'rejeicao':
        emailBody = template.getBody({
          professorNome: outraParteNome,
          dataFormatada,
          horario,
          motivo: agendamento.motivo_cancelamento || undefined
        });
        break;
      case 'lembrete':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          dataFormatada,
          horario,
          linkReuniao: agendamento.link_reuniao || undefined
        });
        break;
      case 'alteracao':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          dataFormatada,
          horario
        });
        break;
      case 'bloqueio_criado':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          dataFormatada,
          horario,
          motivo: agendamento.motivo_cancelamento || undefined
        });
        break;
      case 'recorrencia_alterada':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          mensagem: 'A disponibilidade do professor foi atualizada.'
        });
        break;
      case 'substituicao_solicitada':
        emailBody = template.getBody({
          nomeOutraParte: outraParteNome,
          dataFormatada,
          horario
        });
        break;
    }

    // Send email
    const emailSent = await sendEmail(destinatarioEmail!, emailSubject, emailBody);

    // Update notification status
    const { error: updateError } = await supabase
      .from('agendamento_notificacoes')
      .update({
        enviado: emailSent,
        enviado_em: emailSent ? new Date().toISOString() : null,
        erro: emailSent ? null : "Falha ao enviar email"
      })
      .eq('agendamento_id', payload.agendamento_id)
      .eq('tipo', payload.tipo)
      .eq('destinatario_id', payload.destinatario_id)
      .is('enviado', false);

    if (updateError) {
      console.error("Error updating notification status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        destinatario: destinatarioEmail
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
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
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
      }
    );
  }
});
