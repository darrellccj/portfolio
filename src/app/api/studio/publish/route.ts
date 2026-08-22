import {NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {revalidatePath} from 'next/cache';
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

  // Studio Mode names the documents it actually touched, and this route
  // publishes those and nothing else.
  //
  // There used to be a fallback that published every draft in the dataset
  // when the caller named none. It fired — it published four
  // sanity.previewUrlSecret documents that Presentation had left lying
  // around as drafts. Nothing was lost that time, but the same code would
  // just as happily publish half-written work someone had open in Studio.
  // An empty list now means "publish nothing", which is the only safe
  // reading of it.
  let ids: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((id: unknown) => typeof id === 'string');
  } catch {
    // No body at all — still means nothing to publish.
  }

  if (ids.length === 0) {
    return NextResponse.json({published: []});
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  });

  const drafts = await client.fetch<{_id: string; _type: string}[]>('*[_id in $ids]', {
    ids: ids.map((id) => (id.startsWith(DRAFT_PREFIX) ? id : `${DRAFT_PREFIX}${id}`)),
  });

  if (drafts.length === 0) {
    return NextResponse.json({published: []});
  }

  const tx = client.transaction();
  for (const draft of drafts) {
    const id = draft._id.slice(DRAFT_PREFIX.length);
    tx.createOrReplace({...draft, _id: id}).delete(draft._id);
  }
  await tx.commit();

  // Publishing writes to Sanity, which Next has no way of knowing about.
  // sanityFetch caches published reads with `revalidate: false`, so without
  // this the page keeps serving the pre-publish HTML and the edit looks
  // like it never happened. SanityLive does revalidate on live events, but
  // only while a page is open listening — closing Studio Mode right after
  // Save beats it every time.
  revalidatePath('/', 'layout');

  return NextResponse.json({published: drafts.map((d) => d._id.slice(DRAFT_PREFIX.length))});
}
