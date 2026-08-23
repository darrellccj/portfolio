import Link from 'next/link';

// Previous / next across the same collection, so a detail page is a place
// you can keep reading from rather than a dead end. Either side may be
// missing at the ends of the list; the remaining one keeps its half.

export default function Pager({ prev, next, backHref, backLabel }) {
  return (
    <nav className="d-pager" aria-label="More work">
      <div className="d-pager__grid">
        {prev ? (
          <Link className="d-pager__side d-pager__side--prev" href={prev.href}>
            <span className="d-pager__dir">← Previous</span>
            <span className="d-pager__title">{prev.title}</span>
          </Link>
        ) : (
          <span className="d-pager__side d-pager__side--empty" aria-hidden="true" />
        )}

        {next ? (
          <Link className="d-pager__side d-pager__side--next" href={next.href}>
            <span className="d-pager__dir">Next →</span>
            <span className="d-pager__title">{next.title}</span>
          </Link>
        ) : (
          <span className="d-pager__side d-pager__side--empty" aria-hidden="true" />
        )}
      </div>

      <Link className="d-pager__back" href={backHref}>
        {backLabel}
      </Link>
    </nav>
  );
}
