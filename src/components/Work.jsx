import useReveal from '../hooks/useReveal.js';
import { projects } from '../data/content.js';

export default function Work() {
  const ref = useReveal({ threshold: 0.1 });

  return (
    <section className="section work" id="work">
      <div className="reveal" ref={ref}>
        <div className="section__head">
          <p className="section__label">02 / Selected work</p>
          <h2 className="section__title">Things I&rsquo;ve built</h2>
        </div>

        <div className="work__list">
          {projects.map((p, i) => (
            <a
              key={p.title}
              className="work-row"
              href={p.href}
              style={{ '--i': i }}
              target={p.href.startsWith('http') ? '_blank' : undefined}
              rel={p.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              <span className="work-row__index">{String(i + 1).padStart(3, '0')}</span>
              <span className="work-row__body">
                <span className="work-row__title">{p.title}</span>
                <span className="work-row__desc">{p.desc}</span>
              </span>
              <span className="work-row__meta">
                <span className="work-row__tag">{p.tag}</span>
                <span className="work-row__year">{p.year}</span>
              </span>
              <span className="work-row__arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
