import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';

/**
 * Endpoint de login (signin) genérico.
 * 
 * **Uso recomendado:**
 * - Integrações externas e APIs que precisam autenticar programaticamente
 * - Sistemas de terceiros que consomem a API do sistema educacional
 * 
 * **Frontend principal:**
 * O frontend da aplicação usa `createClient().auth.signInWithPassword()` diretamente
 * nos componentes AlunoLoginForm e ProfessorLoginForm, não consome esta rota.
 * 
 * **Formato da resposta:**
 * - Sucesso (200): `{ data: { user, session } }`
 * - Erro (401): `{ error: "mensagem de erro" }`
 * 
 * **Validação de role:**
 * Este endpoint não valida role - aceita qualquer usuário (aluno ou professor).
 * A validação de permissões deve ser feita nas rotas protegidas subsequentes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await authService.signIn({
      email: body?.email,
      password: body?.password,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

