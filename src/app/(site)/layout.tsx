import {draftMode} from 'next/headers';
import {SanityLive} from '@/sanity/lib/live';
import {StudioModeProvider} from '@/components/StudioModeContext';
import StudioModePanel from '@/components/StudioModePanel';
// Imported here rather than in the root layout so the site's body styles
// (paper background, mono type) never load on /studio, which ships its own.
import '../globals.css';

export default async function SiteLayout({children}: {children: React.ReactNode}) {
  const isDraftMode = (await draftMode()).isEnabled;

  return (
    <StudioModeProvider isDraftMode={isDraftMode}>
      {children}
      <SanityLive />
      <StudioModePanel />
    </StudioModeProvider>
  );
}
