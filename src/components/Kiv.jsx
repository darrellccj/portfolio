import useReveal from '../hooks/useReveal.js';
import { kiv } from '../data/content.js';

export default function Kiv() {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="section kiv" id="kiv">
      <div className="reveal" ref={ref}>
        <div className="section__head">
          <p className="section__label">03 — KIV</p>
          <h2 className="section__title">Keep in view</h2>
          <p className="section__sub">Concepts in progress — ideas parked where I can see them.</p>
        </div>

        <div className="kiv__grid">
          {kiv.map((k, i) => (
            <div className="kiv-card" key={k.title} style={{ '--i': i }}>
              <span className="kiv-card__tag">{k.tag}</span>
              <h3 className="kiv-card__title">{k.title}</h3>
              <p className="kiv-card__desc">{k.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
