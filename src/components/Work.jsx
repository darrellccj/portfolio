'use client';

import usePinnedScroll from '../hooks/usePinnedScroll.js';

export default function Work({ projects }) {
  const { sectionRef, trackRef, progressRef, counterRef } = usePinnedScroll();

  return (
    <section className="work" id="work">
      <div className="section work__head">
        <p className="section__label">02 / Selected work</p>
        <h2 className="section__title">Things I&rsquo;ve built</h2>
      </div>

      <div className="work__pin" ref={sectionRef}>
        <div className="work__sticky">
          <div className="work__track" ref={trackRef}>
            {projects.map((p, i) => {
              const href = p.href || '#';
              const external = href.startsWith('http');
              return (
                <a
                  key={p._id || p.title}
                  className="work-card"
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                >
                  <div className="work-card__top">
                    <span className="work-card__index">{String(i + 1).padStart(3, '0')}</span>
                    <span className="work-card__tag">{p.tag}</span>
                  </div>
                  <div>
                    <h3 className="work-card__title">{p.title}</h3>
                    <p className="work-card__desc">{p.desc}</p>
                  </div>
                  <div className="work-card__foot">
                    <span className="work-card__year">{p.year}</span>
                    <span className="work-card__arrow" aria-hidden="true">
                      →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="work__meta">
            <span className="work__counter">
              <b ref={counterRef}>01</b> / {String(projects.length).padStart(2, '0')}
            </span>
            <div className="work__progress">
              <div className="work__progress-fill" ref={progressRef} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
