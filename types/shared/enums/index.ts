/**
 * Enumerações compartilhadas entre frontend e backend
 */

export type TipoAtividade =
  | 'Nivel_1'
  | 'Nivel_2'
  | 'Nivel_3'
  | 'Nivel_4'
  | 'Conceituario'
  | 'Lista_Mista'
  | 'Simulado_Diagnostico'
  | 'Simulado_Cumulativo'
  | 'Simulado_Global'
  | 'Flashcards'
  | 'Revisao';

export type StatusAtividade = 'Pendente' | 'Iniciado' | 'Concluido';

export type DificuldadePercebida = 'Muito Facil' | 'Facil' | 'Medio' | 'Dificil' | 'Muito Dificil';

export type Modality = 'EAD' | 'LIVE';

export type CourseType = 'Superextensivo' | 'Extensivo' | 'Intensivo' | 'Superintensivo' | 'Revisão';

export type MaterialType = 'Apostila' | 'Lista de Exercícios' | 'Planejamento' | 'Resumo' | 'Gabarito' | 'Outros';

