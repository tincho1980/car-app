import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { requireUser } from '@/server/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Segunda barrera además del proxy.
  await requireUser().catch(() => redirect('/login'));

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-[430px] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
