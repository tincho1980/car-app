'use client';

import { useEffect } from 'react';

// Registra public/sw.js: hace la app instalable y en F07 recibe las notificaciones push.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
