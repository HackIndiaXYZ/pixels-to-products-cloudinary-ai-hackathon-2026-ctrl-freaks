import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'RAW → REUSE', template: '%s · RAW → REUSE' },
  description: 'Discover what a construction site can save before it becomes waste.',
  openGraph: {
    title: 'RAW → REUSE',
    description: 'Discover what a construction site can save before it becomes waste.',
  },
};

export const viewport: Viewport = { themeColor: '#0f0e0c' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-ink-950"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b hairline bg-ink-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="font-mono text-[13px] font-medium uppercase tracking-[0.2em] text-bone-50">
              Raw <span className="text-accent">→</span> Reuse
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
              <Link href="/projects" className="rounded-md px-3 py-1.5 text-bone-300 transition-colors hover:bg-ink-800 hover:text-bone-50">
                Projects
              </Link>
              <Link
                href="/projects/new"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-ink-950 transition-colors hover:bg-accent-strong"
              >
                New project
              </Link>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          {children}
        </main>
      </body>
    </html>
  );
}
