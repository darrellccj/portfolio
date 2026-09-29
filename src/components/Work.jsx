import Link from 'next/link';

import { projectPath } from '../lib/routes';

// 2026 redesign — feature card (the first project from PROJECTS_QUERY,
// Studio-ordered) plus a compact list for the rest. Replaces the old
// pinned horizontal scroll-hijack carousel entirely; see usePinnedScroll's
// removal.
export default function Work({ projects }) {
  const [feature, ...rest] = projects;

  return (
    <section className="work" id="work">
      <div className="work__head">
        <div>
          <p className="work__label">02 / Selected work</p>
          <h2 className="work__title">Things I&rsquo;ve built</h2>
        </div>
        <p className="work__sub">
          Open any one for what it had to solve, how it was built, and where it landed.
        </p>
      </div>

      {feature && (
        <div className="work__grid">
          <div className="work-feature">
            <Link className="work-feature__inner" href={projectPath(feature)}>
              <div className="work-feature__top">
                <span className="work-feature__tag">{feature.tag}</span>
                <span className="work-feature__year">
                  {[feature.year, feature.status].filter(Boolean).join(' · ')}
                </span>
              </div>
              <h3 className="work-feature__title">{feature.title}</h3>
              <p className="work-feature__desc">{feature.desc}</p>
              <div className="work-feature__cta">
                Read the case <span aria-hidden="true">&rarr;</span>
              </div>
            </Link>
          </div>

          <div className="work-list">
            {rest.map((p, i) => (
              <Link key={p._id || p.title} className="work-list__row" href={projectPath(p)}>
                <div className="work-list__main">
                  <span className="work-list__index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="work-list__title">{p.title}</span>
                </div>
                <span className="work-list__tag">{p.tag}</span>
              </Link>
            ))}
            <div className="work-list__foot">
              <span>01 / {String(projects.length).padStart(2, '0')}</span>
              <span className="work-list__foot-line" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
