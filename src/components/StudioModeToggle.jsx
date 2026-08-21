'use client';

import { useStudioMode } from './StudioModeContext';

// Lives in the site footer. Owns no UI beyond the button itself — the
// floating panel it opens is rendered separately (see StudioModePanel) so
// it can float over the whole page regardless of where this toggle sits.
export default function StudioModeToggle() {
  const { open, toggle } = useStudioMode();

  return (
    <button
      type="button"
      className="studio-toggle"
      aria-pressed={open}
      aria-expanded={open}
      aria-controls="studio-panel"
      onClick={toggle}
    >
      <span className="studio-toggle__dot" aria-hidden="true" />
      {open ? 'Close Studio' : 'Studio Mode'}
    </button>
  );
}
