'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Every section the nav points at lives on the home page. As bare
// fragments these resolved against whatever page you were on, so on a
// project or KIV page they pointed at anchors that were never there.
// Most entries are hashes on the home page (see `linkTo`); `href` is for
// links that are a real route of their own, like /lab.
const LINKS = [
  { label: 'About', hash: '#about' },
  { label: 'Work', hash: '#work' },
  { label: 'KIV', hash: '#kiv' },
  { label: 'Study', hash: '#dither' },
  { label: 'Lab', href: '/lab' },
];

// 2026 redesign — a plain sticky bar rather than the old floating glass
// pill: the new hero has no dark sky for the nav to float over, so there
// is no transparent/solid state to switch between any more.
export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // On the home page these stay bare fragments, so clicking one scrolls
  // without touching the URL's path or reloading. Anywhere else they have
  // to name the home page explicitly.
  const onHome = pathname === '/';
  const linkTo = (hash) => (onHome ? hash : `/${hash}`);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Split evenly either side of the centred wordmark — two tabs left,
  // two right — rather than one solid block after the mark.
  const half = Math.ceil(LINKS.length / 2);
  const leftLinks = LINKS.slice(0, half);
  const rightLinks = LINKS.slice(half);

  const renderLink = (l) => (
    <a key={l.label} href={l.href ?? linkTo(l.hash)} onClick={() => setOpen(false)}>
      {l.label}
    </a>
  );

  return (
    <header className={`nav ${open ? 'nav--open' : ''}`}>
      <div className="nav__inner">
        <nav className="nav__links nav__links--left" aria-label="Primary">
          {leftLinks.map(renderLink)}
        </nav>

        <a href={linkTo('#top')} className="nav__brand" aria-label="Back to top" onClick={() => setOpen(false)}>
          Darrell
        </a>

        <nav className="nav__links nav__links--right" aria-label="Primary">
          {rightLinks.map(renderLink)}
          <div className="bracket">
            <a href={linkTo('#contact')} className="nav__cta" onClick={() => setOpen(false)}>
              Contact
            </a>
          </div>
        </nav>

        <button
          type="button"
          className="nav__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
        </button>
      </div>

      <nav id="nav-links" className="nav__links-mobile" aria-label="Sections">
        {LINKS.map(renderLink)}
        <a href={linkTo('#contact')} onClick={() => setOpen(false)}>
          Contact
        </a>
      </nav>
    </header>
  );
}
