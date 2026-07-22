import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Vera — Captación & CRM local',
  description: 'Captación de negocios locales, demos automáticos y seguimiento. 100% local.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,600,700&f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-wash" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, padding: 'clamp(1.5rem, 4vw, 3rem)' }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
