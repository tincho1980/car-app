import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { RegisterServiceWorker } from '@/components/register-sw';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'carApp',
  description: 'Historial de mantenimiento y avisos de tus autos, por km o por tiempo.',
  applicationName: 'carApp',
  appleWebApp: { capable: true, title: 'carApp', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Mismo valor que --bg en claro y en oscuro.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F4F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0F12' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* use-credentials: así el preview protegido de Vercel también entrega el manifest. */}
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
