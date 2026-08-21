'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_TEXT = {
  saving: 'Publishing…',
  saved: 'Published',
  empty: 'Nothing to publish',
  error: 'Publish failed',
};

// Floating toggle that opens the Studio's Presentation tool (mounted
// same-origin at /studio/presentation) in a modal overlay, so content edits
// happen in Draft Mode without leaving the live page. Presentation's own
// preview-secret flow enables Draft Mode for the whole site the moment it
// boots; Save publishes every pending draft and Close turns Draft Mode back
// off.
export default function StudioMode() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const triggerRef = useRef(null);
  const iframeRef = useRef(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
    fetch('/api/draft-mode/disable', { redirect: 'manual' }).finally(() => router.refresh());
  }, [router]);

  const handleSave = useCallback(async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/studio/publish', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      setStatus(data.published.length ? 'saved' : 'empty');
      router.refresh();
      if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
    } catch {
      setStatus('error');
    } finally {
      setTimeout(() => setStatus(null), 2500);
    }
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Presentation needs a beat to boot and enable Draft Mode via its own
    // preview-secret exchange before the underlying page has anything new
    // to pick up.
    const refreshTimer = setTimeout(() => router.refresh(), 1500);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(refreshTimer);
    };
  }, [open, close, router]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="studio-toggle"
        aria-pressed={open}
        aria-expanded={open}
        aria-controls="studio-modal"
        onClick={() => (open ? close() : setOpen(true))}
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
              <span className="studio-modal__label">Studio — Draft Mode</span>
              <div className="studio-modal__actions">
                {status && <span className="studio-modal__status">{STATUS_TEXT[status]}</span>}
                <button
                  type="button"
                  className="studio-modal__save"
                  onClick={handleSave}
                  disabled={status === 'saving'}
                >
                  Save
                </button>
                <button type="button" className="studio-modal__close" onClick={close}>
                  Close ✕
                </button>
              </div>
            </div>
            <iframe
              ref={iframeRef}
              className="studio-modal__frame"
              src="/studio/presentation"
              title="Sanity Studio"
            />
          </div>
        </div>
      )}
    </>
  );
}
