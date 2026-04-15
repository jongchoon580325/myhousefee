import { NextResponse } from 'next/server';

export function middleware() {
  const response = NextResponse.next();

  // Set COOP header to allow Google OAuth popups
  // Only set COOP, remove restrictive COEP that breaks OAuth
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: ['/:path*'],
};
