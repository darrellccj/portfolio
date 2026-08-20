# Portfolio

A one-page personal portfolio in two inks — sky `#9fd4f7` on ultramarine
`#0d3372`. A WebGL **duotone sky** backs the hero; below it sit About,
Selected Work (a pinned horizontal card-scroll), KIV (Keep In Vault —
concepts in progress), a canvas **ordered-dither** study, and Contact.

Built with **Next.js (App Router)**, hand-written CSS, and **three.js** for
the sky. Content is managed in **Sanity**, with the Studio living in the
sibling `studio-portfolio/` folder.

## Layout

This app is one half of a workspace:

```
portfolio-workspace/
├── portfolio/          # this Next.js app        → localhost:3000
└── studio-portfolio/   # standalone Sanity Studio → localhost:3333
```

The Studio is deliberately **standalone**, not embedded in Next.js: it builds
on Vite (far faster), receives Sanity auto-updates without a redeploy, and
supports TypeGen watch mode.

## Getting started

Run the two apps side by side, in separate terminals:

```bash
# terminal 1 — the site
cd portfolio && npm install && npm run dev

# terminal 2 — the Studio
cd studio-portfolio && npm install && npm run dev
```

### Environment

`.env.local` holds the Sanity connection (already filled in except the token):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (`2i3f87ic`) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | API date pin |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Studio origin, for Visual Editing links |
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

`src/data/content.js` is retained as a **fallback**: any field or list that is
empty in Sanity falls back to the committed values, so an empty dataset never
ships a blank page. Once Sanity holds the real content, that file can go.

## Data flow

Queries are defined with `defineQuery` in `src/sanity/queries.ts` and fetched
server-side through the **Live Content API** (`sanityFetch` from
`src/sanity/lib/live.ts`), so published edits appear without a redeploy.
`<SanityLive />` in the root layout drives that; `VisualEditing` mounts only
when Draft Mode is on.

Regenerate query result types after editing a query or the schema:

```bash
cd ../studio-portfolio && npm run typegen   # → portfolio/src/sanity/types.ts
```

## Structure

```
src/
  app/
    layout.tsx            # fonts, metadata, SanityLive, VisualEditing
    page.tsx              # server component — fetches Sanity, renders sections
    globals.css           # design tokens + all styling
    api/draft-mode/enable # Draft Mode entry point for Visual Editing
  sanity/
    env.ts  lib/client.ts  lib/live.ts  lib/image.ts
    queries.ts            # GROQ, via defineQuery
    types.ts              # generated — do not edit by hand
  components/
    SkyGL.jsx             # WebGL duotone sky (three.js)
    Dither.jsx            # canvas ordered-dither study
    Nav  Hero  About  Work  Kiv  Contact
  hooks/
    useReveal.js          # scroll-in reveal via IntersectionObserver
    usePinnedScroll.js    # pinned horizontal card-scroll
  data/content.js         # fallback content
```

Components that touch `window`, canvas, or three.js are client components;
everything else renders on the server.

## Deploying

The app is a standard Next.js deployment (Vercel, Cloudflare, Netlify, or a
Node host). Remember to:

1. Set the same environment variables in the host, with `NEXT_PUBLIC_SITE_URL`
   pointing at the production domain.
2. Add the production URL as a **CORS origin** on the Sanity project:
   `npx sanity cors add https://your-domain --credentials`.
3. Deploy the Studio separately with `cd studio-portfolio && npx sanity deploy`.

Note: three.js adds roughly 150 KB gzipped — the cost of the WebGL sky.
