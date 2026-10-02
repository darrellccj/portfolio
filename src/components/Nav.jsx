'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Three sections, each a real route — see docs/direction.md. Contact is
// an address at the bottom of the page rather than a call to action up here.
const LINKS = [
  { label: 'Projects', href: '/projects' },
  { label: 'Log', href: '/log' },
  { label: 'About', href: '/about' },
];

// 2026 redesign — a plain sticky bar rather than the old floating glass
// pill: the new hero has no dark sky for the nav to float over, so there
// is no transparent/solid state to switch between any more.
export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Split either side of the centred wordmark rather than one solid block
  // after the mark.
  const half = Math.ceil(LINKS.length / 2);
  const leftLinks = LINKS.slice(0, half);
  const rightLinks = LINKS.slice(half);

  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const renderLink = (l) => (
    <Link
      key={l.label}
      href={l.href}
      aria-current={isCurrent(l.href) ? 'page' : undefined}
      onClick={() => setOpen(false)}
    >
      {l.label}
    </Link>
  );

  return (
    <header className={`nav ${open ? 'nav--open' : ''}`}>
      <div className="nav__inner">
        <nav className="nav__links nav__links--left" aria-label="Primary">
          {leftLinks.map(renderLink)}
        </nav>

        <Link href="/" className="nav__brand" aria-label="Home" onClick={() => setOpen(false)}>
          Darrell
        </Link>

        <nav className="nav__links nav__links--right" aria-label="Primary">
          {rightLinks.map(renderLink)}
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
      </nav>
    </header>
  );
}
