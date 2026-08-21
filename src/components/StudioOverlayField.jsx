'use client';

import {useEffect, useRef, useState} from 'react';
import {useStudioMode} from './StudioModeContext';

// Replaces Visual Editing's default overlay for every field. Its built-in
// behaviour outside Presentation is a link that opens Studio in a new tab;
// here a click selects the field in the floating panel instead, so editing
// happens without leaving the page.
//
// Visual Editing measures and positions the overlay box for us — the
// ResizeObserver/rAF bookkeeping is already done upstream — so this only
// has to draw inside the rect it is handed.
export default function StudioOverlayField(props) {
  const {node, field, focused, PointerEvents} = props;
  const {select, selection} = useStudioMode();
  const ref = useRef(null);
  const [labelBelow, setLabelBelow] = useState(false);

  const active =
    focused ||
    (selection?.id === node?.id && selection?.path === node?.path);

  // Flip the label under the box when the field sits too close to the top
  // of the viewport for it to render above.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setLabelBelow(el.getBoundingClientRect().top < 26);
    check();
    window.addEventListener('scroll', check, {passive: true});
    window.addEventListener('resize', check, {passive: true});
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const label = field?.title || node?.path?.split('.').pop() || 'field';

  return (
    <PointerEvents
      ref={ref}
      className={`studio-field${active ? ' is-active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        select(node);
      }}
    >
      <span className={`studio-field__label${labelBelow ? ' is-below' : ''}`}>
        <span aria-hidden="true">✎</span>
        {label}
      </span>
    </PointerEvents>
  );
}
