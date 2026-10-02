import { formatDate } from '../lib/routes';

// A statement and a few open questions — no title, no role, no calls to
// action. The site carries a question rather than a label (see
// docs/direction.md). Server component; nothing here needs the browser.
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
