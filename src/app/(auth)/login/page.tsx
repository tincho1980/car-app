import { redirect } from 'next/navigation';
import { Gauge, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signIn } from '@/server/auth';

// Frame 01 del diseño.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  if (await auth()) redirect(redirectTo);

  async function signInWithGoogle() {
    'use server';
    await signIn('google', { redirectTo });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-7 pt-28 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="flex size-16 items-center justify-center rounded-card bg-accent text-primary-foreground">
        <Gauge className="size-8" />
      </div>
      <h1 className="mt-6 text-[40px] leading-[1.05] font-bold tracking-tight">
        Tu auto,
        <br />
        al día.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-text-2">
        Historial de mantenimiento y avisos antes de que algo venza: por kilómetros o por tiempo, lo
        que llegue primero.
      </p>

      <div className="mt-auto">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-field bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {error === 'AccessDenied'
              ? 'Esa cuenta de Google no tiene acceso.'
              : 'No se pudo iniciar sesión. Probá de nuevo.'}
          </p>
        )}
        <form action={signInWithGoogle}>
          <Button type="submit" variant="secondary">
            <LogIn />
            Entrar con Google
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-text-3">
          Acceso privado · solo la cuenta autorizada
        </p>
      </div>
    </main>
  );
}

// Solo rutas internas: evita redirigir a otro sitio con ?callbackUrl=.
function safeCallbackUrl(url: string | undefined): string {
  return url?.startsWith('/') && !url.startsWith('//') ? url : '/';
}
