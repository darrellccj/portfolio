import {NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {createClient} from 'next-sanity';
import {apiVersion, dataset, projectId} from '@/sanity/env';

const DRAFT_PREFIX = 'drafts.';

const draftId = (id: string) =>
  id.startsWith(DRAFT_PREFIX) ? id : `${DRAFT_PREFIX}${id}`;
const publishedId = (id: string) =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

// Visual Editing hands us paths like `stack[_key=="a1b2"].title` or
// `projects[0].title`. Sanity's mutation API understands those verbatim in
// a patch, but nothing does for reading, so resolve them here.
function valueAtPath(doc: Record<string, unknown> | null, path: string): unknown {
  if (!doc) return undefined;

  let current: unknown = doc;
  for (const segment of path.split('.')) {
    if (current == null) return undefined;

    const match = /^([^[]+)((?:\[[^\]]+\])*)$/.exec(segment);
    if (!match) return undefined;

    const [, key, brackets] = match;
    current = (current as Record<string, unknown>)[key];

    for (const selector of brackets.match(/\[[^\]]+\]/g) ?? []) {
      if (!Array.isArray(current)) return undefined;
      const inner = selector.slice(1, -1);
      const keyed = /^_key\s*==\s*"(.*)"$/.exec(inner);
      current = keyed
        ? current.find((item) => (item as {_key?: string})?._key === keyed[1])
        : current[Number(inner)];
    }
  }

  return current;
}

function writeClient(token: string) {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  });
}

// Draft Mode is only ever switched on by api/studio/enable, which verifies
// the caller's Sanity session against the project. Checking the cookie here
// rather than re-verifying the token keeps a second auth path from existing.
async function guard() {
  if (!(await draftMode()).isEnabled) {
    return NextResponse.json(
      {error: 'Draft Mode is off — open Studio Mode first.'},
      {status: 401}
    );
  }
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json(
      {error: 'SANITY_API_WRITE_TOKEN is not configured.'},
      {status: 500}
    );
  }
  return null;
}

export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const {searchParams} = new URL(request.url);
  const id = searchParams.get('id');
  const path = searchParams.get('path');

  if (!id || !path) {
    return NextResponse.json({error: 'Expected `id` and `path`.'}, {status: 400});
  }

  const client = writeClient(process.env.SANITY_API_WRITE_TOKEN!);
  // Prefer the draft — that is what Studio Mode is editing — and fall back
  // to the published document for a field not yet touched in this session.
  const [draft, published] = await Promise.all([
    client.getDocument(draftId(id)),
    client.getDocument(publishedId(id)),
  ]);

  const source = draft ?? published ?? null;
  return NextResponse.json({
    value: valueAtPath(source as Record<string, unknown> | null, path) ?? null,
  });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: {id?: string; path?: string; value?: unknown};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Expected a JSON body.'}, {status: 400});
  }

  const {id, path, value} = body;
  if (!id || !path) {
    return NextResponse.json({error: 'Expected `id` and `path`.'}, {status: 400});
  }

  const client = writeClient(process.env.SANITY_API_WRITE_TOKEN!);
  const target = draftId(id);
  const source = await client.getDocument(publishedId(id));

  // Edits always land on the draft, so nothing reaches the live site until
  // Save publishes it. If no draft exists yet, fork one off the published
  // document first rather than patching a document that isn't there.
  const tx = client.transaction();
  if (source) {
    tx.createIfNotExists({...source, _id: target});
  }
  tx.patch(target, (patch) => patch.set({[path]: value}));

  try {
    await tx.commit({visibility: 'async'});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Patch failed.'},
      {status: 500}
    );
  }

  return NextResponse.json({ok: true, id: target, path});
}
