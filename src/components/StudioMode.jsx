'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Floating toggle that opens the Studio (mounted same-origin at /studio) in
// a modal overlay, so content changes happen without leaving the live page.
export default function StudioMode() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="studio-toggle"
        aria-pressed={open}
        aria-expanded={open}
        aria-controls="studio-modal"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="studio-toggle__dot" aria-hidden="true" />
        {open ? 'Close Studio' : 'Studio Mode'}
      </button>

      {open && (
        <div
          id="studio-modal"
          className="studio-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Sanity Studio"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="studio-modal__panel">
            <div className="studio-modal__bar">
              <span className="studio-modal__label">Studio — Live Editing</span>
              <button type="button" className="studio-modal__close" onClick={close}>
                Close ✕
              </button>
            </div>
            <iframe className="studio-modal__frame" src="/studio" title="Sanity Studio" />
          </div>
        </div>
      )}
    </>
  );
}
