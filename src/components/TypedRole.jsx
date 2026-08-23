'use client';

import { useEffect, useState } from 'react';

const TYPE_MS = 55;
const DELETE_MS = 30;
const HOLD_MS = 1600;

// Starts already fully "typed" with the first word (matches the
// server-rendered fallback, so there's no flash-of-empty on load),
// then holds, deletes, and types the next word, forever.
export default function TypedRole({ words }) {
  const list = words && words.length ? words : [''];
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(list[0]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (list.length <= 1) return;
    const current = list[index];
    let timeout;

    if (deleting) {
      timeout =
        text.length > 0
          ? setTimeout(() => setText(current.slice(0, text.length - 1)), DELETE_MS)
          : setTimeout(() => {
              setIndex((i) => (i + 1) % list.length);
              setDeleting(false);
            }, TYPE_MS);
    } else if (text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), TYPE_MS);
    } else {
      timeout = setTimeout(() => setDeleting(true), HOLD_MS);
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, deleting, index]);

  return (
    <span className="hero__typed">
      {text}
      <span className="hero__cursor" aria-hidden="true" />
    </span>
  );
}
