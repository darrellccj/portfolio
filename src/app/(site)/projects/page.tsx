import type {Metadata} from 'next';
import Link from 'next/link';

import Nav from '@/components/Nav';
import IndexList from '@/components/IndexList';
import StudioModeToggle from '@/components/StudioModeToggle';

import {sanityFetch} from '@/sanity/lib/live';
import {PROJECTS_QUERY} from '@/sanity/queries';
import {projectRow} from '@/lib/rows';

export const metadata: Metadata = {
  title: 'Projects — Darrell',
  description: 'Things made for someone — finished, in progress, parked, and ideas.',
};

export default async function ProjectsPage() {
  const {data} = await sanityFetch({query: PROJECTS_QUERY});
  const projects = data ?? [];

  return (
    <>
      <Nav />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/">
              <span aria-hidden="true">←</span> Home
            </Link>
            <span className="detail__count">{String(projects.length).padStart(2, '0')} projects</span>
          </div>

          <header className="detail__head">
            <p className="detail__eyebrow">Projects</p>
            <h1 className="detail__title">Things made for someone.</h1>
            <p className="detail__lede">
              Finished first, then in progress, parked, and ideas. Most of these are unfinished,
              and each one says so.
            </p>
          </header>
        </div>

        <IndexList rows={projects.map(projectRow)} empty="No projects yet." />

        <div className="detail__foot">
          <StudioModeToggle />
        </div>
      </main>
    </>
  );
}
