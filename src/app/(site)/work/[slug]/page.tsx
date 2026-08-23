import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';

import Nav from '@/components/Nav';
import Contact from '@/components/Contact';
import Pager from '@/components/detail/Pager';
import {Block, TextBlock, Spec, Metrics, Plate, LinkRow} from '@/components/detail/parts';

import {sanityFetch} from '@/sanity/lib/live';
import {PROFILE_QUERY, PROJECT_INDEX_QUERY, PROJECT_DETAIL_QUERY} from '@/sanity/queries';
import {indexOfSlug, projectPath} from '@/lib/routes';

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
  const description = project.overview || project.desc || undefined;

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
  const {data: profile} = await sanityFetch({query: PROFILE_QUERY});

  const prev = list[position - 1];
  const next = list[position + 1];

  const sections = project.sections ?? [];
  const gallery = (project.gallery ?? []).filter((plate) => plate?.url);
  const eyebrow = [project.tag, project.year, project.status].filter(Boolean).join(' · ');

  // Long-form fields are all optional, so a project can legitimately have
  // nothing below the fold yet. Say so plainly rather than ending the page
  // on an unexplained gap.
  const hasNarrative = Boolean(
    project.overview || project.problem || project.approach || project.outcome || sections.length,
  );

  return (
    <>
      <Nav alwaysSolid />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/#work">
              <span aria-hidden="true">←</span> Selected work
            </Link>
            <span className="detail__count">
              {String(position + 1).padStart(3, '0')} / {String(list.length).padStart(3, '0')}
            </span>
          </div>

          <header className="detail__head">
            {eyebrow ? <p className="detail__eyebrow detail-reveal">{eyebrow}</p> : null}
            <h1 className="detail__title detail-reveal">{project.title}</h1>
            {project.desc ? <p className="detail__lede detail-reveal">{project.desc}</p> : null}
            <LinkRow primary={{label: 'Visit project', href: project.href}} links={project.links} />
          </header>

          <Plate image={project.cover} priority sizes="(max-width: 1120px) 100vw, 1120px" />

          <Spec
            items={[
              {label: 'Role', value: project.role},
              {label: 'Timeline', value: project.timeline},
              {label: 'Built with', value: project.stack},
            ]}
          />

          <Metrics items={project.metrics} />

          <div className="detail__body">
            <TextBlock label="Overview" text={project.overview} index={0} />
            <TextBlock label="Problem" text={project.problem} index={1} />
            <TextBlock label="Approach" text={project.approach} index={2} />
            <TextBlock label="Outcome" text={project.outcome} index={3} />
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
                  The write-up for this one is still being written. The short version is above.
                </p>
              </Block>
            )}
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
            backHref="/#work"
            backLabel="All work"
          />
        </div>
      </main>
      {profile ? <Contact profile={profile} label="Contact" /> : null}
    </>
  );
}
