'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const StudioModeContext = createContext(null);

// isDraftMode comes from the server (SiteLayout reads draftMode().isEnabled)
// and flows back in fresh on every router.refresh(), so it always reflects
// the real cookie state rather than a client-side guess.
export function StudioModeProvider({ isDraftMode, children }) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(null);

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

  const value = useMemo(
    () => ({ open, toggle, close, selection, select, clearSelection, isDraftMode }),
    [open, selection, isDraftMode, toggle, close, select, clearSelection]
  );

  return <StudioModeContext.Provider value={value}>{children}</StudioModeContext.Provider>;
}

export function useStudioMode() {
  const ctx = useContext(StudioModeContext);
  if (!ctx) throw new Error('useStudioMode must be used within StudioModeProvider');
  return ctx;
}
