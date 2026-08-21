import {NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {createClient} from 'next-sanity';
import {apiVersion, dataset, projectId} from '@/sanity/env';

const DRAFT_PREFIX = 'drafts.';

// The Save action for Studio Mode. Gated on Draft Mode being on, which is
// only ever set by api/studio/enable after it has verified the caller's
// Sanity session against this project — so that cookie doubles as the auth
// check rather than standing up a second one.
export async function POST(request: Request) {
  if (!(await draftMode()).isEnabled) {
    return NextResponse.json(
      {error: 'Draft Mode is off — open Studio Mode first.'},
      {status: 401}
    );
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {error: 'SANITY_API_WRITE_TOKEN is not configured.'},
      {status: 500}
    );
  }

  // Studio Mode sends the documents it actually touched. Publishing every
  // draft in the dataset instead would sweep up unrelated work-in-progress
  // that happens to be open in Studio, so only fall back to that when the
  // caller names nothing.
  let ids: string[] | undefined;
  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((id: unknown) => typeof id === 'string');
  } catch {
    // No body — publish everything pending, as before.
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  });

  const drafts = ids?.length
    ? await client.fetch<{_id: string; _type: string}[]>(
        '*[_id in $ids]',
        {ids: ids.map((id) => (id.startsWith(DRAFT_PREFIX) ? id : `${DRAFT_PREFIX}${id}`))}
      )
    : await client.fetch<{_id: string; _type: string}[]>('*[_id in path("drafts.**")]');

  if (drafts.length === 0) {
    return NextResponse.json({published: []});
  }

  const tx = client.transaction();
  for (const draft of drafts) {
    const id = draft._id.slice(DRAFT_PREFIX.length);
    tx.createOrReplace({...draft, _id: id}).delete(draft._id);
  }
  await tx.commit();

  return NextResponse.json({published: drafts.map((d) => d._id.slice(DRAFT_PREFIX.length))});
}
