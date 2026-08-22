import {NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {createClient} from 'next-sanity';
import {apiVersion, dataset, projectId} from '@/sanity/env';

// Turns Draft Mode on for Studio Mode, using the caller's own Sanity
// session as the authorisation.
//
// The previous approach booted the whole Studio in a hidden iframe and
// waited for Presentation Tool's preview-secret exchange to set the cookie
// as a side effect. That never had a chance: a cold /studio route takes
// tens of seconds to compile and hand back a usable Presentation, and the
// panel gave up after 4.5s. Presentation also has no reason to render its
// preview iframe inside a 1x1 offscreen frame.
//
// Instead the client reads the token Studio already persisted in
// localStorage (same origin, so it is readable from the site) and posts it
// here. We verify it against the project-scoped /users/me endpoint — a
// token for another project, an expired token, or a made-up string all
// fail — and only then enable Draft Mode. next-sanity's
// api/draft-mode/enable stays untouched for Presentation's own use.
export async function POST(request: Request) {
  let token: unknown;
  try {
    ({token} = await request.json());
  } catch {
    return NextResponse.json({error: 'Expected a JSON body.'}, {status: 400});
  }

  if (typeof token !== 'string' || !token) {
    return NextResponse.json({error: 'No Studio session found.'}, {status: 401});
  }

  // Refuse to switch Draft Mode on when the server cannot actually serve
  // drafts. defineLive only encodes stega — the source data every editable
  // field is found through — when it has a serverToken, so without this the
  // cookie flips, the page keeps rendering published content, and Studio
  // Mode opens onto a page with nothing to click. Failing here says why.
  if (!process.env.SANITY_API_READ_TOKEN) {
    return NextResponse.json(
      {
        code: 'no-read-token',
        error:
          'SANITY_API_READ_TOKEN is not set on this server, so drafts and field source data cannot be fetched.',
      },
      {status: 503}
    );
  }

  // useProjectHostname (the default) sends this to <projectId>.api.sanity.io,
  // so a valid token that has no access to *this* project still 401s.
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });

  let user: {id?: string} | null = null;
  try {
    user = await client.request({uri: '/users/me', tag: 'studio-mode.auth'});
  } catch {
    return NextResponse.json({error: 'Studio session is not valid.'}, {status: 401});
  }

  if (!user?.id) {
    return NextResponse.json({error: 'Studio session is not valid.'}, {status: 401});
  }

  (await draftMode()).enable();
  return NextResponse.json({ok: true, userId: user.id});
}
