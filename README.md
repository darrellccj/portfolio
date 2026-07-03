# Portfolio

A one-page personal portfolio built around a live **koi pond** hero — an
aerial view of a cream-toned pond with procedurally animated fish, drifting
light caustics, floating lily pads, and cursor interaction. Below the hero:
About, Selected Work, KIV (Keep In View — concepts in progress), and Contact.

Built with **Vite + React**. No UI framework — the styling is hand-written
CSS and the pond is a single `<canvas>` component.

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

`src/components/KoiPond.jsx` is a self-contained canvas animation:

- Fish are drawn as **segmented spines** (follow-the-leader) so their bodies
  curve naturally as they swim; they wander, avoid the edges, and veer away
  from the cursor.
- Clicking the pond sends out a ripple.
- It **respects `prefers-reduced-motion`** (renders a single static frame)
  and **pauses when scrolled out of view** to save battery/CPU.

Fish count and lily-pad count scale with the viewport, so it stays light on
phones.

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
