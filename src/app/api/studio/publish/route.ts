import {NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {createClient} from 'next-sanity';
import {apiVersion, dataset, projectId} from '@/sanity/env';

const DRAFT_PREFIX = 'drafts.';

// Publishes every pending draft in the dataset — the Save action for
// Studio Mode. Gated on Draft Mode being on: that cookie is only ever set
// by the preview-secret-validated flow in api/draft-mode/enable, which
// only a signed-in Studio member with dataset access can trigger, so it
// doubles as the auth check here rather than standing up a second one.
export async function POST() {
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

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  });

  const drafts = await client.fetch<{_id: string; _type: string}[]>(
    '*[_id in path("drafts.**")]'
  );
  if (drafts.length === 0) {
    return NextResponse.json({published: []});
  }

  const tx = client.transaction();
  for (const draft of drafts) {
    const publishedId = draft._id.slice(DRAFT_PREFIX.length);
    tx.createOrReplace({...draft, _id: publishedId}).delete(draft._id);
  }
  await tx.commit();

  return NextResponse.json({published: drafts.map((d) => d._id.slice(DRAFT_PREFIX.length))});
}
