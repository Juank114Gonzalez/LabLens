import type { Metadata } from 'next';
import { IBM_Plex_Mono, Manrope, Sora } from 'next/font/google';
import { AppProviders } from '@/shared/components/app-providers';
import { branding } from '@/config/branding';
import '@/styles/globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: `${branding.name} · ${branding.tagline}`,
    template: `%s · ${branding.name}`,
  },
  description: branding.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${sora.variable} ${plexMono.variable} min-h-svh font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
