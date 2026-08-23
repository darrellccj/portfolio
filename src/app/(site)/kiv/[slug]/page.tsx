import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';

import Nav from '@/components/Nav';
import Contact from '@/components/Contact';
import Pager from '@/components/detail/Pager';
import {Block, TextBlock, Spec, Notes} from '@/components/detail/parts';

import {sanityFetch} from '@/sanity/lib/live';
import {PROFILE_QUERY, KIV_INDEX_QUERY, KIV_DETAIL_QUERY} from '@/sanity/queries';
import {indexOfSlug, kivPath} from '@/lib/routes';

type Params = {params: Promise<{slug: string}>};

// Same two-step resolution as /work/[slug] — see the note there.
async function resolve(slug: string) {
  const {data: index} = await sanityFetch({query: KIV_INDEX_QUERY});
  const list = index ?? [];
  const position = indexOfSlug(list, slug);
  if (position === -1) return null;

  const {data: item} = await sanityFetch({
    query: KIV_DETAIL_QUERY,
    params: {id: list[position]._id},
  });
  if (!item) return null;

  return {item, list, position};
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const resolved = await resolve((await params).slug);
  if (!resolved) return {title: 'Concept not found'};

  const {item} = resolved;
  const description = item.premise || item.desc || undefined;

  return {
    title: `${item.title} — KIV — Darrell`,
    description,
    openGraph: {type: 'article', title: `${item.title} — KIV`, description},
  };
}

export default async function KivPage({params}: Params) {
  const {slug} = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  const {item, list, position} = resolved;
  const {data: profile} = await sanityFetch({query: PROFILE_QUERY});

  const prev = list[position - 1];
  const next = list[position + 1];

  const sections = item.sections ?? [];
  const notes = (item.notes ?? []).filter(Boolean);
  const questions = (item.openQuestions ?? []).filter(Boolean);
  const eyebrow = [item.tag, item.status].filter(Boolean).join(' · ');

  const hasNarrative = Boolean(
    item.premise || item.why || notes.length || questions.length || sections.length,
  );

  return (
    <>
      <Nav alwaysSolid />
      <main className="detail detail--kiv">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/#kiv">
              <span aria-hidden="true">←</span> Keep in vault
            </Link>
            <span className="detail__count">
              K{String(position + 1).padStart(2, '0')} / K{String(list.length).padStart(2, '0')}
            </span>
          </div>

          <header className="detail__head">
            {eyebrow ? <p className="detail__eyebrow detail-reveal">{eyebrow}</p> : null}
            <h1 className="detail__title detail-reveal">{item.title}</h1>
            {item.desc ? <p className="detail__lede detail-reveal">{item.desc}</p> : null}
          </header>

          <Spec
            items={[
              {label: 'Would build with', value: item.stack},
            ]}
          />

          <div className="detail__body">
            <TextBlock label="Premise" text={item.premise} index={0} />
            <TextBlock label="Why" text={item.why} index={1} />

            {notes.length ? (
              <Block label="Notes" index={2}>
                <Notes items={notes} />
              </Block>
            ) : null}

            {questions.length ? (
              <Block label="Open questions" index={3}>
                <Notes items={questions} ordered />
              </Block>
            ) : null}

            {sections.map((section, i) => (
              <TextBlock
                key={section.heading ?? i}
                label={section.heading}
                text={section.body}
                index={4 + i}
              />
            ))}

            {hasNarrative ? null : (
              <Block label="Note">
                <p className="prose__aside">
                  Nothing written down yet beyond the line above — that is rather the point of
                  the vault.
                </p>
              </Block>
            )}
          </div>

          <Pager
            prev={prev ? {href: kivPath(prev), title: prev.title} : null}
            next={next ? {href: kivPath(next), title: next.title} : null}
            backHref="/#kiv"
            backLabel="All concepts"
          />
        </div>
      </main>
      {profile ? <Contact profile={profile} label="Contact" /> : null}
    </>
  );
}
