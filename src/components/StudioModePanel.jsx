'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {projectId} from '@/sanity/env';
import {useStudioMode} from './StudioModeContext';
import StudioFieldOverlay, {applyLocalEdit} from './StudioFieldOverlay';
import useStudioDemo from '../hooks/useStudioDemo';

const STATUS_TEXT = {
  saving: 'Publishing…',
  saved: 'Published',
  empty: 'Nothing to publish',
  error: 'Publish failed',
  patching: 'Saving…',
  patched: 'Saved',
  patchError: 'Could not save',
};

// Studio persists its session here once you have signed in at /studio.
// Same origin as the site, so the site can read it. Value shape: {token}.
const AUTH_KEY = `__studio_auth_token_${projectId}`;

function readStudioToken() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_KEY) || '{}').token || null;
  } catch {
    return null;
  }
}

export default function StudioModePanel() {
  const {
    open,
    close,
    selection,
    clearSelection,
    isDraftMode,
    fieldCount,
    markTouched,
    drainTouched,
    forgetTouched,
  } = useStudioMode();
  const router = useRouter();

  const [needsAuth, setNeedsAuth] = useState(false);
  const [status, setStatus] = useState(null);
  const [draft, setDraft] = useState('');
  // Only plain strings are editable here. Anything else — Portable Text,
  // images, arrays, references — would be flattened to a string by the
  // textarea, so those fields are shown read-only rather than destroyed.
  const [editable, setEditable] = useState(true);
  // Two different failures. fieldError means the value could not be loaded,
  // so there is nothing to edit and the editor is replaced. saveError means
  // a write failed while you were typing — the textarea has to stay put.
  const [fieldError, setFieldError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [loadingField, setLoadingField] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const panelRef = useRef(null);
  const patchTimer = useRef(null);
  // What the person has typed into the open field, if anything. Held in a
  // ref so the observer below can reapply it when a live update lands.
  const typed = useRef(null);

  // No admin session: the panel still works, as a preview that lives and
  // dies in this tab (see hooks/useStudioDemo.js). Never reaches the server.
  const demo = open && !isDraftMode && Boolean(needsAuth);
  const preview = useStudioDemo(demo);

  // Enable Draft Mode by handing our own Sanity session to the server,
  // which verifies it against the project before flipping the cookie.
  // No Studio boot, so this settles in one round trip.
  useEffect(() => {
    if (!open || isDraftMode) return;

    const token = readStudioToken();
    if (!token) {
      // Nothing under __studio_auth_token_<projectId>. Either this browser
      // has never signed in at /studio, or Studio signed in with cookie
      // auth, which leaves nothing readable here. Both look the same from
      // the site; both are fixed by signing in at /studio.
      setNeedsAuth('no-session');
      return;
    }

    let cancelled = false;
    setNeedsAuth(false);

    fetch('/api/studio/enable', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token}),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          router.refresh();
          return;
        }
        // A session was found but the server would not take it — expired,
        // revoked, or minted for a different project. Worth saying so
        // rather than repeating "sign in", which sounds like nothing
        // happened. The server also reports its own misconfiguration here.
        const body = await res.json().catch(() => ({}));
        setNeedsAuth(
          body.code === 'no-read-token'
            ? 'no-read-token'
            : body.code === 'not-admin'
              ? 'not-admin'
              : 'rejected'
        );
      })
      .catch(() => {
        if (!cancelled) setNeedsAuth('unreachable');
      });

    return () => {
      cancelled = true;
    };
  }, [open, isDraftMode, router]);

  useEffect(() => {
    if (isDraftMode) setNeedsAuth(false);
  }, [isDraftMode]);

  // Pull the field's current value whenever a new one is selected.
  useEffect(() => {
    if (!selection?.id || !selection?.path) {
      setDraft('');
      return;
    }

    let cancelled = false;
    typed.current = null;

    if (demo) {
      setFieldError(null);
      setSaveError(null);
      setEditable(true);
      setDraft(preview.find(selection.id, selection.path)?.current ?? '');
      return;
    }

    setLoadingField(true);

    const params = new URLSearchParams({id: selection.id, path: selection.path});
    setFieldError(null);
    setSaveError(null);

    fetch(`/api/studio/field?${params}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        // A failed request is not the same thing as a non-text field, and
        // conflating them sent every server error out as "isn't a plain
        // text field" — which is a lie that points at the content instead
        // of at the server.
        if (!res.ok) {
          setFieldError(data.error || `Request failed (${res.status}).`);
          setEditable(false);
          return;
        }

        const isString = typeof data.value === 'string';
        setEditable(isString);
        setDraft(isString ? data.value : '');
      })
      .catch(() => {
        if (!cancelled) setFieldError('Could not reach the server.');
      })
      .finally(() => {
        if (!cancelled) setLoadingField(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selection?.id, selection?.path, demo, preview.find]);

  // Debounced write to the draft document. SanityLive pushes the change
  // back into the page, so the edit shows up in place without a refresh.
  const queuePatch = useCallback(
    (value) => {
      if (!selection?.id || !selection?.path) return;
      clearTimeout(patchTimer.current);

      patchTimer.current = setTimeout(async () => {
        setStatus('patching');
        try {
          const res = await fetch('/api/studio/field', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: selection.id, path: selection.path, value}),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Request failed (${res.status}).`);
          }
          setSaveError(null);
          markTouched(selection.id);
          setStatus('patched');
        } catch (err) {
          // Say what the server said. "Could not save" alone sends you
          // looking at the content when the cause is usually configuration.
          setSaveError(err.message);
          setStatus('patchError');
        } finally {
          setTimeout(() => setStatus(null), 1800);
        }
      }, 400);
    },
    [selection?.id, selection?.path, markTouched]
  );

  useEffect(() => () => clearTimeout(patchTimer.current), []);

  // SanityLive re-renders the page with whatever has been saved so far,
  // which trails what is in the box by a debounce and a round trip. Left
  // alone the text would flick back to the older value mid-sentence, so
  // while a field has unsaved typing, put it back after any live update.
  useEffect(() => {
    if (!isDraftMode || !selection?.id || !selection?.path) return;
    const {id, path} = selection;
    const reapply = () => {
      if (typed.current !== null) applyLocalEdit(id, path, typed.current);
    };
    const mo = new MutationObserver(reapply);
    mo.observe(document.body, {childList: true, subtree: true, characterData: true});
    return () => mo.disconnect();
  }, [isDraftMode, selection?.id, selection?.path]);

  const handleSave = useCallback(async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/studio/publish', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: drainTouched()}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      forgetTouched();
      setStatus(data.published.length ? 'saved' : 'empty');
      router.refresh();
    } catch {
      setStatus('error');
    } finally {
      setTimeout(() => setStatus(null), 2500);
    }
  }, [router, drainTouched, forgetTouched]);

  const handleClose = useCallback(() => {
    close();
    fetch('/api/draft-mode/disable', {redirect: 'manual'}).finally(() => router.refresh());
  }, [close, router]);

  // Escape steps back out: the open field first, then the panel itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (selection) clearSelection();
      else handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selection, clearSelection, handleClose]);

  const onDragStart = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = panelRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const originLeft = rect.left;
    const originTop = rect.top;

    const onMove = (ev) => {
      setDragPos({
        left: originLeft + (ev.clientX - startX),
        top: originTop + (ev.clientY - startY),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  if (!open) return null;

  const fieldLabel = selection?.path?.split('.').pop() ?? 'field';

  return (
    <>
      {isDraftMode && <StudioFieldOverlay />}
      {demo && preview.status === 'ready' && <StudioFieldOverlay scan={preview.scan} />}

      <div
        ref={panelRef}
        id="studio-panel"
        className="studio-panel"
        role="dialog"
        aria-label="Studio Mode"
        style={
          dragPos ? {left: dragPos.left, top: dragPos.top, right: 'auto', bottom: 'auto'} : undefined
        }
      >
        <div className="studio-panel__bar" onPointerDown={onDragStart}>
          <span className="studio-panel__grip" aria-hidden="true" />
          <div className="studio-panel__actions">
            {status && <span className="studio-panel__status">{STATUS_TEXT[status]}</span>}
            {selection && (
              <button type="button" className="studio-panel__back" onClick={clearSelection}>
                ‹ Back
              </button>
            )}
            {!demo && (
              <button
                type="button"
                className="studio-panel__save"
                onClick={handleSave}
                disabled={status === 'saving'}
              >
                Save
              </button>
            )}
            <button type="button" className="studio-panel__close" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="studio-panel__body">
          {demo && (
            <p className="studio-panel__hint">
              <strong>Preview only.</strong> Edits show up on this page but stay in this tab and
              vanish on reload.{' '}
              {needsAuth === 'not-admin' ? (
                'Saving is limited to administrators of this project.'
              ) : (
                <>
                  An administrator can{' '}
                  <a href="/studio" target="_blank" rel="noopener">
                    sign in
                  </a>{' '}
                  to save for real.
                </>
              )}
              {preview.status === 'loading' && ' Finding editable fields…'}
              {preview.status === 'error' && ' Could not load the page content to preview.'}
            </p>
          )}

          {!isDraftMode && !demo ? (
            <p className="studio-panel__hint">
              {needsAuth === 'no-session' && (
                <>
                  <strong>Not signed in.</strong> Studio Mode needs your Sanity session, and this
                  browser has none. <a href="/studio" target="_blank" rel="noopener">Open Studio</a>,
                  sign in, then reopen Studio Mode here.
                </>
              )}
              {needsAuth === 'rejected' && (
                <>
                  <strong>Session rejected.</strong> Found a Sanity session but the server would not
                  accept it — usually expired, or for another project.{' '}
                  <a href="/studio" target="_blank" rel="noopener">Sign in again</a>.
                </>
              )}
              {needsAuth === 'not-admin' && (
                <>
                  <strong>Admins only.</strong> You&rsquo;re signed in to Sanity, but editing and
                  publishing here is limited to administrators of this project.
                </>
              )}
              {needsAuth === 'no-read-token' && (
                <>
                  <strong>Server is missing SANITY_API_READ_TOKEN.</strong> Without it drafts and
                  field source data cannot be fetched, so there would be nothing to edit. Set it in
                  the environment this site is running from, then restart.
                </>
              )}
              {needsAuth === 'unreachable' && (
                <>
                  <strong>Could not reach the server.</strong> /api/studio/enable did not respond.
                </>
              )}
              {!needsAuth && 'Waking up Studio…'}
            </p>
          ) : selection ? (
            fieldError ? (
              <p className="studio-panel__hint">
                <strong>Could not load {fieldLabel}.</strong> {fieldError}
              </p>
            ) : editable ? (
              <label className="studio-panel__field">
                <span className="studio-panel__field-label">{fieldLabel}</span>
                <textarea
                  className="studio-panel__input"
                  value={draft}
                  disabled={loadingField}
                  autoFocus
                  rows={4}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (demo) {
                      preview.setValue(selection.id, selection.path, e.target.value);
                    } else {
                      typed.current = e.target.value;
                      applyLocalEdit(selection.id, selection.path, e.target.value);
                      queuePatch(e.target.value);
                    }
                  }}
                />
                {saveError && <span className="studio-panel__error">{saveError}</span>}
              </label>
            ) : (
              <p className="studio-panel__hint">
                <strong>{fieldLabel}</strong> isn&rsquo;t a plain text field.{' '}
                <a href={`/studio/intent/edit/id=${selection.id};type=${selection.type}/`} target="_blank" rel="noopener">
                  Edit it in Studio
                </a>
                .
              </p>
            )
          ) : (
            <p className="studio-panel__hint">
              {demo ? (
                'Hover the page and click a highlighted field to try editing it.'
              ) : fieldCount === 0 ? (
                <>
                  <strong>No editable fields found.</strong> Draft Mode is on, but nothing on this
                  page carries Sanity source data. Usually that means stega is off — check that{' '}
                  <code>SANITY_API_READ_TOKEN</code> is set on the running server and that the dev
                  server was restarted after changing it.
                </>
              ) : (
                <>
                  Hover the page and click a highlighted field to edit it here.
                  {fieldCount > 0 && ` (${fieldCount} found)`}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
