import { updateSession } from '@/lib/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/api/chat/callback', // Callback do N8N - deve ser público
  ]

  // Verificar se a rota atual é pública
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Se for uma rota pública, permitir acesso sem autenticação
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Para todas as outras rotas, aplicar autenticação do Supabase
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
