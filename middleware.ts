import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set COOP header to allow Google OAuth popups
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: ['/:path*'],
};
