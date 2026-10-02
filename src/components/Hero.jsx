import { formatDate } from '../lib/routes';

// A statement, a plain-language intro for a visitor arriving cold, two ways
// onward, and the open questions. No title or role — the site carries a
// question rather than a label (see docs/direction.md). Server component;
// nothing here needs the browser.
export default function Hero({ profile }) {
  const since = formatDate(profile.exploringSince, { month: true });
  const questions = (profile.questions ?? []).filter(Boolean);

  return (
    <section className="hero" id="top">
      <p className="hero__eyebrow">
        {profile.name}
        {since ? <> &mdash; exploring since {since}</> : null}
      </p>

      {profile.statement ? <h1 className="hero__statement">{profile.statement}</h1> : null}

      {profile.intro ? <p className="hero__intro">{profile.intro}</p> : null}

      <div className="hero__actions">
        <span className="bracket">
          <a className="hero__action hero__action--primary" href="#projects">
            See what I&rsquo;ve made
          </a>
        </span>
        <span className="bracket">
          <a className="hero__action" href="#contact">
            Get in touch
          </a>
        </span>
      </div>

      {questions.length ? (
        <div className="hero__questions">
          <p className="hero__questions-label">Currently exploring</p>
          <ul>
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
