import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Work from '@/components/Work';
import Kiv from '@/components/Kiv';
import Dither from '@/components/Dither';
import Contact from '@/components/Contact';

import {sanityFetch} from '@/sanity/lib/live';
import {PROFILE_QUERY, PROJECTS_QUERY, KIV_QUERY, DITHER_QUERY} from '@/sanity/queries';

// Sanity is the sole source of truth — content is authored in the
// embedded Studio at /studio. The singletons are required: failing loudly
// beats rendering a page with holes in it.
export default async function Home() {
  const [profileRes, projectsRes, kivRes, ditherRes] = await Promise.all([
    sanityFetch({query: PROFILE_QUERY}),
    sanityFetch({query: PROJECTS_QUERY}),
    sanityFetch({query: KIV_QUERY}),
    sanityFetch({query: DITHER_QUERY}),
  ]);

  const profile = profileRes.data;
  const dither = ditherRes.data;

  if (!profile) throw new Error('Sanity: no `profile` document. Create it at /studio.');
  if (!dither) throw new Error('Sanity: no `ditherStudy` document. Create it at /studio.');

  return (
    <>
      <Nav name={profile.name} />
      <main>
        <Hero profile={profile} />
        <About about={profile.about} stack={profile.stack ?? []} />
        <Work projects={projectsRes.data ?? []} />
        <Kiv items={kivRes.data ?? []} />
        <Dither copy={dither} />
        <Contact profile={profile} />
      </main>
    </>
  );
}
