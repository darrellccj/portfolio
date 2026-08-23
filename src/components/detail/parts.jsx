import Image from 'next/image';

// Presentational pieces shared by /work/[slug] and /kiv/[slug]. All server
// components: the detail pages have no interactive state, and their
// entrance animation is CSS-only (see `.detail-reveal` in globals.css), so
// nothing here needs to reach the browser as JavaScript.

/**
 * Sanity `text` fields hold plain strings with hand-typed line breaks.
 * Blank lines separate paragraphs; a body that only ever uses single
 * newlines gets treated the same way rather than collapsing into one wall.
 */
export function Prose({ text }) {
  if (!text) return null;
  const source = String(text).trim();
  if (!source) return null;

  let paragraphs = source.split(/\n{2,}/);
  if (paragraphs.length === 1) paragraphs = source.split(/\n/);

  const cleaned = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length) return null;

  return (
    <div className="prose">
      {cleaned.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** A labelled block: mono label in the left rail, content in the column. */
export function Block({ label, index = 0, children }) {
  if (!children) return null;
  return (
    <section className="d-block detail-reveal" style={{ '--i': index }}>
      <p className="d-block__label">{label}</p>
      <div className="d-block__body">{children}</div>
    </section>
  );
}

/** Same rail, but for a prose field — skips itself entirely when empty. */
export function TextBlock({ label, text, index = 0 }) {
  if (!text || !String(text).trim()) return null;
  return (
    <Block label={label} index={index}>
      <Prose text={text} />
    </Block>
  );
}

/** Key/value strip under the title. Values may be a string or a list. */
export function Spec({ items }) {
  const rows = items.filter((it) => {
    if (!it) return false;
    return Array.isArray(it.value) ? it.value.length > 0 : Boolean(it.value);
  });
  if (!rows.length) return null;

  return (
    <dl className="d-spec detail-reveal">
      {rows.map((row) => (
        <div className="d-spec__row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>
            {Array.isArray(row.value) ? (
              <ul className="d-spec__list">
                {row.value.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbers worth setting large. Renders nothing below one entry. */
export function Metrics({ items }) {
  if (!items?.length) return null;
  return (
    <div className="d-metrics detail-reveal">
      {items.map((m, i) => (
        <div className="d-metric" key={i}>
          <span className="d-metric__value">{m.value}</span>
          <span className="d-metric__label">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A list of strings as hairline-separated rows — notes, open questions. */
export function Notes({ items, ordered = false }) {
  if (!items?.length) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <List className={`d-notes ${ordered ? 'd-notes--ordered' : ''}`.trim()}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </List>
  );
}

/**
 * A framed image. `aspect` comes from Sanity's asset metadata, so the box
 * is reserved at its real ratio and the page never reflows on load; `lqip`
 * is the base64 thumbnail Sanity generates for the same asset.
 */
export function Plate({ image, priority = false, sizes = '(max-width: 880px) 100vw, 880px' }) {
  if (!image?.url) return null;
  const width = 1600;
  const height = Math.round(width / (image.aspect || 16 / 9));

  return (
    <figure className="d-plate detail-reveal">
      <div className="d-plate__frame">
        <Image
          src={image.url}
          alt={image.alt || ''}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          placeholder={image.lqip ? 'blur' : 'empty'}
          blurDataURL={image.lqip || undefined}
        />
      </div>
      {image.caption ? <figcaption>{image.caption}</figcaption> : null}
    </figure>
  );
}

/** Outbound links. The primary one reads as a button; the rest as a row. */
export function LinkRow({ primary, links }) {
  const extra = (links || []).filter((l) => l?.href && l?.label);
  const hasPrimary = primary?.href && primary.href !== '#';
  if (!hasPrimary && !extra.length) return null;

  const attrs = (href) =>
    href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {};

  return (
    <div className="d-links detail-reveal">
      {hasPrimary ? (
        <a className="d-links__primary" href={primary.href} {...attrs(primary.href)}>
          {primary.label} <span aria-hidden="true">↗</span>
        </a>
      ) : null}
      {extra.map((l) => (
        <a key={l.label} className="d-links__link" href={l.href} {...attrs(l.href)}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
