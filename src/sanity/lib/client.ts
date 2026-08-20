import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  // Studio is mounted in this same app, so a relative path resolves
  // correctly in every environment without another env var to keep in sync.
  stega: { studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '/studio' },
});
