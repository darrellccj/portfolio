import type {Metadata} from 'next';
import Link from 'next/link';

import Nav from '@/components/Nav';
import IndexList from '@/components/IndexList';
import StudioModeToggle from '@/components/StudioModeToggle';

import {sanityFetch} from '@/sanity/lib/live';
import {ENTRIES_QUERY} from '@/sanity/queries';
import {entryRow} from '@/lib/rows';

export const metadata: Metadata = {
  title: 'Log — Darrell',
  description: 'Dated notes, experiments, project updates and checkpoints.',
};

export default async function LogPage() {
  const {data} = await sanityFetch({query: ENTRIES_QUERY});
  const entries = data ?? [];

  return (
    <>
      <Nav />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/">
              <span aria-hidden="true">←</span> Home
            </Link>
            <span className="detail__count">{String(entries.length).padStart(2, '0')} entries</span>
          </div>

          <header className="detail__head">
            <p className="detail__eyebrow">Log</p>
            <h1 className="detail__title">What I made, tried and noticed.</h1>
            <p className="detail__lede">
              Notes, experiments, project updates and quarterly checkpoints, newest first.
            </p>
          </header>
        </div>

        <IndexList rows={entries.map(entryRow)} empty="Nothing logged yet." />

        <div className="detail__foot">
          <StudioModeToggle />
        </div>
      </main>
    </>
  );
}
