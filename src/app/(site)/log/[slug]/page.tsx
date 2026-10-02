import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';

import Nav from '@/components/Nav';
import StudioModeToggle from '@/components/StudioModeToggle';
import Pager from '@/components/detail/Pager';
import {Block, TextBlock, LinkRow} from '@/components/detail/parts';

import {sanityFetch} from '@/sanity/lib/live';
import {ENTRY_INDEX_QUERY, ENTRY_DETAIL_QUERY} from '@/sanity/queries';
import {formatDate, indexOfSlug, logPath, projectPath} from '@/lib/routes';

type Params = {params: Promise<{slug: string}>};

// Same two-step resolution as /projects/[slug] — see the note there.
async function resolve(slug: string) {
  const {data: index} = await sanityFetch({query: ENTRY_INDEX_QUERY});
  const list = index ?? [];
  const position = indexOfSlug(list, slug);
  if (position === -1) return null;

  const {data: entry} = await sanityFetch({
    query: ENTRY_DETAIL_QUERY,
    params: {id: list[position]._id},
  });
  if (!entry) return null;

  return {entry, list, position};
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const resolved = await resolve((await params).slug);
  if (!resolved) return {title: 'Entry not found'};

  const {entry} = resolved;
  const description = entry.summary || undefined;

  return {
    title: `${entry.title} — Log — Darrell`,
    description,
    openGraph: {type: 'article', title: `${entry.title} — Log`, description},
  };
}

export default async function EntryPage({params}: Params) {
  const {slug} = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  const {entry, list, position} = resolved;

  // The list is newest first, so the entry before this one in time is the
  // next one in the list.
  const older = list[position + 1];
  const newer = list[position - 1];

  const tags = (entry.tags ?? []).filter(Boolean);
  const eyebrow = [formatDate(entry.date), entry.kind, ...tags].filter(Boolean).join(' · ');

  return (
    <>
      <Nav />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/log">
              <span aria-hidden="true">←</span> Log
            </Link>
          </div>

          <header className="detail__head">
            {eyebrow ? <p className="detail__eyebrow detail-reveal">{eyebrow}</p> : null}
            <h1 className="detail__title detail-reveal">{entry.title}</h1>
            {entry.summary ? <p className="detail__lede detail-reveal">{entry.summary}</p> : null}
            <LinkRow primary={{label: 'Open it', href: entry.href}} links={null} />
          </header>

          <div className="detail__body">
            <TextBlock label="Entry" text={entry.body} index={0} />

            {entry.project ? (
              <Block label="Project" index={1}>
                <p>
                  <Link href={projectPath(entry.project)}>{entry.project.title}</Link>
                  {entry.project.status ? ` — ${entry.project.status}` : null}
                </p>
              </Block>
            ) : null}
          </div>

          <Pager
            prev={older ? {href: logPath(older), title: older.title} : null}
            next={newer ? {href: logPath(newer), title: newer.title} : null}
            backHref="/log"
            backLabel="All entries"
          />

          <div className="detail__foot">
            <StudioModeToggle />
          </div>
        </div>
      </main>
    </>
  );
}
