import LoadingScreen from '@/components/LoadingScreen';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import IndexList from '@/components/IndexList';
import Contact from '@/components/Contact';

import {sanityFetch} from '@/sanity/lib/live';
import {PROFILE_QUERY, PROJECTS_QUERY, LATEST_ENTRIES_QUERY} from '@/sanity/queries';
import {entryRow, projectRow} from '@/lib/rows';

// Sanity is the sole source of truth — content is authored in the
// embedded Studio at /studio. The profile singleton is required: failing
// loudly beats rendering a page with holes in it.
//
// Order follows docs/direction.md: the statement and open questions, then
// the newest log entries (dated, so a quiet month shows), then projects.
export default async function Home() {
  const [profileRes, projectsRes, entriesRes] = await Promise.all([
    sanityFetch({query: PROFILE_QUERY}),
    sanityFetch({query: PROJECTS_QUERY}),
    sanityFetch({query: LATEST_ENTRIES_QUERY}),
  ]);

  const profile = profileRes.data;
  if (!profile) throw new Error('Sanity: no `profile` document. Create it at /studio.');

  const entries = entriesRes.data ?? [];
  const projects = projectsRes.data ?? [];

  return (
    <>
      {/* Home only — the signature draw-on introduces the site, so it must
          not replay every time you come back from another page. */}
      <LoadingScreen />
      <Nav />
      <main className="home">
        <Hero profile={profile} />
        <IndexList
          id="log"
          label="Log"
          title="Latest"
          rows={entries.map(entryRow)}
          empty="Nothing logged yet."
          more={entries.length ? {href: '/log', label: 'All entries'} : null}
        />
        <IndexList
          id="projects"
          label="Projects"
          title="Things made for someone"
          rows={projects.map(projectRow)}
          empty="No projects yet."
        />
        <Contact profile={profile} />
      </main>
    </>
  );
}
