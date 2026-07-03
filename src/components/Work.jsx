import useReveal from '../hooks/useReveal.js';
import { projects } from '../data/content.js';

export default function Work() {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="section work" id="work">
      <div className="reveal" ref={ref}>
        <div className="section__head">
          <p className="section__label">02 — Selected Work</p>
          <h2 className="section__title">Things I've built</h2>
        </div>

        <div className="work__grid">
          {projects.map((p, i) => (
            <a
              key={p.title}
              className="work-card"
              href={p.href}
              style={{ '--i': i }}
              target={p.href.startsWith('http') ? '_blank' : undefined}
              rel={p.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              <div className="work-card__top">
                <span className="work-card__tag">{p.tag}</span>
                <span className="work-card__year">{p.year}</span>
              </div>
              <h3 className="work-card__title">{p.title}</h3>
              <p className="work-card__desc">{p.desc}</p>
              <span className="work-card__cue" aria-hidden="true">
                View
                <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                  <path
                    d="M0 4h18M15 1l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
