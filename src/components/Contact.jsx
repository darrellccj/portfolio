'use client';

import useReveal from '../hooks/useReveal.js';

// Just an address — no "open to projects", no reply-time promise. This is
// a place to write to, not a sales funnel (see docs/direction.md).
//
// 2026 redesign — reuses the hero's script-plus-bold headline pairing as
// a deliberate bookend rather than a one-off, and folds the old separate
// footer band into this same dark section so the ghost wordmark has one
// place to live instead of two.
export default function Contact({ profile, label = 'Contact' }) {
  const ref = useReveal({ threshold: 0.2 });

  return (
    <section className="contact" id="contact">
      <span className="contact__ghost" aria-hidden="true">
        {profile.name}
      </span>

      <div className="contact__inner reveal" ref={ref}>
        <p className="contact__label">{label}</p>
        <p className="contact__script">Say</p>
        <h2 className="contact__title">hello.</h2>
        <p className="contact__sub">
          If something here is interesting to you, or you think I&rsquo;ve got
          it wrong, I&rsquo;d like to hear about it.
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
          {[profile.name, profile.location].filter(Boolean).join(' · ')}
        </span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}
