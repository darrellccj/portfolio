import type {Metadata, Viewport} from 'next';
import {NextStudio} from 'next-sanity/studio';
import {metadata as studioMetadata, viewport as studioViewport} from 'next-sanity/studio';
import config from '../../../../sanity.config';

export const dynamic = 'force-static';

// studioMetadata carries `robots: noindex` and a same-origin referrer; it
// sets no title, so without this the site's own title leaks onto the tab.
export const metadata: Metadata = {...studioMetadata, title: 'Portfolio Studio'};
export const viewport: Viewport = studioViewport;

export default function StudioPage() {
  return <NextStudio config={config} />;
}
