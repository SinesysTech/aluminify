import { updateSession } from '@/lib/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  // A rota de anexos usa token na URL, não precisa de autenticação de sessão
  if (request.nextUrl.pathname.startsWith('/api/chat/attachments')) {
    // Permitir acesso direto sem verificação de sessão
    // Retornar resposta vazia para permitir que a requisição continue
    return NextResponse.next()
  }

  // Aplicar autenticação do Supabase em todas as outras rotas
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}





