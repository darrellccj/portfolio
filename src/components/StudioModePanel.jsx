'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VisualEditing } from 'next-sanity/visual-editing';
import { useStudioMode } from './StudioModeContext';
import StudioOverlayField from './StudioOverlayField';

const SAVE_STATUS_TEXT = {
  saving: 'Publishing…',
  saved: 'Published',
  empty: 'Nothing to publish',
  error: 'Publish failed',
};

// A single component instance always returns the same overlay for every
// field — kept stable across renders so VisualEditing doesn't re-mount.
function resolveOverlayComponents() {
  return StudioOverlayField;
}

export default function StudioModePanel() {
  const { open, close, selection, clearSelection, isDraftMode } = useStudioMode();
  const router = useRouter();

  const [needsAuth, setNeedsAuth] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const panelRef = useRef(null);

  // Bootstrap Draft Mode the moment the panel opens, via a hidden iframe
  // that triggers Presentation Tool's own preview-secret exchange in the
  // background. The user never sees Presentation's UI — just its side
  // effect, the Draft Mode cookie, which SiteLayout reads server-side and
  // feeds back in as the isDraftMode prop on the next refresh.
  useEffect(() => {
    if (!open || isDraftMode) return;
    setNeedsAuth(false);

    const retry = setTimeout(() => router.refresh(), 1800);
    const giveUp = setTimeout(() => setNeedsAuth(true), 4500);

    return () => {
      clearTimeout(retry);
      clearTimeout(giveUp);
    };
  }, [open, isDraftMode, router]);

  useEffect(() => {
    if (isDraftMode) setNeedsAuth(false);
  }, [isDraftMode]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/studio/publish', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      setSaveStatus(data.published.length ? 'saved' : 'empty');
      router.refresh();
    } catch {
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }, [router]);

  const handleClose = useCallback(() => {
    close();
    fetch('/api/draft-mode/disable', { redirect: 'manual' }).finally(() => router.refresh());
  }, [close, router]);

  const onDragStart = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = panelRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const originLeft = rect.left;
    const originTop = rect.top;

    const onMove = (ev) => {
      setDragPos({ left: originLeft + (ev.clientX - startX), top: originTop + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  if (!open) return null;

  const intentUrl = selection
    ? `/studio/intent/edit/id=${selection.id};type=${selection.type}${selection.path ? `;path=${selection.path}` : ''}/`
    : null;

  return (
    <>
      {!isDraftMode && (
        <iframe
          src="/studio/presentation"
          title="Studio Draft Mode bootstrap (hidden)"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'fixed', width: 1, height: 1, left: -9999, top: -9999, border: 0 }}
        />
      )}

      {isDraftMode && <VisualEditing components={resolveOverlayComponents} />}

      <div
        ref={panelRef}
        id="studio-panel"
        className="studio-panel"
        role="dialog"
        aria-label="Studio Mode"
        style={dragPos ? { left: dragPos.left, top: dragPos.top, right: 'auto', bottom: 'auto' } : undefined}
      >
        <div className="studio-panel__bar" onPointerDown={onDragStart}>
          <span className="studio-panel__label">Studio Mode</span>
          <div className="studio-panel__actions">
            {saveStatus && <span className="studio-panel__status">{SAVE_STATUS_TEXT[saveStatus]}</span>}
            {selection && (
              <button type="button" className="studio-panel__back" onClick={clearSelection}>
                ‹ Back
              </button>
            )}
            <button
              type="button"
              className="studio-panel__save"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              Save
            </button>
            <button type="button" className="studio-panel__close" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="studio-panel__body">
          {selection ? (
            <iframe className="studio-panel__frame" src={intentUrl} title="Edit field" />
          ) : (
            <p className="studio-panel__hint">
              {!isDraftMode
                ? needsAuth
                  ? (
                    <>
                      Sign in first — <a href="/studio" target="_blank" rel="noopener">open Studio</a>, then
                      reopen Studio Mode.
                    </>
                  )
                  : 'Waking up Studio…'
                : 'Hover the page and click a highlighted field to edit it here.'}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
