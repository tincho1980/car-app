import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';

// Solo verifica la cookie de sesión (JWT): nunca consulta la base.
export const proxy = auth((req) => {
  if (req.auth) return NextResponse.next();

  const login = new URL('/login', req.nextUrl);
  login.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
});

export const config = {
  // Todo pasa por el proxy salvo el login, la auth, el health, la PWA y los estáticos.
  matcher: [
    '/((?!login|api/auth|api/health|manifest\\.webmanifest|sw\\.js|icons/|icon\\.png|apple-icon\\.png|_next/).*)',
  ],
};
