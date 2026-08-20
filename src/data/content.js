// ─────────────────────────────────────────────────────────────
//  SITE CONTENT
//  Everything you edit lives here. Swap the [PLACEHOLDER] values,
//  re-order the arrays, or move an item between `projects` and `kiv`
//  by changing which array it sits in. The UI is fully data-driven.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Darrell',
  role: 'Independent Technologist',
  // Short hero line — keep it to one calm sentence.
  tagline:
    "I build the software an institution didn't know it needed, a niche market is missing, or my own life could use — usually solo, always fast.",
  // Longer about paragraph.
  about:
    "I go wherever there's a real, messy problem — inside an institution without a tech team of its own, in a niche nobody's built well for yet, or in my own life. Fencing Singapore didn't have an engineering department, so I became one: public rankings on one side, the finance and competition backend on the other. Website Factory runs the same pattern for property agents — package an AI pipeline once, ship a bespoke site to each. And plenty of what I build exists because it made my own life easier first: a trip planner, a trading log, a meal-decision engine. Most of it is AI-assisted — I build in Claude Code, ship to React/Next.js on Cloudflare Workers and D1 — but the judgment on what's worth building, and whether it's good, stays mine.",
  email: 'darrellchuacj@gmail.com',
  location: 'Singapore',
  socials: [
    { label: 'GitHub', href: 'https://github.com/darrellccj' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/darrellchua-' },
    { label: 'Email', href: 'mailto:darrellchuacj@gmail.com' },
  ],
};

// The tools you reach for. Shown as a quiet list under About.
export const stack = [
  'Claude Code',
  'React',
  'Next.js',
  'Cloudflare Workers',
  'D1',
];

// ── SELECTED WORK ────────────────────────────────────────────
// Things you're actively building / shipped. These get the spotlight.
export const projects = [
  {
    tag: 'Fintech',
    title: 'Bloomberger Terminal',
    desc: 'A Bloomberg-inspired web app powered by free and low-cost market APIs. React + Vite, with a dark editorial aesthetic that makes dense data feel calm.',
    year: '2025',
    href: '#', // ← link to live demo / repo / case study
  },
  {
    tag: 'AI · Proptech',
    title: 'Website Factory',
    desc: 'A multi-agent pipeline that generates bespoke websites for Singapore property agents. Fast, elevated, and entirely their own. Design systems meet automation.',
    year: '2025',
    href: '#',
  },
  {
    tag: 'Social',
    title: 'Ember',
    desc: 'A hobby-discovery app — private by design, real-world by intention. A warm amber aesthetic wrapped around a "today\'s spark" home screen that nudges you offline.',
    year: '2024',
    href: '#',
  },
  {
    tag: 'Travel',
    title: 'Touching Earth',
    desc: 'An all-in-one trip companion — itinerary, bookings, packing lists, expense splitting, and the logistics that usually live in five different apps, in one.',
    year: '2025',
    href: '#', // ← link to live demo / repo / case study
  },
  {
    tag: 'Sports',
    title: 'Fencing Ranking',
    desc: 'The official rankings platform for Fencing Singapore — a public leaderboard on one side, and on the other, the admin backbone running competitions, points configuration, high-performance tracking, and finance.',
    year: '2025',
    href: '#',
  },
  {
    tag: 'Fintech',
    title: 'Macro',
    desc: 'A personal trading system — screens for swing setups against a rule-based strategy and logs every trade to prove out whether it actually works, plus a macro calendar, research feed, and a retirement calculator to chart the way out.',
    year: '2025',
    href: '#',
  },
];

// ── DITHER STUDY ─────────────────────────────────────────────
// A single framed plate — canvas-rendered ordered dither, no text on
// the page itself. Fields below only back the canvas's aria-label.
export const dither = {
  work: 'The Last Supper',
  credit: 'Leonardo da Vinci — c. 1495–1498',
};

// ── KIV — KEEP IN VIEW ───────────────────────────────────────
// Concepts in progress. Ideas parked where you can see them.
export const kiv = [
  {
    tag: 'Web3',
    title: 'Smart Contract Builder',
    desc: 'A Figma-style drag-and-drop Solidity generator. Visual logic in, deployable contracts out.',
  },
  {
    tag: 'Construction',
    title: 'Site Ecosystem',
    desc: 'Interconnected apps for contracts, approvals, VOs, and BIM — one source of truth for on-site teams.',
  },
  {
    tag: 'Watches',
    title: 'Seiko Catalogue',
    desc: 'A dark, luxury editorial catalogue app. A proof of concept for curated watch discovery.',
  },
  {
    tag: 'Food',
    title: 'What to Eat',
    desc: 'A decision engine for your next meal — factoring in as much personal data as it can, so the suggestion sounds like it came from you, not a random wheel.',
  },
];
