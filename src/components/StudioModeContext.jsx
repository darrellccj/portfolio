'use client';

import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';

const StudioModeContext = createContext(null);

// isDraftMode comes from the server (SiteLayout reads draftMode().isEnabled)
// and flows back in fresh on every router.refresh(), so it always reflects
// the real cookie state rather than a client-side guess.
export function StudioModeProvider({isDraftMode, children}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  // Every document Studio Mode has patched this session, so Save publishes
  // exactly those rather than every draft in the dataset.
  const touched = useRef(new Set());

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (v) setSelection(null);
      return !v;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSelection(null);
  }, []);

  const select = useCallback((node) => setSelection(node), []);
  const clearSelection = useCallback(() => setSelection(null), []);
  const markTouched = useCallback((id) => touched.current.add(id), []);
  const drainTouched = useCallback(() => Array.from(touched.current), []);
  const forgetTouched = useCallback(() => touched.current.clear(), []);

  const value = useMemo(
    () => ({
      open,
      toggle,
      close,
      selection,
      select,
      clearSelection,
      isDraftMode,
      markTouched,
      drainTouched,
      forgetTouched,
    }),
    [
      open,
      selection,
      isDraftMode,
      toggle,
      close,
      select,
      clearSelection,
      markTouched,
      drainTouched,
      forgetTouched,
    ]
  );

  return <StudioModeContext.Provider value={value}>{children}</StudioModeContext.Provider>;
}

export function useStudioMode() {
  const ctx = useContext(StudioModeContext);
  if (!ctx) throw new Error('useStudioMode must be used within StudioModeProvider');
  return ctx;
}
