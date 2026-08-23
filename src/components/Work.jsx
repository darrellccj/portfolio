'use client';

import Link from 'next/link';

import usePinnedScroll from '../hooks/usePinnedScroll.js';
import { projectPath } from '../lib/routes';

export default function Work({ projects }) {
  const { sectionRef, trackRef, progressRef, counterRef } = usePinnedScroll();

  return (
    <section className="work" id="work">
      <div className="section work__head">
        <p className="section__label">02 / Selected work</p>
        <h2 className="section__title">Things I&rsquo;ve built</h2>
        <p className="section__sub">
          Open any card for the full account — what it had to solve, how it was built, and
          where it landed.
        </p>
      </div>

      <div className="work__pin" ref={sectionRef}>
        <div className="work__sticky">
          {/* Cards link to their own page; the project's own live link
              lives on that page rather than competing with it here. */}
          <div className="work__track" ref={trackRef}>
            {projects.map((p, i) => (
              <Link key={p._id || p.title} className="work-card" href={projectPath(p)}>
                <div className="work-card__top">
                  <span className="work-card__index">{String(i + 1).padStart(3, '0')}</span>
                  <span className="work-card__tag">{p.tag}</span>
                </div>
                <div>
                  <h3 className="work-card__title">{p.title}</h3>
                  <p className="work-card__desc">{p.desc}</p>
                </div>
                <div className="work-card__foot">
                  <span className="work-card__year">
                    {[p.year, p.status].filter(Boolean).join(' · ')}
                  </span>
                  <span className="work-card__cta">
                    Read <span className="work-card__arrow" aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
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
