import useReveal from '../hooks/useReveal.js';
import { profile, stack } from '../data/content.js';

export default function About() {
  const ref = useReveal();

  return (
    <section className="section about" id="about">
      <div className="reveal" ref={ref}>
        <p className="section__label">01 — About</p>
        <p className="about__lead">{profile.about}</p>

        <div className="about__stack">
          <span className="about__stack-label">Building with</span>
          <ul>
            {stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
