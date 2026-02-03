import { DashboardAnalyticsService } from "@/app/[tenant]/(modules)/dashboard/services/dashboard-analytics.service";
import * as databaseModule from "@/app/shared/core/database/database";

jest.mock("@/app/shared/core/database/database");

describe("DashboardAnalyticsService Performance Benchmark", () => {
  let service: DashboardAnalyticsService;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardAnalyticsService();

    mockClient = {
      auth: {
        admin: {
          getUserById: jest.fn().mockResolvedValue({
            user: {
              email: "professor@test.com",
              user_metadata: { role: "professor" },
            },
          }),
        },
      },
      from: jest.fn().mockImplementation((table: string) => {
        const builder: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockImplementation((col, val) => {
             builder._inVal = val;
             return builder;
          }),
          or: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: "user-1", nome_completo: "Prof" } }),
          then: async (resolve: any) => {
            let data: any = [];

            // Artificial delay for performance testing
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

            if (table === "atividades") {
               await delay(50); // Simulate DB latency
               // Return enough unique activities to trigger chunking in the next step
               // We are called 3 times (2000 modules / 900).
               // Let's return 900 items per call.
               data = Array.from({length: 900}, () => ({
                 id: `atv-${Math.random()}`,
                 modulo_id: "m1"
               }));
            } else if (table === "progresso_atividades") {
               await delay(50); // Simulate DB latency
               data = [];
            } else if (table === "modulos") {
               // Return many modules to force chunking (chunk size 900)
               // 2000 modules => 3 chunks: [0..899], [900..1799], [1800..1999]
               data = Array.from({ length: 2000 }, (_, i) => ({
                 id: `m${i}`,
                 nome: `Modulo ${i}`,
                 frente_id: "f1",
                 curso_id: "c1",
                 numero_modulo: i,
                 importancia: "Alta"
               }));
            } else if (table === "cursos") {
               data = [{ id: "c1", nome: "Curso 1" }];
            } else if (table === "cursos_disciplinas") {
               data = [{ curso_id: "c1", disciplina_id: "d1" }];
            } else if (table === "disciplinas") {
               data = [{ id: "d1", nome: "Disciplina 1" }];
            } else if (table === "frentes") {
               data = [{ id: "f1", nome: "Frente 1", disciplina_id: "d1", curso_id: "c1" }];
            } else if (table === "usuarios") {
               data = { id: "user-1", nome_completo: "Prof" };
            }

            resolve({ data, error: null });
          }
        };
        return builder;
      }),
    };
    (databaseModule.getDatabaseClient as jest.Mock).mockReturnValue(mockClient);
  });

  it("measures execution time of getPerformanceFiltered with many modules", async () => {
    const start = Date.now();
    await service.getPerformanceFiltered("user-1", {
      groupBy: "modulo",
      scope: "curso",
      scopeId: "c1",
      period: "anual"
    });
    const duration = Date.now() - start;
    console.log(`Execution time: ${duration}ms`);
  });
});
