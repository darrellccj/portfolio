import type {Metadata, Viewport} from 'next';
import {Instrument_Serif, IBM_Plex_Mono} from 'next/font/google';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
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
    images: ['/og-image.png'],
  },
  twitter: {card: 'summary_large_image'},
  // Two-ink registration cross, inlined so it costs no extra request.
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%239fd4f7'/%3E%3Cpath d='M16 6v20M6 16h20' stroke='%230d3372' stroke-width='2.5' stroke-linecap='square'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {themeColor: '#9fd4f7'};

// The font classes only declare CSS custom properties, so they cost the
// Studio nothing; the rules that consume them live in globals.css, which
// is loaded by the (site) layout alone.
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
