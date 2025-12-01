import { updateSession } from '@/lib/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/chat/attachments')) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
