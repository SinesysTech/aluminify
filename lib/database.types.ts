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
          id?: string
          link_reuniao_padrao?: string | null
          mensagem_confirmacao?: string | null
          professor_id?: string
          tempo_antecedencia_minimo?: number | null
          tempo_lembrete_minutos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agendamento_disponibilidade: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dia_semana: number
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
          hora_fim?: string
          hora_inicio?: string
          id?: string
          professor_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agendamento_notificacoes: {
        Row: {
          agendamento_id: string
          created_at: string | null
          destinatario_id: string
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
        Relationships: []
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          empresa_id: string | null
          id: string
          modulo_id: string | null
          nome: string
          numero_aula: number | null
          prioridade: number | null
          tempo_estimado_minutos: number | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string | null
          id?: string
          modulo_id?: string | null
          nome: string
          numero_aula?: number | null
          prioridade?: number | null
          tempo_estimado_minutos?: number | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string | null
          empresa_id?: string | null
          id?: string
          modulo_id?: string | null
          nome?: string
          numero_aula?: number | null
          prioridade?: number | null
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
            foreignKeyName: "aulas_modulo_id_fkey"
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
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string | null
          curso_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string | null
          curso_id?: string | null
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
            foreignKeyName: "cronograma_itens_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
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
          empresa_id: string | null
          id: string
          modulo_id: string | null
          pergunta: string
          resposta: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          modulo_id?: string | null
          pergunta: string
          resposta: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
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
          empresa_id: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          disciplina_id?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          curso_id?: string | null
          disciplina_id?: string | null
          empresa_id?: string | null
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          {
            foreignKeyName: "modulos_frente_id_fkey"
            columns: ["frente_id"]
            isOneToOne: false
            referencedRelation: "frentes"
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
        ]
      }
      progresso_flashcards: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_proxima_revisao: string | null
          dias_intervalo: number | null
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
          comecar_no_modulo: number | null
          created_at: string | null
          curso_id: string | null
          frequencia_modulos: number | null
          gerar_no_ultimo: boolean | null
          id: string
          nome_padrao: string
          tipo_atividade: Database["public"]["Enums"]["enum_tipo_atividade"]
          updated_at: string | null
        }
        Insert: {
          acumulativo?: boolean | null
          comecar_no_modulo?: number | null
          created_at?: string | null
          curso_id?: string | null
          frequencia_modulos?: number | null
          gerar_no_ultimo?: boolean | null
          id?: string
          nome_padrao: string
          tipo_atividade: Database["public"]["Enums"]["enum_tipo_atividade"]
          updated_at?: string | null
        }
        Update: {
          acumulativo?: boolean | null
          comecar_no_modulo?: number | null
          created_at?: string | null
          curso_id?: string | null
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
        ]
      }
      segmentos: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string | null
          id: string
          nome: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
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
            foreignKeyName: "sessoes_estudo_frente_id_fkey"
            columns: ["frente_id"]
            isOneToOne: false
            referencedRelation: "frentes"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          id: string
          empresa_id: string
          color_palette_id: string | null
          font_scheme_id: string | null
          custom_css: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          color_palette_id?: string | null
          font_scheme_id?: string | null
          custom_css?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          update null
        }
        Update: {
          id?: string
       tring
          color_palette_id?: string | null
          font_scheme_id?: stringull
          custom_css?: str null
       
          updated_at?: string
          created_by?: string | null
          updated_by?: strull
        }
        Relationships: [
          {
            foreigd_fkey"
            columns: ["emprea_id"]
           
       "
            referencedColumns
          },
          {
            foreignKeyName
           
       alse
            referencedRelation: "color_palettes"
            referencedColumns: []
          },
          {
            foreignKeyName: "ty"
            columns: ["font_sche]
            isOneToOne: false
            referencedRelation: "fo"
            r
          },
        ]
      }
      tenant_lo
        Row
          i
          tenant_br
          logo_type: Database[]
          logo_url: string
          file_name: string | null
          filll
          mime_type: string | 
          cg
          updated_at: sng
        }
        Ins: {
          id?: string
          tenant_branding_iding
          l]
          logo_url: string
          file_name?: string | null
          file_size?: nu null
       | null
     ing
          uptring
        }
        Update: {
          id?: stg
          tenant_tring
          logo_type"]
          logo_url?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreign
            columns: ["td"]
            isOneToOne:e
            referencedRelation: branding"
            referencedColumns: 
          },
        ]
      }
      color_palettes: {
        Row: {
          id: string
          name: string
          empresa_id: stri
          primary_cing
          primary_foreground: string
          secondary_colorstring
          secondary_ring
          accent_color: string
          accent_foregrostring
          muted_co
          muted_fore
          backgrou
          foreground_color: string
     ing
          card_foregrstring
          destructive_col
     string
   ing
 g

          sidebar_primary_foreground: string
ean
          created_at: string
tring
          created_b
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
   
          primary_color: string
          primary_foreground: string
          secondary_r: string
          secondary_foreground: string
          accent_color: string
 
          muted_color: string
          muted_foreground: string
          backgrou
     ng
       g
          cstring
          destructive_color: string
          destructive_foregrounng
          sidebar_background: st
          sidebar_foreground: string
          sidebar_pry: string
       ng
         an
          cre: string
          u
 null
          updated_by?: st
        }
        Update: {
          id?: string
          name?: string
          empresa_id?: string
   ng
          primary_foreground?: string
          secondary_ing
          secondary_foreground?: string
          accent_color?: string
 tring
          muted_color?: string
          muted_foregstring
     ring
       ring
          c
          card_foreground?: string
          destructive_color?: string
          destructive_fing
       ng
         ring
          sidng
          sd?: string
an
          created_at?: string
          updated_at?: string
          created_by?: string | nul
          updated_by?: string | null
        }
        Relationships: [
   
            foreignKeyName: "color_palettes_empresa_id_fkey"
            columns:d"]
            isOneToOne: false
            referencedRelation: "empresa
 d"]
          },
        ]
      }
      fes: {
        Row: {
          id: string
          name: string
          empresa_id: s
       son
         
          fonn
          f
l
          is_custon
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
   {
          id?: string
          name: string
          empresa_id: string
          font_sans?: Json
 o?: Json
          font_sizes?: Json
          font_weights?: Json
          google_fonts?: Json | null
          ian
tring
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
   ring
          empresa_id?: string
          font_sans? Json
          font_mono?: Json
          font_sizes?: Json
 : Json
          google_fonts?: Json | null
          is_custom?: boolean
          created_at?: string
          ung
ll
          updated_by?: str null
        }
        Rela [
          {
            foreignKey
            colu
            isOnse
            refere"
            referencedCo["id"]
        
        ]
      }
      custom_theme_presets: {
        Row: {
          id: string
          name: st
          empresa_
          color_pa | null
          font_schll
          radius: number
          scale: number
          mode: string
          preview_colors: Json
          is_default: boolean
          created_at:
          updated_ string
        
          updated_by: st | null
        }
        Insert: {
          id?: string
          name: string
          empresa_ing
        
          font_scheme_id?: string | null
          radius?: number
          scale?: ner
          mode?: string
          preview_colorJson
          is_defaoolean
          created_ag
          updatedring
        null
          updated_by?: string | null
      }
    pdate: {
          g

    }evern never]: n  [_ iews: {
      Vi}
    }
    ]
           ,
     }     
 ns: ["id"]rencedColumefe         rmes"
   cheon: "font_slatireferencedRe        lse
    One: fa  isOneTo       
   "]_scheme_id["font   columns:       _fkey"
   nt_scheme_ide_presets_fotom_theme: "cusgnKeyNam   forei       {
   
             },"]
      dlumns: ["icedCo  referen   "
       lettes"color_pan: atioedRel   referenc         
e: falseoOnOneT   is        id"]
 tte_le_pa"color: [   columns        y"
 te_id_fker_paletesets_coloprme_ustom_theame: "ceignKeyN        for   {
    },
       
          : ["id"]encedColumns   refer      "
   : "empresasdRelationrence   refe        
 One: falseToOne     is   id"]
    mpresa_mns: ["e   colu        ey"
 esa_id_fksets_empreme_preth: "custom_NameignKey      fore        {
   [
     ips: tionsh  Rela}
      ll
         | nungy?: stripdated_b    u       | null
 stringy?:created_b
           stringated_at?:upd     
     grint?: st_areated     c
     eanult?: booldefa    is_son
      : J_colors?preview
          ode?: string         mumber
 cale?: n        s
   numberius?:       rad| null
   g inme_id?: strt_sche fon         ull
| n: string d?tte_i_pale    colorring
       st_id?:resa    empng
       name?: stri         d?: strini    U   string | reated_by?:  cst_at?: trint?: sult?: b: s?umbulling | ne_id?: strolor_palett  cid: strringring | null_by: statedcre  t:atring s string | nu_id:emed: stringlette_iingid: stringr  },lumns: "empresasn: Relationced faleToOne:presa_id"]mns: ["emid_fkey"esa_mpres_echemfont_sName: "nships:tioing |string | nu?: ed_by    creat      : striated_at?pdont_weights?         f:  name?: st     at?: s    created_       booletom?:s_cusnt_mon         fo    Insert:   booleam:son | nulfonts: Jogle_   go       nJsont_weights: o_sizes: Jsot: Jsonono font_mont_sans: J   fringtont_schems: ["imnrencedColu   refe        s"mpresa_i"e [ {      lstom?: boole       is_cu   oregrounar_primary_fidebimary?: striebar_preground?: stordebar_f siound?: striebar_backgr   sidd?: stroregrounlor?: stringrd_coad_color?: stgroun   forecolor?: stkground_     bacd?: rounnd?: st_foregrouccen      a   color?: strlor?: striry_coprima       llring | nung |tri: sby? created_          stringd_at?:pdateated_at?lestom?: boo is_cu striound:oregry_fimar  sidebar_pr imaringrd: strireground: _foard strinor:   card_col_color: strindouoregr    f tringor: snd_colstringforeground: nt_cce         acoloid: stringa_      empres  nullring |y: sted_at: s    updat      boolstom:      is_cu     ng: striar_primary  sideb        und: strinegro_forar   sideb      ground: strbar_back       sideeground: ructive_for dest    tringr: soound: lor: str_coard     cstringolor: nd_cingtrund: sgro: stringorld: unground: stfore:  strolor:ngid"][""tenant_ falsing_iant_brandeney"_fknding_ids_tenant_bratenant_logoyName: "Ketype_logo_]["enumums"blic"]["Enatabase["pu D?:id?: sbranding_rin?: sdated_at_at?: str   created  e?: string type_   mimmber |ogo_type"]["enum_l"]["Enums"["public Databaseogo_type:: strerttri_at: strinreatednull| nunumber e_size: go_type"["enum_lonums"]ic"]["E"publgg_id: strinandind: string: {gos: { ["id"]s:dColumneferencees_schemntme_id"d_fkee_ifont_schemt_branding_enan"id"ne: f    isOneToO "]lette_id"color_pans: [ colum_id_fkey"ette_paling_colorndnt_bra: "tena: ["id"]resas "empn:cedRelatioen    refer e: trueOneToOn issmpresa_i_erandingnt_btena: "KeyNamen | ning: stringat? created_  ng |i | n sa_id?: empres   |_by?: stringd
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
      enum_tipo_curso:
        | "Superextensivo"
        | "Extensivo"
        | "Intensivo"
        | "Superintensivo"
        | "Revisão"
      enum_tipo_bloqueio: "feriado" | "recesso" | "imprevisto" | "outro"
      enum_tipo_material:
        | "Apostila"
        | "Lista de Exercícios"
        | "Planejamento"
        | "Resumo"
        | "Gabarito"
        | "Outros"
      enum_tipo_servico_agendamento: "plantao" | "mentoria"
      enum_logo_type: "login" | "sidebar" | "favicon"
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
      enum_tipo_curso: [
        "Superextensivo",
        "Extensivo",
        "Intensivo",
        "Superintensivo",
        "Revisão",
      ],
      enum_tipo_bloqueio: ["feriado", "recesso", "imprevisto", "outro"],
      enum_tipo_material: [
        "Apostila",
        "Lista de Exercícios",
        "Planejamento",
        "Resumo",
        "Gabarito",
        "Outros",
      ],
      enum_tipo_servico_agendamento: ["plantao", "mentoria"],
      enum_logo_type: ["login", "sidebar", "favicon"],
    },
  },
} as const
