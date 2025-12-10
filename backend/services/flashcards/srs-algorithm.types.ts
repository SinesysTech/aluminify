/**
 * Tipos para o algoritmo de Repetição Espaçada (SRS)
 * Baseado no algoritmo SM-2 (SuperMemo 2)
 */

export type FeedbackValue = 1 | 2 | 3 | 4;

export interface SRSConfig {
  /** Fator de facilidade mínimo (padrão: 1.3) */
  easeFactorMin: number;
  /** Fator de facilidade máximo (padrão: 3.5) */
  easeFactorMax: number;
  /** Fator de facilidade inicial para novos cards (padrão: 2.5) */
  easeFactorInitial: number;
  /** Pesos de ajuste do fator de facilidade por feedback */
  feedbackWeights: {
    [K in FeedbackValue]: {
      /** Delta a ser aplicado no fator de facilidade */
      easeFactorDelta: number;
    };
  };
}

export interface SRSState {
  /** Fator de facilidade atual */
  easeFactor: number;
  /** Intervalo em dias até a próxima revisão */
  interval: number;
  /** Número total de revisões realizadas */
  repetitions: number;
  /** Último feedback dado (1-4) */
  lastFeedback: number | null;
}

export interface SRSResult {
  /** Novo fator de facilidade calculado */
  newEaseFactor: number;
  /** Novo intervalo em dias calculado */
  newInterval: number;
  /** Data da próxima revisão */
  nextReviewDate: Date;
  /** Novo número de revisões (incrementado) */
  newRepetitions: number;
}








