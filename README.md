# Portfolio

A one-page personal portfolio built around a live **koi pond** hero — an
aerial view of a cream-toned pond with procedurally animated fish, drifting
light caustics, floating lily pads, and cursor interaction. Below the hero:
About, Selected Work, KIV (Keep In View — concepts in progress), and Contact.

Built with **Vite + React**. The styling is hand-written CSS; the pond is a
**WebGL** scene (three.js) rendered into a single fixed `<canvas>` that sits
behind every section.

## Getting started

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Editing your content

All copy and data live in one file: **`src/data/content.js`**.

- `profile` — your name, role, tagline, about paragraph, email, socials.
  Replace the `[NAME]`, `[EMAIL]`, and `[USERNAME]` placeholders.
- `stack` — the tools listed under About.
- `projects` — the "Selected Work" cards (add a real `href` per project).
- `kiv` — the "Keep In View" concept cards.

Move an item between Work and KIV simply by cutting it from one array and
pasting it into the other — the UI is fully data-driven.

Also update the placeholders in **`index.html`** (`<title>`, meta
description, and Open Graph tags) and drop an `og-image.png` in the project
root for social link previews.

## The koi pond

`src/components/KoiPondGL.jsx` is a self-contained WebGL scene (three.js):

- Each koi is a **detailed painted texture** (drawn once to an offscreen
  canvas — body volume shading, organic patches per variety, eyes, barbels,
  translucent fins) mapped onto a finely subdivided plane.
- A **traveling-wave vertex shader** flexes that plane so the whole body
  undulates and the tail swishes as one continuous motion — real swimming,
  not sprite frames. Fish are lit for a soft wet sheen.
- Authentic varieties: Kohaku, Sanke, Showa, Ogon, Platinum. Deeper fish sit
  lower and render fainter/cooler for underwater depth.
- The water is a **custom fragment shader**: cream base, drifting fbm
  caustics, and expanding **ripple rings** spawned where you click open water.
- Fish wander, avoid the edges, and veer away from the cursor; lily pads
  float above and fish pass beneath them.
- **Respects `prefers-reduced-motion`** (renders a single static frame),
  **pauses while the tab is hidden**, and **falls back gracefully** to the
  plain cream background if WebGL is unavailable.

Fish and lily-pad counts scale with the viewport. Note: three.js adds
~150 KB gzipped to the bundle — the cost of the WebGL fidelity.

## Structure

```
index.html              # meta, fonts, favicon
src/
  main.jsx              # React entry
  App.jsx               # page composition
  data/content.js       # ← edit your content here
  hooks/useReveal.js    # scroll-in reveal via IntersectionObserver
  components/
    KoiPond.jsx         # the animated canvas hero
    Nav.jsx  Hero.jsx  About.jsx  Work.jsx  Kiv.jsx  Contact.jsx
  styles/global.css     # design tokens + all styling
```

## Deploying

The build is fully static. `vite.config.js` uses `base: './'` so the
contents of `dist/` work both at a root domain and in a GitHub Pages project
subpath. Any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages)
serves it directly.
