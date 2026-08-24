'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import logoCloud from '../assets/logo-cloud.png';

// Every section the nav points at lives on the home page. As bare
// fragments these resolved against whatever page you were on, so on a
// project or KIV page they pointed at anchors that were never there.
const LINKS = [
  { label: 'About', hash: '#about' },
  { label: 'Work', hash: '#work' },
  { label: 'KIV', hash: '#kiv' },
  { label: 'Study', hash: '#dither' },
  { label: 'Contact', hash: '#contact' },
];

// `alwaysSolid` is for pages with no dark hero behind the pill — the
// detail pages and 404. Left in its default paper-on-paper state there,
// the nav would be invisible until you scrolled past 60vh.
export default function Nav({ alwaysSolid = false }) {
  const [solid, setSolid] = useState(alwaysSolid);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // On the home page these stay bare fragments, so clicking one scrolls
  // without touching the URL's path or reloading. Anywhere else they have
  // to name the home page explicitly.
  const onHome = pathname === '/';
  const linkTo = (hash) => (onHome ? hash : `/${hash}`);

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
          href={linkTo('#top')}
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
            <a key={l.hash} href={linkTo(l.hash)} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
