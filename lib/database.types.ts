/* eslint-disable @typescript-eslint/no-explicit-any */
// Database types generated from Supabase schema
// This file provides type safety for Supabase queries throughout the application

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          cnpj: string | null;
          email_contato: string | null;
          telefone: string | null;
          logo_url: string | null;
          plano: "basico" | "profissional" | "enterprise";
          ativo: boolean;
          configuracoes: Json;
          created_at: string;
          updated_at: string;
          subdomain: string | null;
          dominio_customizado: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          cnpj?: string | null;
          email_contato?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          plano?: "basico" | "profissional" | "enterprise";
          ativo?: boolean;
          configuracoes?: Json;
          created_at?: string;
          updated_at?: string;
          subdomain?: string | null;
          dominio_customizado?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          cnpj?: string | null;
          email_contato?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          plano?: "basico" | "profissional" | "enterprise";
          ativo?: boolean;
          configuracoes?: Json;
          created_at?: string;
          updated_at?: string;
          subdomain?: string | null;
          dominio_customizado?: string | null;
        };
      };
      professores: {
        Row: {
          id: string;
          nome_completo: string;
          email: string;
          cpf: string | null;
          telefone: string | null;
          biografia: string | null;
          foto_url: string | null;
          especialidade: string | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          nome_completo: string;
          email: string;
          cpf?: string | null;
          telefone?: string | null;
          biografia?: string | null;
          foto_url?: string | null;
          especialidade?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          nome_completo?: string;
          email?: string;
          cpf?: string | null;
          telefone?: string | null;
          biografia?: string | null;
          foto_url?: string | null;
          especialidade?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          is_admin?: boolean;
        };
      };
      alunos: {
        Row: {
          id: string;
          nome_completo: string | null;
          email: string;
          cpf: string | null;
          telefone: string | null;
          data_nascimento: string | null;
          endereco: string | null;
          cep: string | null;
          numero_matricula: string | null;
          instagram: string | null;
          twitter: string | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
        };
        Insert: {
          id: string;
          nome_completo?: string | null;
          email: string;
          cpf?: string | null;
          telefone?: string | null;
          data_nascimento?: string | null;
          endereco?: string | null;
          cep?: string | null;
          numero_matricula?: string | null;
          instagram?: string | null;
          twitter?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
        };
        Update: {
          id?: string;
          nome_completo?: string | null;
          email?: string;
          cpf?: string | null;
          telefone?: string | null;
          data_nascimento?: string | null;
          endereco?: string | null;
          cep?: string | null;
          numero_matricula?: string | null;
          instagram?: string | null;
          twitter?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
        };
      };
      cursos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
        };
      };
      disciplinas: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          cor: string | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          cor?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          cor?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
        };
      };
      frentes: {
        Row: {
          id: string;
          nome: string;
          disciplina_id: string;
          ordem: number | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          disciplina_id: string;
          ordem?: number | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          disciplina_id?: string;
          ordem?: number | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
        };
      };
      modulos: {
        Row: {
          id: string;
          nome: string;
          numero_modulo: number;
          frente_id: string;
          curso_id: string | null;
          importancia: "baixa" | "media" | "alta";
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          numero_modulo: number;
          frente_id: string;
          curso_id?: string | null;
          importancia?: "baixa" | "media" | "alta";
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          numero_modulo?: number;
          frente_id?: string;
          curso_id?: string | null;
          importancia?: "baixa" | "media" | "alta";
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
        };
      };
      aulas: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          modulo_id: string;
          ordem: number | null;
          tempo_estimado: number | null;
          tempo: string | null;
          prioridade: number | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
          curso_id: string | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          modulo_id: string;
          ordem?: number | null;
          tempo_estimado?: number | null;
          tempo?: string | null;
          prioridade?: number | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
          curso_id?: string | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          modulo_id?: string;
          ordem?: number | null;
          tempo_estimado?: number | null;
          tempo?: string | null;
          prioridade?: number | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
          curso_id?: string | null;
        };
      };
      atividades: {
        Row: {
          id: string;
          tipo: "questao" | "exercicio" | "simulado" | "redacao" | "leitura";
          titulo: string;
          descricao: string | null;
          modulo_id: string;
          arquivo_url: string | null;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          tipo: "questao" | "exercicio" | "simulado" | "redacao" | "leitura";
          titulo: string;
          descricao?: string | null;
          modulo_id: string;
          arquivo_url?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          tipo?: "questao" | "exercicio" | "simulado" | "redacao" | "leitura";
          titulo?: string;
          descricao?: string | null;
          modulo_id?: string;
          arquivo_url?: string | null;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          created_by?: string | null;
        };
      };
      progresso_atividades: {
        Row: {
          id: string;
          aluno_id: string;
          atividade_id: string;
          concluido: boolean;
          data_conclusao: string | null;
          nota: number | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          aluno_id: string;
          atividade_id: string;
          concluido?: boolean;
          data_conclusao?: string | null;
          nota?: number | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          aluno_id?: string;
          atividade_id?: string;
          concluido?: boolean;
          data_conclusao?: string | null;
          nota?: number | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alunos_cursos: {
        Row: {
          aluno_id: string;
          curso_id: string;
          data_matricula: string;
          ativo: boolean;
        };
        Insert: {
          aluno_id: string;
          curso_id: string;
          data_matricula?: string;
          ativo?: boolean;
        };
        Update: {
          aluno_id?: string;
          curso_id?: string;
          data_matricula?: string;
          ativo?: boolean;
        };
      };
      cronogramas: {
        Row: {
          id: string;
          aluno_id: string;
          curso_alvo_id: string | null;
          nome: string;
          created_at: string;
          updated_at: string;
          data_inicio: string;
          data_fim: string;
          dias_estudo_semana: number;
          horas_estudo_dia: number;
          periodos_ferias: Json;
          prioridade_minima: number;
          modalidade_estudo: "paralelo" | "sequencial";
          disciplinas_selecionadas: Json;
          ordem_frentes_preferencia: Json | null;
          velocidade_reproducao: number | null;
          acumulativo_desde_inicio: boolean;
        };
        Insert: {
          id?: string;
          aluno_id: string;
          curso_alvo_id?: string | null;
          nome?: string;
          created_at?: string;
          updated_at?: string;
          data_inicio: string;
          data_fim: string;
          dias_estudo_semana: number;
          horas_estudo_dia: number;
          periodos_ferias?: Json;
          prioridade_minima?: number;
          modalidade_estudo: "paralelo" | "sequencial";
          disciplinas_selecionadas?: Json;
          ordem_frentes_preferencia?: Json | null;
          velocidade_reproducao?: number | null;
          acumulativo_desde_inicio?: boolean;
        };
        Update: {
          id?: string;
          aluno_id?: string;
          curso_alvo_id?: string | null;
          nome?: string;
          created_at?: string;
          updated_at?: string;
          data_inicio?: string;
          data_fim?: string;
          dias_estudo_semana?: number;
          horas_estudo_dia?: number;
          periodos_ferias?: Json;
          prioridade_minima?: number;
          modalidade_estudo?: "paralelo" | "sequencial";
          disciplinas_selecionadas?: Json;
          ordem_frentes_preferencia?: Json | null;
          velocidade_reproducao?: number | null;
          acumulativo_desde_inicio?: boolean;
        };
      };
      cronograma_itens: {
        Row: {
          id: string;
          cronograma_id: string;
          aula_id: string;
          semana_numero: number;
          ordem_na_semana: number;
          concluido: boolean;
          data_conclusao: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cronograma_id: string;
          aula_id: string;
          semana_numero: number;
          ordem_na_semana: number;
          concluido?: boolean;
          data_conclusao?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cronograma_id?: string;
          aula_id?: string;
          semana_numero?: number;
          ordem_na_semana?: number;
          concluido?: boolean;
          data_conclusao?: string | null;
          created_at?: string;
        };
      };
      sessoes_estudo: {
        Row: {
          id: string;
          aluno_id: string;
          disciplina_id: string | null;
          frente_id: string | null;
          modulo_id: string | null;
          aula_id: string | null;
          tempo_estudado: number;
          data_sessao: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          aluno_id: string;
          disciplina_id?: string | null;
          frente_id?: string | null;
          modulo_id?: string | null;
          aula_id?: string | null;
          tempo_estudado: number;
          data_sessao?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          aluno_id?: string;
          disciplina_id?: string | null;
          frente_id?: string | null;
          modulo_id?: string | null;
          aula_id?: string | null;
          tempo_estudado?: number;
          data_sessao?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      agendamentos: {
        Row: {
          id: string;
          professor_id: string;
          aluno_id: string;
          data_inicio: string;
          data_fim: string;
          status: "pendente" | "confirmado" | "cancelado" | "concluido";
          link_reuniao: string | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string | null;
          empresa_id: string;
        };
        Insert: {
          id?: string;
          professor_id: string;
          aluno_id: string;
          data_inicio: string;
          data_fim: string;
          status?: "pendente" | "confirmado" | "cancelado" | "concluido";
          link_reuniao?: string | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string | null;
          empresa_id: string;
        };
        Update: {
          id?: string;
          professor_id?: string;
          aluno_id?: string;
          data_inicio?: string;
          data_fim?: string;
          status?: "pendente" | "confirmado" | "cancelado" | "concluido";
          link_reuniao?: string | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string | null;
          empresa_id?: string;
        };
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          title: string;
          messages: Json;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          title?: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          title?: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      tenant_branding: {
        Row: {
          id: string;
          empresa_id: string;
          color_palette_id: string | null;
          font_scheme_id: string | null;
          custom_css: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          color_palette_id?: string | null;
          font_scheme_id?: string | null;
          custom_css?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          color_palette_id?: string | null;
          font_scheme_id?: string | null;
          custom_css?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenant_logos: {
        Row: {
          id: string;
          tenant_branding_id: string;
          logo_type: "primary" | "secondary" | "favicon";
          logo_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_branding_id: string;
          logo_type: "primary" | "secondary" | "favicon";
          logo_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_branding_id?: string;
          logo_type?: "primary" | "secondary" | "favicon";
          logo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      color_palettes: {
        Row: {
          id: string;
          name: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      font_schemes: {
        Row: {
          id: string;
          name: string;
          heading_font: string;
          body_font: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          heading_font: string;
          body_font: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          heading_font?: string;
          body_font?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      enum_plano_empresa: "basico" | "profissional" | "enterprise";
      enum_modalidade_estudo: "paralelo" | "sequencial";
      enum_importancia: "baixa" | "media" | "alta";
      enum_tipo_atividade: "questao" | "exercicio" | "simulado" | "redacao" | "leitura";
      enum_status_agendamento: "pendente" | "confirmado" | "cancelado" | "concluido";
      enum_logo_type: "primary" | "secondary" | "favicon";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
