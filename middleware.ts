import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a client-side only middleware since we're using localStorage
// It provides an additional layer of protection for routes
export function middleware(request: NextRequest) {
  // Note: This middleware runs on the server and cannot access localStorage
  // However, we can use it for server-side cookies in the future
  
  // For now, we'll just add security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
