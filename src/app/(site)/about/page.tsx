import type {Metadata} from 'next';
import Link from 'next/link';

import Nav from '@/components/Nav';
import Contact from '@/components/Contact';
import {Block, Notes, TextBlock} from '@/components/detail/parts';

import {sanityFetch} from '@/sanity/lib/live';
import {PROFILE_QUERY} from '@/sanity/queries';
import {formatDate} from '@/lib/routes';

export const metadata: Metadata = {
  title: 'About — Darrell',
  description: 'Why this site exists, and what I am exploring.',
};

// A "now" page rather than a bio: why this started, what is open, a line
// of background. No skills, stack, or titles — see docs/direction.md.
export default async function AboutPage() {
  const {data: profile} = await sanityFetch({query: PROFILE_QUERY});
  if (!profile) throw new Error('Sanity: no `profile` document. Create it at /studio.');

  const since = formatDate(profile.exploringSince, {month: true});
  const questions = (profile.questions ?? []).filter(Boolean);

  return (
    <>
      <Nav />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/">
              <span aria-hidden="true">←</span> Home
            </Link>
            {since ? <span className="detail__count">Since {since}</span> : null}
          </div>

          <header className="detail__head">
            <p className="detail__eyebrow">About</p>
            <h1 className="detail__title">{profile.name}</h1>
            {profile.statement ? <p className="detail__lede">{profile.statement}</p> : null}
          </header>

          <div className="detail__body">
            <TextBlock label="Now" text={profile.about} index={0} />

            {questions.length ? (
              <Block label="Open questions" index={1}>
                <Notes items={questions} ordered />
              </Block>
            ) : null}

            <TextBlock label="Background" text={profile.background} index={2} />
          </div>
        </div>
      </main>
      <Contact profile={profile} />
    </>
  );
}
