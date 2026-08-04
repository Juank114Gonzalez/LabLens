import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route gate placeholder.
 *
 * Access tokens live in client storage for the mock auth phase.
 * When the backend issues HttpOnly refresh cookies + SSR session cookies,
 * validate them here and redirect unauthenticated users server-side.
 *
 * TODO(backend): read session/refresh cookie and enforce auth at the edge.
 */
export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inbox/:path*',
    '/chat/:path*',
    '/evaluations/:path*',
    '/admin/:path*',
    '/initiatives/:path*',
  ],
};
