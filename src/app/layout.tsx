import type {Metadata, Viewport} from 'next';
import {Inter, IBM_Plex_Mono} from 'next/font/google';

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
  icons: {icon: '/favicon.png'},
};

export const viewport: Viewport = {themeColor: '#9ae7ff'};

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
