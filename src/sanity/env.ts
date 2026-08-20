// None of these are secrets: NEXT_PUBLIC_* values are inlined into the client
// bundle at build time, and the project id and dataset are already written
// literally in sanity.config.ts. Defaulting them rather than asserting means a
// host with unset variables still builds — an unset variable used to throw
// during "collect page data" and fail the deploy outright.
//
// The real secret, SANITY_API_READ_TOKEN, is read server-side only (see
// lib/live.ts and api/draft-mode/enable) and has no default.

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-01';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2i3f87ic';
