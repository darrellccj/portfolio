import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';

import Nav from '@/components/Nav';
import Pager from '@/components/detail/Pager';
import {Block, TextBlock, Spec, Notes, Plate, LinkRow} from '@/components/detail/parts';

import {sanityFetch} from '@/sanity/lib/live';
import {PROJECT_INDEX_QUERY, PROJECT_DETAIL_QUERY} from '@/sanity/queries';
import {formatDate, indexOfSlug, logPath, projectPath} from '@/lib/routes';

type Params = {params: Promise<{slug: string}>};

// The index is resolved in the app rather than by GROQ because `slug` was
// added to the schema after these documents existed: `entrySlug` falls back
// to a slugified title for anything that has not been given one yet (see
// src/lib/routes.ts). It also hands us the previous/next neighbours for
// free, since it is already the ordered list.
async function resolve(slug: string) {
  const {data: index} = await sanityFetch({query: PROJECT_INDEX_QUERY});
  const list = index ?? [];
  const position = indexOfSlug(list, slug);
  if (position === -1) return null;

  const {data: project} = await sanityFetch({
    query: PROJECT_DETAIL_QUERY,
    params: {id: list[position]._id},
  });
  if (!project) return null;

  return {project, list, position};
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const resolved = await resolve((await params).slug);
  if (!resolved) return {title: 'Project not found'};

  const {project} = resolved;
  const description = project.desc || project.need || project.standing || undefined;

  return {
    title: `${project.title} — Darrell`,
    description,
    openGraph: {
      type: 'article',
      title: `${project.title} — Darrell`,
      description,
      images: project.cover?.url ? [project.cover.url] : undefined,
    },
  };
}

export default async function ProjectPage({params}: Params) {
  const {slug} = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  const {project, list, position} = resolved;

  const prev = list[position - 1];
  const next = list[position + 1];

  const sections = project.sections ?? [];
  const gallery = (project.gallery ?? []).filter((plate) => plate?.url);
  const questions = (project.openQuestions ?? []).filter(Boolean);
  const notes = (project.notes ?? []).filter(Boolean);
  const entries = project.entries ?? [];
  const eyebrow = [project.status, project.tag, project.year].filter(Boolean).join(' · ');

  // A finished project gets the write-up (docs/direction.md); an idea or a
  // parked one gets a few honest lines about where it stands. Both sets are
  // optional, so render whichever exists rather than switching on status.
  const writeup = [
    {label: 'The need', text: project.need},
    {label: 'Their requirements', text: project.requirements},
    {label: 'Where my judgement differed', text: project.judgement},
    {label: 'Decisions and trade-offs', text: project.decisions},
    {label: 'What I would change', text: project.change},
    {label: 'Where it stands', text: project.standing},
    ...sections.map((section) => ({label: section.heading, text: section.body})),
  ].filter((block) => block.text?.trim());

  const hasNarrative = Boolean(writeup.length || questions.length || notes.length);

  return (
    <>
      <Nav />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/projects">
              <span aria-hidden="true">←</span> Projects
            </Link>
            <span className="detail__count">
              {String(position + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
            </span>
          </div>

          <header className="detail__head">
            {eyebrow ? <p className="detail__eyebrow detail-reveal">{eyebrow}</p> : null}
            <h1 className="detail__title detail-reveal">{project.title}</h1>
            {project.desc ? <p className="detail__lede detail-reveal">{project.desc}</p> : null}
            <LinkRow primary={{label: 'Visit project', href: project.href}} links={project.links} />
          </header>

          <Plate image={project.cover} priority sizes="100vw" />

          <Spec items={[{label: 'Timeline', value: project.timeline}]} />

          <div className="detail__body">
            {writeup.map((block, i) => (
              <TextBlock key={block.label ?? i} label={block.label} text={block.text} index={i} />
            ))}

            {questions.length ? (
              <Block label="Open questions" index={writeup.length}>
                <Notes items={questions} ordered />
              </Block>
            ) : null}

            {notes.length ? (
              <Block label="Notes" index={writeup.length + 1}>
                <Notes items={notes} />
              </Block>
            ) : null}

            {hasNarrative ? null : (
              <Block label="Note">
                <p className="prose__aside">
                  Nothing written about this one yet beyond the line above.
                </p>
              </Block>
            )}

            {entries.length ? (
              <Block label="In the log" index={writeup.length + 2}>
                <ul className="d-notes">
                  {entries.map((entry) => (
                    <li key={entry._id}>
                      <Link href={logPath(entry)}>
                        {formatDate(entry.date)} — {entry.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}
          </div>

          {gallery.length ? (
            <div className="detail__gallery">
              {gallery.map((plate, i) => (
                <Plate key={plate.url ?? i} image={plate} />
              ))}
            </div>
          ) : null}

          <Pager
            prev={prev ? {href: projectPath(prev), title: prev.title} : null}
            next={next ? {href: projectPath(next), title: next.title} : null}
            backHref="/projects"
            backLabel="All projects"
          />

        </div>
      </main>
    </>
  );
}
