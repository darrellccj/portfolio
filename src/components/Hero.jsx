import SkyGL from './SkyGL.jsx';
import TypedRole from './TypedRole.jsx';

const roleWords = (profile) => (profile.roles?.length ? profile.roles : [profile.role]);

// Server component — the sky canvas and the typewriter eyebrow are
// the only client work; everything else renders on the server.
export default function Hero({ profile }) {
  return (
    <section className="hero" id="top">
      {/* Duotone sky — rendered in the site's two inks only. */}
      <SkyGL />

      <div className="hero__inner">
        <p className="hero__eyebrow">
          <TypedRole words={roleWords(profile)} />
        </p>
        <h1 className="hero__name">{profile.name}</h1>
      </div>

      {/* Bottom strip: a running tagline ticker over the spec title block. */}
      <div className="hero__strip">
        <div className="hero__ticker">
          <div className="hero__ticker-track">
            <span>{profile.tagline}</span>
            <span aria-hidden="true">{profile.tagline}</span>
          </div>
        </div>
        <div className="hero__meta" aria-hidden="true">
          <span>LOC — {(profile.location || '').toUpperCase()}</span>
          <span className="hero__meta-fig">FIG. 01 — SKY, DUOTONE</span>
          <a href="#about" className="hero__scroll" aria-hidden="false" aria-label="Scroll to content">
            SCROLL ↓
          </a>
        </div>
      </div>
    </section>
  );
}
