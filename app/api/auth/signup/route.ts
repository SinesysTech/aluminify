import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';

/**
 * Endpoint de cadastro (signup) genérico.
 * 
 * **Uso recomendado:**
 * - Integrações externas e APIs que precisam criar usuários programaticamente
 * - Sistemas de terceiros que consomem a API do sistema educacional
 * - Automações administrativas que criam professores em lote
 * 
 * **Frontend principal:**
 * O frontend da aplicação usa `createClient().auth.signUp()` diretamente
 * no componente ProfessorSignUpForm, não consome esta rota.
 * 
 * **Comportamento:**
 * - Este endpoint SEMPRE cria usuários com role 'professor'
 * - O primeiro professor criado automaticamente recebe role 'superadmin' via trigger de banco
 * - Alunos são criados exclusivamente por professores através da interface administrativa
 * 
 * **Formato da requisição:**
 * ```json
 * {
 *   "email": "professor@example.com",
 *   "password": "senha_segura",
 *   "fullName": "Nome Completo do Professor"
 * }
 * ```
 * 
 * **Formato da resposta:**
 * - Sucesso (201): `{ data: { user, session } }`
 * - Erro (400): `{ error: "mensagem de erro" }`
 * 
 * **Nota importante:**
 * Se houver necessidade de criar outros tipos de usuários via API no futuro,
 * considere adicionar um parâmetro `role` validado apenas para usuários admin
 * que chamam este endpoint, ou criar endpoints separados por tipo de usuário.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Frontend sempre cria professores (não alunos)
    // O primeiro professor será automaticamente superadmin via trigger
    const result = await authService.signUp({
      email: body?.email,
      password: body?.password,
      fullName: body?.fullName,
      role: 'professor', // Sempre professor quando vem do frontend
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

