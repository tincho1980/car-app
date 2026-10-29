'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CircleCheck } from 'lucide-react';

// Toast tras guardar (frame 09), con "Deshacer". Se va solo a los 8 s y limpia ?evento= de la URL.
export function SavedToast({
  title,
  detail,
  undo,
}: {
  title: string;
  detail: string;
  undo: () => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace(pathname, { scroll: false });
    }, 8_000);
    return () => clearTimeout(timer);
  }, [router, pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[398px] items-center gap-3 rounded-row bg-odo p-4 text-odo-text shadow-lg"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ok text-odo-text">
        <CircleCheck className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block truncate text-sm text-text-3">{detail}</span>
      </span>
      <form action={undo}>
        <button type="submit" className="px-1 text-[15px] font-semibold text-accent">
          Deshacer
        </button>
      </form>
    </div>
  );
}
