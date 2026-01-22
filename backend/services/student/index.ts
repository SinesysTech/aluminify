import { SupabaseClient } from '@supabase/supabase-js';
import { getDatabaseClient } from '@/backend/clients/database';
import { StudentRepositoryImpl } from './student.repository';
import { StudentService } from './student.service';
import { StudentImportService } from './student-import.service';
import { StudentTransferRepositoryImpl } from './student-transfer.repository';
import { StudentTransferService } from './student-transfer.service';

/**
 * Factory function para criar StudentService com cliente Supabase específico.
 * Use esta função quando precisar que as RLS policies sejam aplicadas
 * (ex: em páginas de dashboard, APIs com contexto de usuário).
 *
 * @param client - Cliente Supabase com contexto do usuário autenticado
 * @returns Instância de StudentService que respeita RLS
 */
export function createStudentService(client: SupabaseClient): StudentService {
  const repository = new StudentRepositoryImpl(client);
  return new StudentService(repository);
}

/**
 * Factory function para criar StudentImportService com cliente Supabase específico.
 *
 * @param client - Cliente Supabase com contexto do usuário autenticado
 * @returns Instância de StudentImportService que respeita RLS
 */
export function createStudentImportService(client: SupabaseClient): StudentImportService {
  const studentService = createStudentService(client);
  return new StudentImportService(studentService);
}

/**
 * Factory function para criar StudentTransferService com cliente Supabase específico.
 * Use esta função para operações de transferência em massa de alunos.
 *
 * @param client - Cliente Supabase com contexto do usuário autenticado
 * @returns Instância de StudentTransferService que respeita RLS
 */
export function createStudentTransferService(client: SupabaseClient): StudentTransferService {
  const repository = new StudentTransferRepositoryImpl(client);
  return new StudentTransferService(repository);
}

// === ADMIN SERVICES (bypassa RLS - usar apenas em contextos seguros) ===

let _adminStudentService: StudentService | null = null;
let _adminStudentImportService: StudentImportService | null = null;

/**
 * @deprecated Use createStudentService(client) com cliente do usuário para respeitar RLS.
 * Este service usa admin client e BYPASSA todas as RLS policies.
 * Use apenas para: migrations, scripts de manutenção, ou quando explicitamente necessário.
 */
function getAdminStudentService(): StudentService {
  if (!_adminStudentService) {
    const databaseClient = getDatabaseClient();
    const repository = new StudentRepositoryImpl(databaseClient);
    _adminStudentService = new StudentService(repository);
  }
  return _adminStudentService;
}

/**
 * @deprecated Use createStudentImportService(client) com cliente do usuário para respeitar RLS.
 */
function getAdminStudentImportService(): StudentImportService {
  if (!_adminStudentImportService) {
    _adminStudentImportService = new StudentImportService(getAdminStudentService());
  }
  return _adminStudentImportService;
}

/**
 * @deprecated Use createStudentService(client) com cliente do usuário para respeitar RLS.
 * Este proxy usa admin client e BYPASSA todas as RLS policies.
 */
export const studentService = new Proxy({} as StudentService, {
  get(_target, prop) {
    return getAdminStudentService()[prop as keyof StudentService];
  },
});

/**
 * @deprecated Use createStudentImportService(client) com cliente do usuário para respeitar RLS.
 * Este proxy usa admin client e BYPASSA todas as RLS policies.
 */
export const studentImportService = new Proxy({} as StudentImportService, {
  get(_target, prop) {
    return getAdminStudentImportService()[prop as keyof StudentImportService];
  },
});

export * from './student.types';
export * from './student.service';
export * from './student.repository';
export * from './errors';
export * from './student-import.service';
export * from './student-transfer.types';
export * from './student-transfer.repository';
export * from './student-transfer.service';

