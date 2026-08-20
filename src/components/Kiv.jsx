'use client';

import useReveal from '../hooks/useReveal.js';

export default function Kiv({ items }) {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="section kiv" id="kiv">
      <div className="reveal" ref={ref}>
        <div className="section__head">
          <p className="section__label">03 / KIV</p>
          <h2 className="section__title">Keep in vault</h2>
          <p className="section__sub">Concepts in progress — ideas parked where I can see them.</p>
        </div>

        <div className="kiv__table" role="list">
          {items.map((k, i) => (
            <div className="kiv-row" role="listitem" key={k._id || k.title} style={{ '--i': i }}>
              <span className="kiv-row__index">K{String(i + 1).padStart(2, '0')}</span>
              <span className="kiv-row__tag">{k.tag}</span>
              <span className="kiv-row__title">{k.title}</span>
              <span className="kiv-row__desc">{k.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
