# Portfolio

Not a portfolio — a dated record of exploring design. Why it is shaped
this way, and how it is meant to grow, is in [`docs/direction.md`](docs/direction.md).

Three sections, each its own route:

- **Projects** (`/projects`, `/projects/<slug>`) — things made for someone,
  each with an honest status: Idea · In progress · Parked · Done.
- **Log** (`/log`, `/log/<slug>`) — one dated stream of notes, experiments,
  project updates and checkpoints.
- **About** (`/about`) — a "now" page.

The home page carries a statement, the open questions, the five newest log
entries and the project list. `/dither` and `/lab` still exist as pages of
their own and are reached through log entries. Old `/work/*` and `/kiv/*`
URLs redirect to `/projects/*` (`next.config.ts`).

Built with **Next.js (App Router)** and hand-written CSS. Content is managed in **Sanity**, with the Studio embedded in this
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

The **Studio Mode** toggle sits in the footer on the home page, and at the very bottom of the project, log and index pages — those carry no contact band, but most of what Studio Mode edits lives on them. Clicking it does two things:
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

- **Profile** (singleton) — `name`, `statement`, `exploringSince`, up to three
  `questions` (home); `about` and `background` (About page); `email`,
  `location`, `socials`. There is deliberately no role, title or stack field.
- **Projects** — in four Studio tabs:
  - **List** — `title`, `slug`, `status`, `desc`, `tag`, `year`, `order`. The
    list sorts by status (Done → In progress → Parked → Idea), then `order`.
  - **Write-up** — `need`, `requirements`, `judgement`, `decisions`, `change`,
    plus free-form `sections`. For projects that have earned one.
  - **Idea / parked** — `standing`, `openQuestions`, `notes`.
  - **Media & links** — `timeline`, `href`, `links`, `cover`, `gallery`.
- **Log entries** — `title`, `slug`, `date`, `kind` (note · experiment · update
  · checkpoint), `tags`, `summary`, plain-text `body`, an optional `project`
  reference and an optional `href` for entries that live on a page of their
  own (e.g. `/dither`).
- **Dither study** (singleton) — the artwork title, credit, and source plate.

Every page field is **optional**. A project with only a line still renders a
valid page; it says nothing has been written yet rather than showing a gap.

### Slugs

`slug` was added after the first documents existed, so it is not required.
Anything without one falls back to a slugified `title` (`src/lib/routes.ts`),
which means every project and log entry has a working URL immediately.
Authoring a slug in the Studio only pins a URL that already worked — so set
one before sharing a link you don't want to change, since renaming a
slug-less document also renames its URL.

Sanity is the **sole** source of truth — there is no committed fallback. The
profile singleton is required; if it is missing the page throws a named error
rather than rendering with holes in it.

`seed.ndjson` is the dataset in its current shape, for a fresh setup. It
references an absolute image path, so it is not portable between machines
as-is.

### Migrations

`migrations/restructure-2026-10` moves an existing dataset from the old
Work / KIV shape to Projects / Log: KIV items become projects with status
*Idea*, old write-up fields move into `sections`, and the property agent site
and two log entries are created. It is safe to re-run. Dry run first:

```bash
npx sanity migration run restructure-2026-10
npx sanity migration run restructure-2026-10 --no-dry-run
```

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
      page.tsx            # home — statement, questions, latest log, projects
      not-found.tsx       # 404 for a mistyped project or log slug
      projects/           # index + one page per project
      log/                # index + one page per entry
      about/              # the "now" page
      dither/  lab/       # pages of their own, linked from log entries
    studio/[[...tool]]/   # embedded Sanity Studio at /studio
    api/draft-mode/enable # Draft Mode entry point for Visual Editing
  sanity/
    env.ts  lib/client.ts  lib/live.ts  lib/image.ts
    queries.ts            # GROQ, via defineQuery
    types.ts              # generated — do not edit by hand
    schemaTypes/  structure.ts   # Studio schema + desk structure
  lib/
    routes.ts             # slug derivation, path helpers, date formatting
    rows.ts               # Sanity results → IndexList rows
    dither.js             # dithering engine for /dither
  components/
    Nav  Hero  IndexList  Contact  LoadingScreen
    DitherStudio.jsx      # the /dither tool
    detail/               # server-rendered pieces of the detail pages
  hooks/
    useReveal.js          # scroll-in reveal via IntersectionObserver
    useDitherCanvas.js
```

Components that touch `window` or canvas are client components;
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
