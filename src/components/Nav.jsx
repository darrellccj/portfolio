'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import logoCloud from '../assets/logo-cloud.png';

const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'KIV', href: '#kiv' },
  { label: 'Study', href: '#dither' },
  { label: 'Contact', href: '#contact' },
];

// `alwaysSolid` is for pages with no dark hero behind the pill — the
// detail pages and 404. Left in its default paper-on-paper state there,
// the nav would be invisible until you scrolled past 60vh.
export default function Nav({ alwaysSolid = false }) {
  const [solid, setSolid] = useState(alwaysSolid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (alwaysSolid) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysSolid]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''} ${open ? 'nav--open' : ''}`}>
      <div className="nav__pill">
        <a
          href="#top"
          className="nav__brand"
          aria-label="Back to top"
          onClick={() => setOpen(false)}
        >
          <Image src={logoCloud} alt="" priority className="nav__logo" />
        </a>
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
        <nav id="nav-links" className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
