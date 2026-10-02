'use client';

import Link from 'next/link';

import useReveal from '../hooks/useReveal.js';

// One list pattern for both Projects and the Log: a rail on the left (a
// status or a date), the title and one line, and a tag on the right. Every
// row is equal weight — there is no featured item on purpose.
//
// Rows are shaped by the caller — see src/lib/rows.ts.
export type IndexRow = {
  key: string;
  href: string;
  rail: string;
  title: string;
  desc?: string;
  tag?: string;
};

type Props = {
  id?: string;
  label?: string;
  title?: string;
  sub?: string;
  rows: IndexRow[];
  empty: string;
  more?: {href: string; label: string} | null;
};

export default function IndexList({id, label, title, sub, rows, empty, more}: Props) {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="list" id={id}>
      <div className="reveal" ref={ref}>
        {label ? <p className="list__label">{label}</p> : null}
        {title ? <h2 className="list__title">{title}</h2> : null}
        {sub ? <p className="list__sub">{sub}</p> : null}

        <div className="list__table">
          {rows.length ? (
            rows.map((row, i) => (
              <Link className="list-row" href={row.href} key={row.key} style={{'--i': i} as React.CSSProperties}>
                <span className="list-row__index">{row.rail}</span>
                <div className="list-row__body">
                  <div className="list-row__title">{row.title}</div>
                  {row.desc ? <div className="list-row__desc">{row.desc}</div> : null}
                </div>
                <span className="list-row__tag">{row.tag}</span>
                <span className="list-row__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            ))
          ) : (
            <p className="list__empty">{empty}</p>
          )}
        </div>

        {more ? (
          <Link className="list__more" href={more.href}>
            {more.label} <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
