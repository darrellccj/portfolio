import type {Metadata} from 'next';
import Link from 'next/link';

import Nav from '@/components/Nav';
import DitherStudio from '@/components/DitherStudio';

import {sanityFetch} from '@/sanity/lib/live';
import {DITHER_QUERY} from '@/sanity/queries';

export const metadata: Metadata = {
  title: 'A small dithering study — Darrell',
  description:
    'Ordered dither, error diffusion, halftone, and noise — toggle the technique, matrix size, contrast, and colors on the site plate or your own photo.',
};

export default async function DitherPage() {
  const {data: dither} = await sanityFetch({query: DITHER_QUERY});

  return (
    <>
      <Nav />
      <main className="dither-page-main">
        <div className="dither-page__inner">
          <div className="dither-page__top">
            <Link className="detail__back" href="/">
              <span aria-hidden="true">←</span> Home
            </Link>
          </div>

          <header className="dither-page__head">
            <p className="study__label">04 / Study</p>
            <h1 className="study__title">A small dithering study</h1>
            <p className="study__sub">
              Toggle the technique, matrix size, contrast, and colors below — or drop in your own
              photo.
            </p>
          </header>

          <DitherStudio copy={dither ?? {}} />
        </div>
      </main>
    </>
  );
}
