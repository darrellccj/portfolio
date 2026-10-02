import Link from 'next/link';
import Nav from '@/components/Nav';

// Covers a mistyped project or log slug as well as any other missing URL
// under (site), so it inherits globals.css and the paper background.
export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="detail detail--empty">
        <div className="detail__inner">
          <p className="detail__eyebrow">404</p>
          <h1 className="detail__title">Nothing filed here.</h1>
          <p className="detail__lede">
            The page you asked for either moved or never existed.
          </p>
          <div className="d-links">
            <Link className="d-links__primary" href="/">
              Back to the start
            </Link>
            <Link className="d-links__link" href="/projects">
              Projects
            </Link>
            <Link className="d-links__link" href="/log">
              Log
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
