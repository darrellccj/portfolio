// ─────────────────────────────────────────────────────────────
//  SITE CONTENT
//  Everything you edit lives here. Swap the [PLACEHOLDER] values,
//  re-order the arrays, or move an item between `projects` and `kiv`
//  by changing which array it sits in. The UI is fully data-driven.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: '[NAME]',
  role: 'Designer & Developer',
  // Short hero line — keep it to one calm sentence.
  tagline: 'Designer, developer, and builder of thoughtful digital products.',
  // Longer about paragraph.
  about:
    'I build at the intersection of design and engineering — where restraint is a feature, not a limitation. Every element earns its place. I care about the quiet details: the kerning, the easing curve, the moment a thing feels effortless.',
  email: 'hello@[EMAIL].com',
  location: 'Singapore',
  socials: [
    { label: 'GitHub', href: 'https://github.com/[USERNAME]' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/[USERNAME]' },
    { label: 'Email', href: 'mailto:hello@[EMAIL].com' },
  ],
};

// The tools you reach for. Shown as a quiet list under About.
export const stack = [
  'React',
  'Node.js',
  'Python',
  'Vite',
  'Power Automate',
  'Solidity',
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
];

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
];
