import type {Metadata, Viewport} from 'next';
import {Inter, IBM_Plex_Mono, Instrument_Serif, Archivo, Geist} from 'next/font/google';

const serif = Inter({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

// 2026 redesign — the home page's own type system. Serif/mono above
// stay loaded as-is for Lab and the project/KIV detail pages, which keep
// the original manifest look until they're redesigned in turn.
const script = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-script',
  display: 'swap',
});

const display = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const description =
  'Portfolio of Darrell — building software for institutions without a tech team, niches that are underserved, and problems in his own life. AI-assisted, usually solo. Selected work and concepts in progress.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Darrell — Independent Technologist',
  description,
  openGraph: {
    type: 'website',
    title: 'Darrell — Independent Technologist',
    description,
  },
  twitter: {card: 'summary_large_image'},
  icons: {icon: '/favicon.png'},
};

export const viewport: Viewport = {themeColor: '#F5F2EA'};

// The font classes only declare CSS custom properties, so they cost the
// Studio nothing; the rules that consume them live in globals.css, which
// is loaded by the (site) layout alone.
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable} ${script.variable} ${display.variable} ${ui.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
