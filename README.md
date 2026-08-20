# Portfolio

A one-page personal portfolio in two inks — sky `#9fd4f7` on ultramarine
`#0d3372`. A WebGL **duotone sky** backs the hero; below it sit About,
Selected Work (a pinned horizontal card-scroll), KIV (Keep In Vault —
concepts in progress), a canvas **ordered-dither** study, and Contact.

Built with **Next.js (App Router)**, hand-written CSS, and **three.js** for
the sky. Content is managed in **Sanity**, with the Studio embedded in this
same app at `/studio`.

## Getting started

```bash
npm install && npm run dev
```

- Site → `localhost:3000`
- Studio → `localhost:3000/studio`

The Studio is mounted from `sanity.config.ts` at the repo root, rendered by
`src/app/studio/[[...tool]]/page.tsx`. It ships the **Presentation** tool, so
you can edit drafts beside a live preview of the site.

### Environment

`.env.local` holds the Sanity connection (already filled in except the token):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (`2i3f87ic`) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | API date pin |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Studio path (`/studio`), for Visual Editing links |
| `NEXT_PUBLIC_SITE_URL` | Absolute base for OG/metadata URLs |
| `SANITY_API_READ_TOKEN` | **Server-only.** Viewer token for Draft Mode |

Create the read token under *Manage → API → Tokens* with **Viewer** rights.
Without it the site still renders published content — only draft previewing
is unavailable.

## Editing content

Content lives in Sanity. In the Studio:

- **Profile** (singleton) — name, role, tagline, about, email, location,
  stack, socials.
- **Projects** — the Selected Work cards. `order` controls sequence.
- **KIV** — concept cards. `order` controls sequence.
- **Dither study** (singleton) — the artwork title, credit, and source plate.

Sanity is the **sole** source of truth — there is no committed fallback. The
two singletons are required; if either is missing the page throws a named
error rather than rendering with holes in it.

`seed.ndjson` records how the dataset was first populated. It is a one-time
artefact and references an absolute image path, so it is not portable between
machines as-is.

## Data flow

Queries are defined with `defineQuery` in `src/sanity/queries.ts` and fetched
server-side through the **Live Content API** (`sanityFetch` from
`src/sanity/lib/live.ts`), so published edits appear without a redeploy.
`<SanityLive />` in the `(site)` layout drives that; `VisualEditing` mounts
only when Draft Mode is on. Both live in `src/app/(site)/layout.tsx` rather
than the root layout, which also keeps `globals.css` off the `/studio` route
so the site's body styling never bleeds into the Studio chrome.

Regenerate query result types after editing a query or the schema:

```bash
npm run typegen   # → src/sanity/types.ts
```

## Structure

```
src/
  app/
    layout.tsx            # <html>/<body> + font variables only
    globals.css           # design tokens + all styling
    (site)/
      layout.tsx          # globals.css, SanityLive, VisualEditing
      page.tsx            # server component — fetches Sanity, renders sections
    studio/[[...tool]]/   # embedded Sanity Studio at /studio
    api/draft-mode/enable # Draft Mode entry point for Visual Editing
  sanity/
    env.ts  lib/client.ts  lib/live.ts  lib/image.ts
    queries.ts            # GROQ, via defineQuery
    types.ts              # generated — do not edit by hand
    schemaTypes/  structure.ts   # Studio schema + desk structure
  components/
    SkyGL.jsx             # WebGL duotone sky (three.js)
    Dither.jsx            # canvas ordered-dither study
    Nav  Hero  About  Work  Kiv  Contact
  hooks/
    useReveal.js          # scroll-in reveal via IntersectionObserver
    usePinnedScroll.js    # pinned horizontal card-scroll
```

Components that touch `window`, canvas, or three.js are client components;
everything else renders on the server.

## Deploying

The app is a standard Next.js deployment (Vercel, Cloudflare, Netlify, or a
Node host). Remember to:

1. Set every environment variable above in the host — `.env.local` is
   gitignored and never leaves your machine. `NEXT_PUBLIC_SANITY_PROJECT_ID`
   and `NEXT_PUBLIC_SANITY_DATASET` are asserted at import time, so the build
   **fails** without them. Point `NEXT_PUBLIC_SITE_URL` at the production
   domain, or OG/metadata URLs resolve to localhost.
2. Add the production URL as a **CORS origin** on the Sanity project:
   `npx sanity cors add https://your-domain --credentials`. The embedded
   Studio is served from your own domain, so without this it cannot reach
   the Sanity API.

The Studio deploys with the site — there is no separate `sanity deploy` step.

Note: three.js adds roughly 150 KB gzipped — the cost of the WebGL sky.
