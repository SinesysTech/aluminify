import { getTeachersForAdminSelector } from "./admin-helpers";

// Mock dependencies
const mockGetAuthenticatedUser = jest.fn();
const mockIsAdminRoleTipo = jest.fn();
const mockGetDatabaseClient = jest.fn();

jest.mock("@/app/shared/core/auth", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

jest.mock("@/app/shared/core/roles", () => ({
  isAdminRoleTipo: (role: string) => mockIsAdminRoleTipo(role),
  isTeachingRoleTipo: jest.fn(),
}));

jest.mock("@/app/shared/core/database/database", () => ({
  getDatabaseClient: () => mockGetDatabaseClient(),
}));

describe("getTeachersForAdminSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw Unauthorized if user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    await expect(getTeachersForAdminSelector("empresa-123")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("should throw Unauthorized if user is not an admin", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      roleType: "aluno",
      empresaId: "empresa-123",
    });
    mockIsAdminRoleTipo.mockReturnValue(false);

    await expect(getTeachersForAdminSelector("empresa-123")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("should throw Unauthorized if user requests different empresaId (cross-tenant)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: "admin-456",
      roleType: "admin",
      empresaId: "empresa-456", // Different from requested
    });
    mockIsAdminRoleTipo.mockReturnValue(true);

    await expect(getTeachersForAdminSelector("empresa-123")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("should return teachers if user is authorized and same tenant", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: "admin-123",
      roleType: "admin",
      empresaId: "empresa-123",
    });
    mockIsAdminRoleTipo.mockReturnValue(true);

    // Mock database response
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockIs = jest.fn().mockReturnThis();
    const mockIn = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: "teacher-1",
          nome_completo: "Teacher One",
          papel_id: "p1",
          papeis: { tipo: "professor" },
        },
      ],
      error: null,
    });

    mockGetDatabaseClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        is: mockIs,
        in: mockIn,
        order: mockOrder,
      }),
    });

    const result = await getTeachersForAdminSelector("empresa-123");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("teacher-1");
    expect(result[0].fullName).toBe("Teacher One");
    expect(mockEq).toHaveBeenCalledWith("empresa_id", "empresa-123");
  });
});
