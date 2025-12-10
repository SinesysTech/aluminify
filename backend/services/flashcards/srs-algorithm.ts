/**
 * Algoritmo de Repetição Espaçada (SRS)
 * Implementação baseada no algoritmo SM-2 (SuperMemo 2)
 * 
 * Feedback values:
 * 1 = Errei o item
 * 2 = Acertei parcialmente
 * 3 = Acertei com dificuldade
 * 4 = Acertei com facilidade
 */

import type { FeedbackValue, SRSConfig, SRSState, SRSResult } from './srs-algorithm.types';

/**
 * Configuração padrão do algoritmo SM-2
 */
export const DEFAULT_SRS_CONFIG: SRSConfig = {
  easeFactorMin: 1.3,
  easeFactorMax: 3.5,
  easeFactorInitial: 2.5,
  feedbackWeights: {
    1: { easeFactorDelta: -0.2 }, // Errei: reduz facilidade
    2: { easeFactorDelta: -0.15 }, // Parcial: reduz facilidade
    3: { easeFactorDelta: 0.05 },  // Dificil: aumenta ligeiramente
    4: { easeFactorDelta: 0.15 },  // Facil: aumenta mais
  },
};

/**
 * Calcula a próxima revisão baseado no feedback do aluno
 * 
 * @param feedback - Feedback do aluno (1-4)
 * @param currentState - Estado atual do card
 * @param config - Configuração opcional do algoritmo (usa padrão se não fornecido)
 * @returns Resultado com novo estado calculado
 */
export function calculateNextReview(
  feedback: FeedbackValue,
  currentState: Partial<SRSState>,
  config: Partial<SRSConfig> = {}
): SRSResult {
  const finalConfig: SRSConfig = {
    ...DEFAULT_SRS_CONFIG,
    ...config,
    feedbackWeights: {
      ...DEFAULT_SRS_CONFIG.feedbackWeights,
      ...config.feedbackWeights,
    },
  };

  // Estado inicial se não existir
  const easeFactor = currentState.easeFactor ?? finalConfig.easeFactorInitial;
  const interval = currentState.interval ?? 0;
  const repetitions = currentState.repetitions ?? 0;

  let newEaseFactor: number;
  let newInterval: number;

  // Se o aluno errou (feedback = 1), resetar intervalo e reduzir facilidade
  if (feedback === 1) {
    newInterval = 1; // Sempre revisar no dia seguinte
    newEaseFactor = Math.max(
      finalConfig.easeFactorMin,
      easeFactor + finalConfig.feedbackWeights[1].easeFactorDelta
    );
  } else {
    // Para feedbacks 2, 3 ou 4, calcular novo intervalo baseado no anterior
    const intervalBase = Math.max(1, interval || 1);
    const multiplier = easeFactor;
    newInterval = Math.max(1, Math.round(intervalBase * multiplier));

    // Ajustar fator de facilidade baseado no feedback
    const delta = finalConfig.feedbackWeights[feedback].easeFactorDelta;
    newEaseFactor = easeFactor + delta;

    // Garantir limites
    newEaseFactor = Math.max(
      finalConfig.easeFactorMin,
      Math.min(finalConfig.easeFactorMax, newEaseFactor)
    );
  }

  // Incrementar contador de revisões
  const newRepetitions = repetitions + 1;

  // Calcular data da próxima revisão
  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    newEaseFactor,
    newInterval,
    nextReviewDate,
    newRepetitions,
  };
}

/**
 * Valida se um valor de feedback é válido
 */
export function isValidFeedback(value: unknown): value is FeedbackValue {
  return typeof value === 'number' && [1, 2, 3, 4].includes(value);
}








