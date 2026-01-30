let fakeClient: any;

jest.mock('@/app/shared/core/database/database', () => ({
  getDatabaseClient: () => fakeClient,
}));

import { FlashcardsService } from '@/app/[tenant]/(modules)/flashcards/services/flashcards.service';

type QueryResult = { data: any; error: any; count?: number | null };

class FakeQueryBuilder {
  private table: string;
  private state: Record<string, any>;
  private fixtures: Record<string, (state: Record<string, any>) => QueryResult>;

  constructor(
    table: string,
    fixtures: Record<string, (state: Record<string, any>) => QueryResult>,
    state: Record<string, any>,
  ) {
    this.table = table;
    this.fixtures = fixtures;
    this.state = state;
  }

  select(_cols: string, _opts?: any) {
    return this;
  }
  eq(column: string, value: any) {
    this.state.eq = { ...(this.state.eq || {}), [column]: value };
    return this;
  }
  in(column: string, values: any[]) {
    this.state.in = { ...(this.state.in || {}), [column]: values };
    // Capturar o conjunto final de módulos consultados para flashcards
    if (this.table === 'flashcards' && column === 'modulo_id') {
      this.state.__capturedFlashcardsModuloIds = values;
    }
    return this;
  }
  or(value: string) {
    this.state.or = value;
    return this;
  }
  order(_column: string, _opts?: any) {
    return this;
  }
  limit(n: number) {
    this.state.limit = n;
    return this;
  }
  range(from: number, to: number) {
    this.state.range = { from, to };
    return this;
  }
  maybeSingle<T = any>() {
    this.state.maybeSingle = true;
    return this as unknown as PromiseLike<{ data: T | null; error: any }>;
  }

  private execute(): QueryResult {
    const handler = this.fixtures[this.table];
    if (!handler) {
      return { data: null, error: null };
    }
    return handler(this.state);
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

function createFakeClient(fixtures: Record<string, (state: Record<string, any>) => QueryResult>, sharedState: Record<string, any>) {
  return {
    from: (table: string) => new FakeQueryBuilder(table, fixtures, sharedState),
  };
}

describe('FlashcardsService.listForReview - scope completed', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1234);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('scope=all usa módulos do modo (sem restringir por concluídos)', async () => {
    const state: Record<string, any> = {};

    fakeClient = createFakeClient(
      {
        professores: () => ({ data: null, error: null }),
        alunos_cursos: () => ({ data: [{ curso_id: 'c1' }], error: null }),
        cursos_disciplinas: () => ({ data: [{ disciplina_id: 'd1' }], error: null }),
        frentes: () => ({ data: [{ id: 'f1' }], error: null }),
        modulos: (s) => {
          // Modo mais_cobrados filtra importancia='Alta'
          if (s.eq?.importancia === 'Alta') {
            return {
              data: [
                { id: 'm1', curso_id: 'c1', importancia: 'Alta', frente_id: 'f1' },
                { id: 'm2', curso_id: 'c1', importancia: 'Alta', frente_id: 'f1' },
              ],
              error: null,
            };
          }
          return { data: [], error: null };
        },
        flashcards: (s) => {
          const moduloIds = s.in?.modulo_id ?? [];
          // Retornar cards desses módulos
          const data = moduloIds.flatMap((mid: string, i: number) => [
            { id: `fc_${mid}_${i}`, modulo_id: mid, pergunta: 'P?', resposta: 'R', modulos: { importancia: 'Alta' } },
          ]);
          return { data, error: null };
        },
        progresso_flashcards: () => ({ data: [], error: null }),
        progresso_atividades: () => ({ data: [], error: null }),
        atividades: () => ({ data: [], error: null }),
      },
      state,
    );

    const service = new FlashcardsService();
    await service.listForReview('aluno_1', 'mais_cobrados', undefined, undefined, 'all');

    expect(state.__capturedFlashcardsModuloIds).toEqual(['m1', 'm2']);
  });

  test('scope=completed restringe aos módulos com ao menos 1 atividade concluída', async () => {
    const state: Record<string, any> = {};

    fakeClient = createFakeClient(
      {
        professores: () => ({ data: null, error: null }),
        alunos_cursos: () => ({ data: [{ curso_id: 'c1' }], error: null }),
        cursos_disciplinas: () => ({ data: [{ disciplina_id: 'd1' }], error: null }),
        frentes: () => ({ data: [{ id: 'f1' }], error: null }),
        modulos: (s) => {
          if (s.eq?.importancia === 'Alta') {
            return {
              data: [
                { id: 'm1', curso_id: 'c1', importancia: 'Alta', frente_id: 'f1' },
                { id: 'm2', curso_id: 'c1', importancia: 'Alta', frente_id: 'f1' },
              ],
              error: null,
            };
          }
          return { data: [], error: null };
        },
        // Apenas m2 tem alguma atividade concluída
        progresso_atividades: () => ({
          data: [{ atividade_id: 'a1', atividades: { modulo_id: 'm2' } }],
          error: null,
        }),
        flashcards: (s) => {
          const moduloIds = s.in?.modulo_id ?? [];
          const data = moduloIds.flatMap((mid: string, i: number) => [
            { id: `fc_${mid}_${i}`, modulo_id: mid, pergunta: 'P?', resposta: 'R', modulos: { importancia: 'Alta' } },
          ]);
          return { data, error: null };
        },
        progresso_flashcards: () => ({ data: [], error: null }),
        atividades: () => ({ data: [], error: null }),
      },
      state,
    );

    const service = new FlashcardsService();
    await service.listForReview('aluno_1', 'mais_cobrados', undefined, undefined, 'completed');

    expect(state.__capturedFlashcardsModuloIds).toEqual(['m2']);
  });
});

