'use client';

import Link from 'next/link';

import useReveal from '../hooks/useReveal.js';
import { kivPath } from '../lib/routes';

export default function Kiv({ items }) {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="section kiv" id="kiv">
      <div className="reveal" ref={ref}>
        <div className="section__head">
          <p className="section__label">03 / KIV</p>
          <h2 className="section__title">Keep in vault</h2>
          <p className="section__sub">
            Concepts in progress — ideas parked where I can see them. Each one opens onto the
            thinking behind it.
          </p>
        </div>

        <div className="kiv__table">
          {items.map((k, i) => (
            <Link
              className="kiv-row"
              href={kivPath(k)}
              key={k._id || k.title}
              style={{ '--i': i }}
            >
              <span className="kiv-row__index">K{String(i + 1).padStart(2, '0')}</span>
              <span className="kiv-row__tag">{k.tag}</span>
              <span className="kiv-row__title">{k.title}</span>
              <span className="kiv-row__desc">{k.desc}</span>
              <span className="kiv-row__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
