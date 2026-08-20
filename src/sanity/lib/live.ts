import { defineLive } from 'next-sanity/live';
import { client } from './client';

// Live Content API — real-time updates + Visual Editing, per the
// Next.js integration guide. Tokens stay server-side unless drafts
// are explicitly enabled.
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
});
