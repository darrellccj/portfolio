import KoiPond from './KoiPond.jsx';
import { profile } from '../data/content.js';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <KoiPond />
      <div className="hero__inner">
        <p className="hero__eyebrow">{profile.role}</p>
        <h1 className="hero__name">{profile.name}</h1>
        <p className="hero__tagline">{profile.tagline}</p>
      </div>
      <a href="#about" className="hero__scroll" aria-label="Scroll to content">
        <span>Scroll</span>
        <svg width="14" height="9" viewBox="0 0 14 9" fill="none" aria-hidden="true">
          <path
            d="M1 1L7 7L13 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
