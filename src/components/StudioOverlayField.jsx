'use client';

import { useStudioMode } from './StudioModeContext';

// Replaces Visual Editing's default overlay for every field: instead of its
// built-in behavior (navigating away to Studio), clicking a highlighted
// field selects it in Studio Mode's floating panel, so editing happens
// without leaving the page. Passed as VisualEditing's `components` prop,
// which is an alpha API — untested against a live Sanity project, since
// this environment has no network access to Sanity's API to check it in a
// browser.
export default function StudioOverlayField(props) {
  const { node, focused, PointerEvents } = props;
  const { select } = useStudioMode();

  return (
    <PointerEvents
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        select(node);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.outlineColor = '#f03e2f';
      }}
      onMouseLeave={(e) => {
        if (!focused) e.currentTarget.style.outlineColor = 'transparent';
      }}
      style={{
        outline: `2px solid ${focused ? '#f03e2f' : 'transparent'}`,
        outlineOffset: '2px',
        cursor: 'pointer',
        transition: 'outline-color 120ms ease',
      }}
    />
  );
}
