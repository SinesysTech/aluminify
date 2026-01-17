export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamento_bloqueios: {
        Row: {
          created_at: string
          criado_por: string
          data_fim: string
          data_inicio: string
          empresa_id: string
          id: string
          motivo: string | null
          professor_id: string | null
          tipo: Database["public"]["Enums"]["enum_tipo_bloqueio"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data_fim: string
          data_inicio: string
          empresa_id: string
          id?: string
          motivo?: string | null
          professor_id?: string | null
          tipo?: Database["public"]["Enums"]["enum_tipo_bloqueio"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data_fim?: string
          data_inicio?: string
          empresa_id?: string
          id?: string
          motivo?: string | null
          professor_id?: string | null
          tipo?: Database["public"]["Enums"]["enum_tipo_bloqueio"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_bloqueios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_configuracoes: {
        Row: {
          auto_confirmar: boolean | null
          created_at: string | null
          empresa_id: string
          id: string
          link_reuniao_padrao: string | null
          mensagem_confirmacao: string | null
          professor_id: string
          tempo_antecedencia_minimo: number | null
          tempo_lembrete_minutos: number | null
          updated_at: string | null
        }
        Insert: {
          auto_confirmar?: boolean | null
          created_at?: string | null
          empresa_id: string
          id?: string
          link_reuniao_padrao?: string | null
          mensagem_confirmacao?: string | null
          professor_id: string
          tempo_antecedencia_minimo?: number | null
          tempo_lembrete_minutos?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_confirmar?: boolean | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          link_reuniao_padrao?: string | null
          mensagem_confirmacao?: string | null
          professor_id?: string
          tempo_antecedencia_minimo?: number | null
          tempo_lembrete_minutos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_configuracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_disponibilidade: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dia_semana: number
          empresa_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          professor_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dia_semana: number
          empresa_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          professor_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dia_semana?: number
          empresa_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          professor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_disponibilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_notificacoes: {
        Row: {
          agendamento_id: string
          created_at: string | null
          destinatario_id: string
          empresa_id: string | null
          enviado: boolean | null
          enviado_em: string | null
          erro: string | null
          id: string
          tipo: string
        }
        Insert: {
          agendamento_id: string
          created_at?: string | null
          destinatario_id: string
          empresa_id?: string | null
          enviado?: boolean | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          tipo: string
        }
        Update: {
          agendamento_id?: string
          created_at?: string | null
          destinatario_id?: string
          empresa_id?: string | null
          enviado?: boolean | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_notificacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_notificacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_recorrencia: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_semana: number
          duracao_slot_minutos: number
          empresa_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          professor_id: string
          tipo_servico: Database["public"]["Enums"]["enum_tipo_servico_agendamento"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          dia_semana: number
          duracao_slot_minutos?: number
          empresa_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          professor_id: string
          tipo_servico?: Database["public"]["Enums"]["enum_tipo_servico_agendamento"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_semana?: number
          duracao_slot_minutos?: number
          empresa_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          professor_id?: string
          tipo_servico?: Database["public"]["Enums"]["enum_tipo_servico_agendamento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_recorrencia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          aluno_id: string
          cancelado_por: string | null
          confirmado_em: string | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          empresa_id: string
          id: string
          lembrete_enviado: boolean | null
          lembrete_enviado_em: string | null
          link_reuniao: string | null
          motivo_cancelamento: string | null
          observacoes: string | null
          professor_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          cancelado_por?: string | null
          confirmado_em?: string | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          empresa_id: string
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          link_reuniao?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          professor_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          cancelado_por?: string | null
          confirmado_em?: string | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          empresa_id?: string
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          link_reuniao?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          professor_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      alunos: {
        Row: {
          cep: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string
          endereco: string | null
          id: string
          instagram: string | null
          must_change_password: boolean
          nome_completo: string | null
          numero_matricula: string | null
          senha_temporaria: string | null
          telefone: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          id: string
          instagram?: string | null
          must_change_password?: boolean
          nome_completo?: string | null
          numero_matricula?: string | null
          senha_temporaria?: string | null
          telefone?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          id?: string
          instagram?: string | null
          must_change_password?: boolean
          nome_completo?: string | null
          numero_matricula?: string | null
          senha_temporaria?: string | null
          telefone?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alunos_cursos: {
        Row: {
          aluno_id: string
          created_at: string | null
          curso_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          curso_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          curso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_cursos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key: string
          last_used_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key: string
          last_used_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      atividades: {
        Row: {
          arquivo_url: string | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          gabarito_url: string | null
          id: string
          link_externo: string | null
          modulo_id: string | null
          obrigatorio: boolean | null
          ordem_exibicao: number | null
          tipo: Database["public"]["Enums"]["enum_tipo_atividade"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          gabarito_url?: string | null
          id?: string
          link_externo?: string | null
          modulo_id?: string | null
          obrigatorio?: boolean | null
          ordem_exibicao?: number | null
          tipo: Database["public"]["Enums"]["enum_tipo_atividade"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          gabarito_url?: string | null
          id?: string
          link_externo?: string | null
          modulo_id?: string | null
          obrigatorio?: boolean | null
          ordem_exibicao?: number | null
          tipo?: Database["public"]["Enums"]["enum_tipo_atividade"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string | null
          curso_id: string | null
          empresa_id: string
          id: string
          modulo_id: string | null
          nome: string
          numero_aula: number | null
          prioridade: number | null
          tempo_estimado_interval: unknown
          tempo_estimado_minutos: number | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id: string
          id?: string
          modulo_id?: string | null
          nome: string
          numero_aula?: number | null
          prioridade?: number | null
          tempo_estimado_interval?: unknown
          tempo_estimado_minutos?: number | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string
          id?: string
          modulo_id?: string | null
          nome?: string
          numero_aula?: number | null
          prioridade?: number | null
          tempo_estimado_interval?: unknown
          tempo_estimado_minutos?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_aulas_modulo_id"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_concluidas: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string | null
          curso_id: string | null
          empresa_id: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_concluidas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_concluidas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_concluidas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_concluidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation_history: {
        Row: {
          conversation_id: string
          created_at: string
          history: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          history?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          history?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          messages: Json | null
          session_id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          session_id: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          session_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cronograma_itens: {
        Row: {
          aula_id: string
          concluido: boolean | null
          created_at: string | null
          cronograma_id: string
          data_conclusao: string | null
          data_prevista: string | null
          id: string
          ordem_na_semana: number
          semana_numero: number
        }
        Insert: {
          aula_id: string
          concluido?: boolean | null
          created_at?: string | null
          cronograma_id: string
          data_conclusao?: string | null
          data_prevista?: string | null
          id?: string
          ordem_na_semana: number
          semana_numero: number
        }
        Update: {
          aula_id?: string
          concluido?: boolean | null
          created_at?: string | null
          cronograma_id?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          id?: string
          ordem_na_semana?: number
          semana_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cronograma_itens_aula_id"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_semanas_dias: {
        Row: {
          created_at: string | null
          cronograma_id: string
          dias_semana: number[]
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cronograma_id: string
          dias_semana?: number[]
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cronograma_id?: string
          dias_semana?: number[]
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_semanas_dias_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: true
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_tempo_estudos: {
        Row: {
          created_at: string | null
          cronograma_id: string
          data: string
          data_conclusao: string | null
          disciplina_id: string
          frente_id: string
          id: string
          tempo_estudos_concluido: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cronograma_id: string
          data: string
          data_conclusao?: string | null
          disciplina_id: string
          frente_id: string
          id?: string
          tempo_estudos_concluido?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cronograma_id?: string
          data?: string
          data_conclusao?: string | null
          disciplina_id?: string
          frente_id?: string
          id?: string
          tempo_estudos_concluido?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_tempo_estudos_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cronograma_tempo_estudos_disciplina_id"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cronograma_tempo_estudos_frente_id"
            columns: ["frente_id"]
            isOneToOne: false
            referencedRelation: "frentes"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas: {
        Row: {
          aluno_id: string
          created_at: string | null
          curso_alvo_id: string | null
          data_fim: string
          data_inicio: string
          dias_estudo_semana: number
          disciplinas_selecionadas: Json
          empresa_id: string
          excluir_aulas_concluidas: boolean
          horas_estudo_dia: number
          id: string
          modalidade_estudo: string
          modulos_selecionados: Json | null
          nome: string | null
          ordem_frentes_preferencia: Json | null
          periodos_ferias: Json | null
          prioridade_minima: number
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          curso_alvo_id?: string | null
          data_fim: string
          data_inicio: string
          dias_estudo_semana: number
          disciplinas_selecionadas?: Json
          empresa_id: string
          excluir_aulas_concluidas?: boolean
          horas_estudo_dia: number
          id?: string
          modalidade_estudo: string
          modulos_selecionados?: Json | null
          nome?: string | null
          ordem_frentes_preferencia?: Json | null
          periodos_ferias?: Json | null
          prioridade_minima?: number
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          curso_alvo_id?: string | null
          data_fim?: string
          data_inicio?: string
          dias_estudo_semana?: number
          disciplinas_selecionadas?: Json
          empresa_id?: string
          excluir_aulas_concluidas?: boolean
          horas_estudo_dia?: number
          id?: string
          modalidade_estudo?: string
          modulos_selecionados?: Json | null
          nome?: string | null
          ordem_frentes_preferencia?: Json | null
          periodos_ferias?: Json | null
          prioridade_minima?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronogramas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronogramas_curso_alvo_id_fkey"
            columns: ["curso_alvo_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronogramas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ano_vigencia: number
          created_at: string
          created_by: string | null
          data_inicio: string | null
          data_termino: string | null
          descricao: string | null
          disciplina_id: string | null
          empresa_id: string
          id: string
          imagem_capa_url: string | null
          meses_acesso: number | null
          modalidade: Database["public"]["Enums"]["enum_modalidade"]
          nome: string
          planejamento_url: string | null
          segmento_id: string | null
          tipo: Database["public"]["Enums"]["enum_tipo_curso"]
          updated_at: string
        }
        Insert: {
          ano_vigencia: number
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          empresa_id: string
          id?: string
          imagem_capa_url?: string | null
          meses_acesso?: number | null
          modalidade: Database["public"]["Enums"]["enum_modalidade"]
          nome: string
          planejamento_url?: string | null
          segmento_id?: string | null
          tipo: Database["public"]["Enums"]["enum_tipo_curso"]
          updated_at?: string
        }
        Update: {
          ano_vigencia?: number
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          empresa_id?: string
          id?: string
          imagem_capa_url?: string | null
          meses_acesso?: number | null
          modalidade?: Database["public"]["Enums"]["enum_modalidade"]
          nome?: string
          planejamento_url?: string | null
          segmento_id?: string | null
          tipo?: Database["public"]["Enums"]["enum_tipo_curso"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_disciplinas: {
        Row: {
          created_at: string | null
          curso_id: string
          disciplina_id: string
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          disciplina_id: string
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          disciplina_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_disciplinas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_admins: {
        Row: {
          created_at: string
          empresa_id: string
          is_owner: boolean
          permissoes: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          is_owner?: boolean
          permissoes?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          is_owner?: boolean
          permissoes?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_admins_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          configuracoes: Json | null
          created_at: string
          email_contato: string | null
          id: string
          logo_url: string | null
          nome: string
          plano: Database["public"]["Enums"]["enum_plano_empresa"]
          slug: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          configuracoes?: Json | null
          created_at?: string
          email_contato?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          plano?: Database["public"]["Enums"]["enum_plano_empresa"]
          slug: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          configuracoes?: Json | null
          created_at?: string
          email_contato?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: Database["public"]["Enums"]["enum_plano_empresa"]
          slug?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          modulo_id: string | null
          pergunta: string
          resposta: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          modulo_id?: string | null
          pergunta: string
          resposta: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          modulo_id?: string | null
          pergunta?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      frentes: {
        Row: {
          created_at: string | null
          created_by: string | null
          curso_id: string | null
          disciplina_id: string | null
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          disciplina_id?: string | null
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          disciplina_id?: string | null
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "frentes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frentes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_curso: {
        Row: {
          arquivo_url: string
          created_at: string
          created_by: string | null
          curso_id: string | null
          descricao_opcional: string | null
          empresa_id: string
          id: string
          ordem: number
          tipo: Database["public"]["Enums"]["enum_tipo_material"]
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          created_by?: string | null
          curso_id?: string | null
          descricao_opcional?: string | null
          empresa_id: string
          id?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["enum_tipo_material"]
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          created_by?: string | null
          curso_id?: string | null
          descricao_opcional?: string | null
          empresa_id?: string
          id?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["enum_tipo_material"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_curso_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string | null
          ativo: boolean
          created_at: string
          curso_id: string | null
          data_fim_acesso: string
          data_inicio_acesso: string
          data_matricula: string
          id: string
          updated_at: string
        }
        Insert: {
          aluno_id?: string | null
          ativo?: boolean
          created_at?: string
          curso_id?: string | null
          data_fim_acesso: string
          data_inicio_acesso?: string
          data_matricula?: string
          id?: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string | null
          ativo?: boolean
          created_at?: string
          curso_id?: string | null
          data_fim_acesso?: string
          data_inicio_acesso?: string
          data_matricula?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string | null
          curso_id: string | null
          empresa_id: string
          frente_id: string | null
          id: string
          importancia:
            | Database["public"]["Enums"]["enum_importancia_modulo"]
            | null
          nome: string
          numero_modulo: number | null
        }
        Insert: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id: string
          frente_id?: string | null
          id?: string
          importancia?:
            | Database["public"]["Enums"]["enum_importancia_modulo"]
            | null
          nome: string
          numero_modulo?: number | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string
          frente_id?: string | null
          id?: string
          importancia?:
            | Database["public"]["Enums"]["enum_importancia_modulo"]
            | null
          nome?: string
          numero_modulo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_modulos_frente_id"
            columns: ["frente_id"]
            isOneToOne: false
            referencedRelation: "frentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          biografia: string | null
          cpf: string | null
          created_at: string
          email: string
          empresa_id: string
          especialidade: string | null
          foto_url: string | null
          id: string
          is_admin: boolean
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          biografia?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          empresa_id: string
          especialidade?: string | null
          foto_url?: string | null
          id: string
          is_admin?: boolean
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          biografia?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          empresa_id?: string
          especialidade?: string | null
          foto_url?: string | null
          id?: string
          is_admin?: boolean
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_atividades: {
        Row: {
          aluno_id: string | null
          anotacoes_pessoais: string | null
          atividade_id: string | null
          created_at: string | null
          data_conclusao: string | null
          data_inicio: string | null
          dificuldade_percebida:
            | Database["public"]["Enums"]["enum_dificuldade_percebida"]
            | null
          empresa_id: string | null
          id: string
          questoes_acertos: number | null
          questoes_totais: number | null
          status: Database["public"]["Enums"]["enum_status_atividade"] | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          anotacoes_pessoais?: string | null
          atividade_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dificuldade_percebida?:
            | Database["public"]["Enums"]["enum_dificuldade_percebida"]
            | null
          empresa_id?: string | null
          id?: string
          questoes_acertos?: number | null
          questoes_totais?: number | null
          status?: Database["public"]["Enums"]["enum_status_atividade"] | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          anotacoes_pessoais?: string | null
          atividade_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dificuldade_percebida?:
            | Database["public"]["Enums"]["enum_dificuldade_percebida"]
            | null
          empresa_id?: string | null
          id?: string
          questoes_acertos?: number | null
          questoes_totais?: number | null
          status?: Database["public"]["Enums"]["enum_status_atividade"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_atividades_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_atividades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_flashcards: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_proxima_revisao: string | null
          dias_intervalo: number | null
          empresa_id: string | null
          flashcard_id: string | null
          id: string
          nivel_facilidade: number | null
          numero_revisoes: number | null
          ultimo_feedback: number | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_proxima_revisao?: string | null
          dias_intervalo?: number | null
          empresa_id?: string | null
          flashcard_id?: string | null
          id?: string
          nivel_facilidade?: number | null
          numero_revisoes?: number | null
          ultimo_feedback?: number | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_proxima_revisao?: string | null
          dias_intervalo?: number | null
          empresa_id?: string | null
          flashcard_id?: string | null
          id?: string
          nivel_facilidade?: number | null
          numero_revisoes?: number | null
          ultimo_feedback?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_flashcards_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_flashcards_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_flashcards_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_atividades: {
        Row: {
          acumulativo: boolean | null
          acumulativo_desde_inicio: boolean | null
          comecar_no_modulo: number | null
          created_at: string | null
          curso_id: string | null
          empresa_id: string
          frequencia_modulos: number | null
          gerar_no_ultimo: boolean | null
          id: string
          nome_padrao: string
          tipo_atividade: Database["public"]["Enums"]["enum_tipo_atividade"]
          updated_at: string | null
        }
        Insert: {
          acumulativo?: boolean | null
          acumulativo_desde_inicio?: boolean | null
          comecar_no_modulo?: number | null
          created_at?: string | null
          curso_id?: string | null
          empresa_id: string
          frequencia_modulos?: number | null
          gerar_no_ultimo?: boolean | null
          id?: string
          nome_padrao: string
          tipo_atividade: Database["public"]["Enums"]["enum_tipo_atividade"]
          updated_at?: string | null
        }
        Update: {
          acumulativo?: boolean | null
          acumulativo_desde_inicio?: boolean | null
          comecar_no_modulo?: number | null
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string
          frequencia_modulos?: number | null
          gerar_no_ultimo?: boolean | null
          id?: string
          nome_padrao?: string
          tipo_atividade?: Database["public"]["Enums"]["enum_tipo_atividade"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_atividades_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_atividades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentos: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          nome: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          nome: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "segmentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_estudo: {
        Row: {
          aluno_id: string | null
          atividade_relacionada_id: string | null
          created_at: string | null
          disciplina_id: string | null
          empresa_id: string | null
          fim: string | null
          frente_id: string | null
          id: string
          inicio: string | null
          log_pausas: Json | null
          metodo_estudo: string | null
          nivel_foco: number | null
          status: string | null
          tempo_total_bruto_segundos: number | null
          tempo_total_liquido_segundos: number | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          atividade_relacionada_id?: string | null
          created_at?: string | null
          disciplina_id?: string | null
          empresa_id?: string | null
          fim?: string | null
          frente_id?: string | null
          id?: string
          inicio?: string | null
          log_pausas?: Json | null
          metodo_estudo?: string | null
          nivel_foco?: number | null
          status?: string | null
          tempo_total_bruto_segundos?: number | null
          tempo_total_liquido_segundos?: number | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          atividade_relacionada_id?: string | null
          created_at?: string | null
          disciplina_id?: string | null
          empresa_id?: string | null
          fim?: string | null
          frente_id?: string | null
          id?: string
          inicio?: string | null
          log_pausas?: Json | null
          metodo_estudo?: string | null
          nivel_foco?: number | null
          status?: string | null
          tempo_total_bruto_segundos?: number | null
          tempo_total_liquido_segundos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessoes_estudo_frente_id"
            columns: ["frente_id"]
            isOneToOne: false
            referencedRelation: "frentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_estudo_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_estudo_atividade_relacionada_id_fkey"
            columns: ["atividade_relacionada_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_estudo_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_estudo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aluno_matriculado_empresa: {
        Args: { empresa_id_param: string }
        Returns: boolean
      }
      check_and_set_first_professor_superadmin: {
        Args: { user_id: string }
        Returns: undefined
      }
      gerar_atividades_personalizadas: {
        Args: { p_curso_id: string; p_frente_id: string }
        Returns: undefined
      }
      get_aluno_empresas: {
        Args: never
        Returns: {
          empresa_id: string
        }[]
      }
      get_matriculas_aluno: {
        Args: { p_aluno_id: string }
        Returns: {
          curso_id: string
        }[]
      }
      get_user_empresa_id: { Args: never; Returns: string }
      importar_cronograma_aulas:
        | {
            Args: {
              p_conteudo: Json
              p_curso_id: string
              p_disciplina_nome: string
              p_frente_nome: string
            }
            Returns: {
              aulas_importadas: number
              modulos_importados: number
            }[]
          }
        | {
            Args: {
              p_conteudo: Json
              p_disciplina_nome: string
              p_frente_nome: string
            }
            Returns: undefined
          }
      is_empresa_admin:
        | { Args: never; Returns: boolean }
        | {
            Args: { empresa_id_param: string; user_id_param: string }
            Returns: boolean
          }
      is_superadmin: { Args: never; Returns: boolean }
      user_belongs_to_empresa: {
        Args: { empresa_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      enum_dificuldade_percebida:
        | "Muito Facil"
        | "Facil"
        | "Medio"
        | "Dificil"
        | "Muito Dificil"
      enum_importancia_modulo: "Alta" | "Media" | "Baixa" | "Base"
      enum_modalidade: "EAD" | "LIVE"
      enum_plano_empresa: "basico" | "profissional" | "enterprise"
      enum_status_atividade: "Pendente" | "Iniciado" | "Concluido"
      enum_tipo_atividade:
        | "Nivel_1"
        | "Nivel_2"
        | "Nivel_3"
        | "Nivel_4"
        | "Conceituario"
        | "Lista_Mista"
        | "Simulado_Diagnostico"
        | "Simulado_Cumulativo"
        | "Simulado_Global"
        | "Flashcards"
        | "Revisao"
      enum_tipo_bloqueio: "feriado" | "recesso" | "imprevisto" | "outro"
      enum_tipo_curso:
        | "Superextensivo"
        | "Extensivo"
        | "Intensivo"
        | "Superintensivo"
        | "Revisão"
      enum_tipo_material:
        | "Apostila"
        | "Lista de Exercícios"
        | "Planejamento"
        | "Resumo"
        | "Gabarito"
        | "Outros"
      enum_tipo_servico_agendamento: "plantao" | "mentoria"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      enum_dificuldade_percebida: [
        "Muito Facil",
        "Facil",
        "Medio",
        "Dificil",
        "Muito Dificil",
      ],
      enum_importancia_modulo: ["Alta", "Media", "Baixa", "Base"],
      enum_modalidade: ["EAD", "LIVE"],
      enum_plano_empresa: ["basico", "profissional", "enterprise"],
      enum_status_atividade: ["Pendente", "Iniciado", "Concluido"],
      enum_tipo_atividade: [
        "Nivel_1",
        "Nivel_2",
        "Nivel_3",
        "Nivel_4",
        "Conceituario",
        "Lista_Mista",
        "Simulado_Diagnostico",
        "Simulado_Cumulativo",
        "Simulado_Global",
        "Flashcards",
        "Revisao",
      ],
      enum_tipo_bloqueio: ["feriado", "recesso", "imprevisto", "outro"],
      enum_tipo_curso: [
        "Superextensivo",
        "Extensivo",
        "Intensivo",
        "Superintensivo",
        "Revisão",
      ],
      enum_tipo_material: [
        "Apostila",
        "Lista de Exercícios",
        "Planejamento",
        "Resumo",
        "Gabarito",
        "Outros",
      ],
      enum_tipo_servico_agendamento: ["plantao", "mentoria"],
    },
  },
} as const
