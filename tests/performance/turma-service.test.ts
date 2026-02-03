import { TurmaServiceImpl } from "@/app/[tenant]/(modules)/curso/services/turma/turma.service";
import { TurmaRepositoryImpl } from "@/app/[tenant]/(modules)/curso/services/turma/turma.repository";
import { SupabaseClient } from "@supabase/supabase-js";

jest.mock("@/app/[tenant]/(modules)/curso/services/turma/turma.repository");

describe("TurmaService Performance/Correctness", () => {
  let service: TurmaServiceImpl;
  let mockRepo: jest.Mocked<TurmaRepositoryImpl>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = {} as SupabaseClient<any>;
    service = new TurmaServiceImpl(mockClient);
    // @ts-expect-error: mocking private property
    mockRepo = (TurmaRepositoryImpl as jest.Mock).mock.instances[0];
    mockRepo.getById.mockResolvedValue({ id: "turma-1" } as any);
  });

  it("should correctly count successes and failures with mixed results", async () => {
    const turmaId = "turma-1";
    const alunoIds = ["1", "2", "3", "4", "5"];

    mockRepo.vincularAluno.mockImplementation(async (tid, aid) => {
      if (["2", "4"].includes(aid)) {
        throw new Error("Simulated failure");
      }
      return Promise.resolve();
    });

    const result = await service.vincularAlunos(turmaId, alunoIds);

    expect(result).toEqual({ success: 3, failed: 2 });
    expect(mockRepo.vincularAluno).toHaveBeenCalledTimes(5);
  });

  it("should handle all successes", async () => {
    mockRepo.vincularAluno.mockResolvedValue(undefined);
    const result = await service.vincularAlunos("t1", ["1", "2"]);
    expect(result).toEqual({ success: 2, failed: 0 });
  });

  it("should handle all failures", async () => {
    mockRepo.vincularAluno.mockRejectedValue(new Error("Fail"));
    const result = await service.vincularAlunos("t1", ["1", "2"]);
    expect(result).toEqual({ success: 0, failed: 2 });
  });

  it("should execute operations in parallel", async () => {
    const delay = 100;
    mockRepo.vincularAluno.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
    });

    const start = Date.now();
    await service.vincularAlunos("t1", ["1", "2", "3"]);
    const end = Date.now();
    const duration = end - start;

    console.log(`Execution duration: ${duration}ms`);

    // Expectation for Parallel execution:
    // With 3 items of 100ms, serial = 300ms+, parallel = ~100ms.
    // We assert it's less than serial sum (250ms is a safe upper bound for parallel, lower bound for serial).
    expect(duration).toBeLessThan(250);
  });
});
