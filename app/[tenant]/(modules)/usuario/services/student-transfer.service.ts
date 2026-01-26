import { SupabaseClient } from "@supabase/supabase-js";
import {
  StudentTransferRepository,
  StudentTransferRepositoryImpl,
} from "./student-transfer.repository";
import { BulkTransferResult } from "./student-transfer.types";

export class StudentTransferService {
  constructor(private readonly repository: StudentTransferRepository) {}

  async getTurmasByCourse(courseId: string) {
    return this.repository.getTurmasByCourse(courseId);
  }

  async getStudentsByCourse(courseId: string) {
    return this.repository.getStudentsByCourse(courseId);
  }

  async getStudentsByTurma(turmaId: string) {
    return this.repository.getStudentsByTurma(turmaId);
  }

  async bulkTransferBetweenCourses(params: {
    studentIds: string[];
    sourceCourseId: string;
    targetCourseId: string;
    options?: any;
  }): Promise<BulkTransferResult> {
    try {
      await this.repository.transferBetweenCourses(params);
      return {
        total: params.studentIds.length,
        success: params.studentIds.length,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      console.error("Error in bulk transfer courses:", error);
      return {
        total: params.studentIds.length,
        success: 0,
        failed: params.studentIds.length,
        errors: params.studentIds.map((id) => ({
          studentId: id,
          error: (error as Error).message,
        })),
      };
    }
  }

  async bulkTransferBetweenTurmas(params: {
    studentIds: string[];
    sourceTurmaId: string;
    targetTurmaId: string;
    sourceStatusOnTransfer?: string;
  }): Promise<BulkTransferResult> {
    try {
      await this.repository.transferBetweenTurmas(params);
      return {
        total: params.studentIds.length,
        success: params.studentIds.length,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      console.error("Error in bulk transfer turmas:", error);
      return {
        total: params.studentIds.length,
        success: 0,
        failed: params.studentIds.length,
        errors: params.studentIds.map((id) => ({
          studentId: id,
          error: (error as Error).message,
        })),
      };
    }
  }
}

export function createStudentTransferService(
  client: SupabaseClient,
): StudentTransferService {
  const repository = new StudentTransferRepositoryImpl(client);
  return new StudentTransferService(repository);
}
