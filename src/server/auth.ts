import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { env } from '@/env';
import { isAllowedEmail } from '@/server/allowed-email';

// Sesión JWT sin adapter: la auth no toca Mongo (docs/03-arquitectura.md D-05).
// Las credenciales de Google y AUTH_SECRET las lee Auth.js de las variables AUTH_*.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    signIn({ profile }) {
      return profile?.email_verified === true && isAllowedEmail(profile.email, env.ALLOWED_EMAIL);
    },
  },
});

export type User = { ownerId: string };

// Segunda barrera en cada Server Action, Route Handler y layout privado: no alcanza con el proxy.
export async function requireUser(): Promise<User> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAllowedEmail(email, env.ALLOWED_EMAIL)) {
    throw new Error('No autorizado');
  }
  return { ownerId: email };
}
