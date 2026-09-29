'use client';

import Link from 'next/link';

import useReveal from '../hooks/useReveal.js';
import { kivPath } from '../lib/routes';

// 2026 redesign — plain stacked list, no feature treatment: every
// concept here is equal weight, unlike Work's newest-project lead.
export default function Kiv({ items }) {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="kiv" id="kiv">
      <div className="reveal" ref={ref}>
        <p className="kiv__label">03 / KIV</p>
        <h2 className="kiv__title">Keep in vault</h2>
        <p className="kiv__sub">
          Concepts in progress — ideas parked where I can see them. Each one opens onto the
          thinking behind it.
        </p>

        <div className="kiv__table">
          {items.map((k, i) => (
            <Link
              className="kiv-row"
              href={kivPath(k)}
              key={k._id || k.title}
              style={{ '--i': i }}
            >
              <span className="kiv-row__index">K{String(i + 1).padStart(2, '0')}</span>
              <div className="kiv-row__body">
                <div className="kiv-row__title">{k.title}</div>
                <div className="kiv-row__desc">{k.desc}</div>
              </div>
              <span className="kiv-row__tag">{k.tag}</span>
              <span className="kiv-row__arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
