# Portfolio

A personal portfolio in two inks — sky `#9fd4f7` on ultramarine
`#0d3372`. A WebGL **duotone sky** backs the hero; below it sit About,
Selected Work (a pinned horizontal card-scroll), KIV (Keep In Vault —
concepts in progress), a canvas **ordered-dither** study, and Contact.

Every project and KIV item also has a page of its own — `/work/<slug>` and
`/kiv/<slug>` — reached by clicking its card or row.

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
| `SANITY_API_WRITE_TOKEN` | **Server-only.** Editor token Studio Mode's Save button uses to publish drafts |

Create the read token under *Manage → API → Tokens* with **Viewer** rights.
Without it the site still renders published content — only draft previewing
is unavailable. Create the write token with **Editor** rights; without it
Studio Mode still opens and edits, but its Save button fails.

## Editing content

The **Studio Mode** toggle sits in the footer. Clicking it does two things:
it puts the live page itself into click-to-edit mode (via Sanity Visual
Editing), and it opens a small floating panel, bottom-right, that you can
drag anywhere. The panel shows nothing until you hover and click a
highlighted field on the actual page — then it loads just that field's
Studio edit form, deep-linked via `/studio/intent/edit/id=…;type=…;path=…/`
with Studio's outer chrome hidden (`src/sanity/EmbeddedNavbar.tsx`, which
detects the iframe via `window.self !== window.top`). **Back** returns the
panel to its idle state; **Save** publishes every pending draft in the
dataset; **Close** turns Draft Mode back off.

Under the hood, Draft Mode gets enabled the moment the panel opens, via a
hidden 1×1 iframe that briefly loads Presentation Tool purely to trigger its
preview-secret exchange — you never see Presentation's UI, just its side
effect (the cookie). The panel shows "Waking up Studio…" until that lands;
if it's still not enabled after a few seconds, it shows a sign-in prompt
instead (see below).

The overlay/panel wiring (`src/components/StudioOverlayField.jsx`,
`StudioModePanel.jsx`) is built on `next-sanity/visual-editing`'s
`components` prop — an **alpha, undocumented-beyond-its-types** API for
supplying a custom overlay component per field. It was verified by reading
the installed package's source and TypeScript types rather than trying it
in a browser: this sandbox has no network access to Sanity's API at all, so
none of it has actually been seen working end to end. Check it for real on
your first deploy — the failure mode if the alpha API changes shape is
overlays not appearing or not being clickable, not a crash.

The first time you use Studio Mode in a given browser, sign in to Studio
first: Google (and most identity providers) refuses to render its own
sign-in page inside an iframe, so the hidden bootstrap iframe can't
authenticate you — it'll just silently fail and the panel will prompt you
to open Studio in a new tab. Once you're signed in there, Studio Mode works
normally.

Content lives in Sanity. In the Studio:

- **Profile** (singleton) — name, role, tagline, about, email, location,
  stack, socials.
- **Projects** — the Selected Work cards *and* their detail pages. Fields are
  split into three Studio tabs:
  - **Card** — `title`, `slug`, `tag`, `desc`, `year`, `order`. These drive the
    pinned scroll on the home page; `order` controls sequence.
  - **Detail page** — `status`, `role`, `timeline`, `stack`, the primary
    `href` plus a list of other `links`, the narrative fields `overview` /
    `problem` / `approach` / `outcome`, up to four `metrics`, and any number
    of free-form `sections`.
  - **Media** — a `cover` plate and a `gallery`.
- **KIV** — concept rows and their detail pages, in two tabs:
  - **Row** — `title`, `slug`, `tag`, `desc`, `order`.
  - **Detail page** — `status`, `premise`, `why`, `notes`, `openQuestions`,
    `stack`, and free-form `sections`.
- **Dither study** (singleton) — the artwork title, credit, and source plate.

Everything below `slug` on both types is **optional**. A document with only
its card filled in still renders a valid detail page — it just says the
write-up is still being written, rather than showing an unexplained gap. Fill
the fields in as you go and the page grows to fit.

### Slugs

`slug` was added after the first documents existed, so it is not required.
Anything without one falls back to a slugified `title` (`src/lib/routes.ts`),
which means every project and KIV item has a working URL immediately.
Authoring a slug in the Studio only pins a URL that already worked — so set
one before sharing a link you don't want to change, since renaming a
slug-less document also renames its URL.

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
      not-found.tsx       # 404 for a mistyped project or KIV slug
      work/[slug]/        # one page per project
      kiv/[slug]/         # one page per KIV concept
    studio/[[...tool]]/   # embedded Sanity Studio at /studio
    api/draft-mode/enable # Draft Mode entry point for Visual Editing
  sanity/
    env.ts  lib/client.ts  lib/live.ts  lib/image.ts
    queries.ts            # GROQ, via defineQuery
    types.ts              # generated — do not edit by hand
    schemaTypes/  structure.ts   # Studio schema + desk structure
  lib/
    routes.ts             # slug derivation + /work and /kiv path helpers
  components/
    SkyGL.jsx             # WebGL duotone sky (three.js)
    Dither.jsx            # canvas ordered-dither study
    Nav  Hero  About  Work  Kiv  Contact
    detail/               # server-rendered pieces of the two detail pages
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
