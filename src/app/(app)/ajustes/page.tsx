import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireUser, signOut } from '@/server/auth';

// Ajustes: por ahora solo la cuenta. Notificaciones en F07, export en F11.
export default async function SettingsPage() {
  const { ownerId } = await requireUser();

  async function logOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <section className="mt-6">
        <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Cuenta</h2>
        <div className="mt-2 rounded-card border border-border bg-surface p-5">
          <p className="text-sm text-text-2">Entraste como</p>
          <p className="mt-0.5 font-semibold break-all">{ownerId}</p>
          <form action={logOut} className="mt-5">
            <Button type="submit" variant="secondary">
              <LogOut />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
