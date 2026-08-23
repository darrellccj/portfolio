'use client';

import useReveal from '../hooks/useReveal.js';
import StudioModeToggle from './StudioModeToggle';

// `label` is overridable because the numbered section prefix only makes
// sense on the home page, where Contact is the fifth movement.
export default function Contact({ profile, label = '05 / Contact' }) {
  const ref = useReveal({ threshold: 0.2 });

  return (
    <section className="contact" id="contact">
      <div className="contact__inner reveal" ref={ref}>
        <p className="section__label">{label}</p>
        <h2 className="contact__title">Let&rsquo;s make something.</h2>
        <p className="contact__sub">
          Open to selected projects and collaborations. I reply to every
          message, usually within a day.
        </p>

        <a className="contact__email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>

        <div className="contact__socials">
          {(profile.socials || []).map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel={s.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <footer className="footer">
        <span>
          {profile.name} · {profile.location}
        </span>
        <StudioModeToggle />
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}
