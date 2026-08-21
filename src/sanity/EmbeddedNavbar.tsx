'use client';

import {useState} from 'react';
import type {NavbarProps} from 'sanity';

// Studio is reached two ways: embedded in Studio Mode's iframe, or visited
// directly at /studio. Hide the outer chrome — workspace name, tool tabs,
// user menu — only in the embedded case, so Studio Mode reads as "the site,
// now editable" rather than "Sanity Studio in a box". A direct /studio visit
// keeps the full navbar, since that's where Structure and Vision live.
// Studio itself only ever renders client-side, so reading window in the
// initial state (rather than an effect) doesn't risk a hydration mismatch.
export function EmbeddedNavbar(props: NavbarProps) {
  const [embedded] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top
  );

  if (embedded) return null;
  return props.renderDefault(props);
}
