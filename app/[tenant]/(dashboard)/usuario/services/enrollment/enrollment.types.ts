export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
  accessStartDate: Date;
  accessEndDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
  accessStartDate?: string;
  accessEndDate: string;
  active?: boolean;
}

export interface UpdateEnrollmentInput {
  accessStartDate?: string;
  accessEndDate?: string;
  active?: boolean;
}

