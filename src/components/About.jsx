'use client';

import useReveal from '../hooks/useReveal.js';

// 2026 redesign — an italic pull-quote (the strongest line pulled
// straight out of the real bio below it) over the full paragraph, plus
// the stack as bordered chips instead of a slash-separated list.
export default function About({ about, stack }) {
  const ref = useReveal();

  return (
    <section className="about" id="about">
      <div className="reveal" ref={ref}>
        <p className="about__label">01 / About</p>

        <p className="about__quote">
          Fencing Singapore didn&rsquo;t have an engineering department, so I became one.
        </p>

        <p className="about__lead">{about}</p>

        <div className="about__stack">
          <span className="about__stack-label">Building with</span>
          <ul>
            {(stack || []).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
