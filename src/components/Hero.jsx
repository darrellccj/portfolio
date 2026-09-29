import TypedRole from './TypedRole.jsx';

const roleWords = (profile) => (profile.roles?.length ? profile.roles : [profile.role]);

// 2026 redesign — centred and purely typographic. The WebGL sky is gone
// (see SkyGL's removal); personality now comes from the script-plus-bold
// headline pairing instead of a background device. Server component —
// only the role typewriter needs the client.
export default function Hero({ profile }) {
  return (
    <section className="hero" id="top">
      <p className="hero__eyebrow">
        <TypedRole words={roleWords(profile)} /> &mdash; {(profile.location || '').toUpperCase()}
      </p>

      <p className="hero__script">Software an institution</p>
      <h1 className="hero__name">didn&rsquo;t know it needed.</h1>

      <p className="hero__sub">
        Solo, AI-assisted, and <mark>fast</mark> &mdash; for institutions without a tech team,
        niches nobody&rsquo;s built for, and problems in my own life.
      </p>

      <div className="hero__actions">
        <div className="bracket">
          <a href="#work" className="hero__cta">
            See the work
          </a>
        </div>
        <a href="/lab" className="hero__cta--outline">
          Read the log
        </a>
      </div>
    </section>
  );
}
