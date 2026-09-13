'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import logoCloud from '../assets/logo-cloud.png';

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

  // Split evenly either side of the centred mark — three tabs left,
  // three right — rather than one solid block after the logo.
  const half = Math.ceil(LINKS.length / 2);
  const leftLinks = LINKS.slice(0, half);
  const rightLinks = LINKS.slice(half);

  const renderLink = (l) => (
    <a key={l.label} href={l.href ?? linkTo(l.hash)} onClick={() => setOpen(false)}>
      {l.label}
    </a>
  );

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''} ${open ? 'nav--open' : ''}`}>
      <div className="nav__pill">
        <nav className="nav__links nav__links--left" aria-label="Primary">
          {leftLinks.map(renderLink)}
        </nav>

        <a
          href={linkTo('#top')}
          className="nav__brand"
          aria-label="Back to top"
          onClick={() => setOpen(false)}
        >
          <Image src={logoCloud} alt="" priority className="nav__logo" />
        </a>

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

        <nav id="nav-links" className="nav__links-mobile" aria-label="Sections">
          {LINKS.map(renderLink)}
        </nav>
      </div>
    </header>
  );
}
