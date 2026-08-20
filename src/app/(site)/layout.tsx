import {draftMode} from 'next/headers';
import {VisualEditing} from 'next-sanity/visual-editing';
import {SanityLive} from '@/sanity/lib/live';
// Imported here rather than in the root layout so the site's body styles
// (paper background, mono type) never load on /studio, which ships its own.
import '../globals.css';

export default async function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive />
      {(await draftMode()).isEnabled && <VisualEditing />}
    </>
  );
}
