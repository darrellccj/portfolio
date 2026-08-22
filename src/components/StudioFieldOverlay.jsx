'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {vercelStegaDecode} from '@vercel/stega';
import {useStudioMode} from './StudioModeContext';

// Draws the clickable box over every editable field on the page.
//
// This does NOT use Visual Editing's overlay. That one resolves its fields
// from a schema it fetches over comlink from Presentation Tool, so with no
// Presentation parent there is no comlink, no schema, and the field context
// comes back undefined — at which point it never calls the `components`
// resolver at all and nothing is drawn. Standalone, the only field data
// actually present on the page is the stega already embedded in the text,
// so read that directly.

// Zero-width characters stega hides its payload in.
const STEGA_CHARS = /[\u200B-\u200D\uFEFF]/;

// Elements whose text should never be treated as an editable field.
const IGNORED = 'script, style, textarea, input, .studio-panel, .studio-overlay';

function decodeField(text) {
  let decoded;
  try {
    decoded = vercelStegaDecode(text);
  } catch {
    return null;
  }
  if (!decoded?.href) return null;

  // href looks like:
  //   /studio/intent/edit/mode=presentation;id=profile;…?id=profile&type=profile&path=name
  let params;
  try {
    params = new URL(decoded.href, window.location.origin).searchParams;
  } catch {
    return null;
  }

  const id = params.get('id');
  const path = params.get('path');
  if (!id || !path) return null;

  return {id, type: params.get('type'), path};
}

function collectFields() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map();

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!STEGA_CHARS.test(node.nodeValue)) continue;

    const element = node.parentElement;
    if (!element || element.closest(IGNORED)) continue;

    const field = decodeField(node.nodeValue);
    if (!field) continue;

    // Keyed by element, not by field: the same value often renders in
    // several places (name is in the nav, the hero and the footer) and all
    // of them should be clickable. Keying by field would box only the
    // first. A value split across several text nodes inside one element
    // still gets a single box.
    if (!seen.has(element)) {
      seen.set(element, {...field, key: `${field.id}:${field.path}:${seen.size}`, element});
    }
  }

  return Array.from(seen.values());
}

export default function StudioFieldOverlay() {
  const {select, selection, setFieldCount} = useStudioMode();
  const [fields, setFields] = useState([]);
  const [rects, setRects] = useState([]);
  const frame = useRef(0);

  // Find the fields. Re-run when the DOM changes, which is how edits
  // pushed back by SanityLive show up.
  //
  // Rendering the boxes is itself a DOM mutation, so this only commits when
  // the set of fields actually differs — otherwise the observer would feed
  // its own re-render forever.
  const signature = useRef('');

  useEffect(() => {
    let idle = 0;

    const rescan = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        const found = collectFields();
        const next = found.map((f) => f.key).join('|');
        if (next === signature.current) return;
        signature.current = next;
        setFields(found);
      }, 120);
    };

    rescan();
    const mo = new MutationObserver(rescan);
    mo.observe(document.body, {childList: true, subtree: true, characterData: true});

    return () => {
      mo.disconnect();
      clearTimeout(idle);
    };
  }, []);

  // Measure them. Cheap enough to redo on every scroll frame, and it has to
  // be — the page pins and translates sections as you scroll.
  const measure = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;

      // React can swap out the node behind a field when its text changes.
      // Drop the stale ones and invalidate the signature so the next
      // mutation does a real rescan rather than leaving a box orphaned.
      const live = fields.filter((field) => field.element.isConnected);
      if (live.length !== fields.length) signature.current = '';

      setRects(
        live
          .map((field) => {
            const {top, left, width, height} = field.element.getBoundingClientRect();
            return {...field, top, left, width, height};
          })
          .filter((r) => r.width >= 1 && r.height >= 1)
      );
    });
  }, [fields]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    for (const field of fields) ro.observe(field.element);

    window.addEventListener('scroll', measure, {passive: true, capture: true});
    window.addEventListener('resize', measure, {passive: true});

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', measure, {capture: true});
      window.removeEventListener('resize', measure);
      // Clearing the id matters as much as cancelling the frame: measure()
      // bails while one is pending, so leaving a stale id here wedges it
      // shut and nothing is ever measured again. The effect re-runs on
      // every `fields` change (and twice on mount under StrictMode), so
      // this cleanup lands mid-flight all the time.
      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      }
    };
  }, [fields, measure]);

  // Report what the scan found, so the panel can say "no editable fields
  // on this page" rather than inviting a hover that will never light up.
  useEffect(() => {
    setFieldCount(fields.length);
  }, [fields.length, setFieldCount]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="studio-overlay" aria-hidden={false}>
      {rects.map((field) => {
        const active = selection?.id === field.id && selection?.path === field.path;
        const label = field.path.split('.').pop();

        return (
          <button
            key={field.key}
            type="button"
            aria-label={`Edit ${label}`}
            className={`studio-field${active ? ' is-active' : ''}`}
            style={{
              top: field.top - 3,
              left: field.left - 3,
              width: field.width + 6,
              height: field.height + 6,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              select({id: field.id, type: field.type, path: field.path});
            }}
          >
            <span className={`studio-field__label${field.top < 26 ? ' is-below' : ''}`}>
              <span aria-hidden="true">✎</span>
              {label}
            </span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}
