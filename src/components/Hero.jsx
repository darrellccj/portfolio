import SkyGL from './SkyGL.jsx';

// Server component — the only client work here is the sky canvas.
export default function Hero({ profile }) {
  return (
    <section className="hero" id="top">
      {/* Duotone sky — rendered in the site's two inks only. */}
      <SkyGL />

      <div className="hero__inner">
        <p className="hero__eyebrow">{profile.role}</p>
        <h1 className="hero__name">{profile.name}</h1>
        <p className="hero__tagline">{profile.tagline}</p>
      </div>

      {/* Spec strip: the hero's baseline reads like a title block. */}
      <div className="hero__meta" aria-hidden="true">
        <span>LOC — {(profile.location || '').toUpperCase()}</span>
        <span className="hero__meta-fig">FIG. 01 — SKY, DUOTONE</span>
        <a href="#about" className="hero__scroll" aria-hidden="false" aria-label="Scroll to content">
          SCROLL ↓
        </a>
      </div>
    </section>
  );
}
