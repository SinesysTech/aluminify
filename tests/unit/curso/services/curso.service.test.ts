import { CursoService } from "@/app/[tenant]/(modules)/curso/services/curso.service";
import { CursoRepository } from "@/app/[tenant]/(modules)/curso/services/curso.repository";
import { CreateCursoInput, Modality, CourseType } from "@/app/[tenant]/(modules)/curso/services/curso.types";
import { CourseValidationError } from "@/app/[tenant]/(modules)/curso/services/errors";

// Mock implementation of CursoRepository
const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  findByEmpresa: jest.fn(),
  segmentExists: jest.fn(),
  disciplineExists: jest.fn(),
  setCourseDisciplines: jest.fn(),
  getCourseDisciplines: jest.fn(),
  getExistingDisciplineIds: jest.fn(),
} as unknown as jest.Mocked<CursoRepository>;

describe("CursoService", () => {
  let service: CursoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CursoService(mockRepository);
  });

  describe("create", () => {
    const validPayload: CreateCursoInput = {
      empresaId: "empresa-1",
      name: "Curso Teste",
      modality: "EAD" as Modality,
      type: "Extensivo" as CourseType,
      year: 2024,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      disciplineIds: ["disc-1", "disc-2"],
    };

    it("should validate disciplines using batch query (optimized behavior)", async () => {
        // Mock batch check
        mockRepository.getExistingDisciplineIds.mockResolvedValue(["disc-1", "disc-2"]);
        mockRepository.create.mockResolvedValue({ id: "course-1", ...validPayload } as any);

        await service.create(validPayload);

        expect(mockRepository.getExistingDisciplineIds).toHaveBeenCalledTimes(1);
        // We might need to check if the order matters or if Set logic reorders.
        // Assuming implementation keeps order or we match content.
        expect(mockRepository.getExistingDisciplineIds).toHaveBeenCalledWith(expect.arrayContaining(["disc-1", "disc-2"]));

        // Should not call individual check
        expect(mockRepository.disciplineExists).not.toHaveBeenCalled();
    });

    it("should throw error if a discipline does not exist", async () => {
        // Return only disc-1 as existing
        mockRepository.getExistingDisciplineIds.mockResolvedValue(["disc-1"]);

        await expect(service.create(validPayload)).rejects.toThrow(CourseValidationError);
        await expect(service.create(validPayload)).rejects.toThrow('Discipline with id "disc-2" does not exist');
    });

    it("should normalize and deduplicate hotmartProductIds before calling repository", async () => {
      mockRepository.getExistingDisciplineIds.mockResolvedValue(["disc-1", "disc-2"]);
      mockRepository.create.mockResolvedValue({ id: "course-1", ...validPayload } as any);

      await service.create({
        ...validPayload,
        hotmartProductIds: [" 7135950 ", "6706317", "7135950", "", "  "],
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hotmartProductIds: ["7135950", "6706317"],
        }),
      );
    });

    it("should support legacy hotmartProductId by converting to hotmartProductIds", async () => {
      mockRepository.getExistingDisciplineIds.mockResolvedValue(["disc-1", "disc-2"]);
      mockRepository.create.mockResolvedValue({ id: "course-1", ...validPayload } as any);

      await service.create({
        ...validPayload,
        hotmartProductId: "6706317",
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hotmartProductIds: ["6706317"],
        }),
      );
    });
  });
});
