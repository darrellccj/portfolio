type Entry = {slug?: string | null; title?: string | null};

/**
 * With Visual Editing on, Sanity encodes an invisible payload into every
 * string it returns, using Unicode tag characters (U+E0000–U+E007F). They
 * are harmless in rendered copy — that is the point — but they would end
 * up percent-encoded in a URL, so slug inputs get stripped first.
 *
 * Done with a regex rather than `stegaClean` from next-sanity so this
 * module stays free of the Sanity client: it is imported by the Work and
 * KIV components, which are client components, and pulling the client in
 * behind them would put it in the browser bundle.
 */
const stripStega = (value: string) => value.replace(/[\u{E0000}-\u{E007F}]/gu, '');

/** "What to Eat" → "what-to-eat". */
export function toSlug(value: string): string {
  return stripStega(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The slug a document is actually reachable at.
 *
 * `slug` is authored in the Studio, but it was added to the schema after
 * these documents existed, so anything created before it is still null.
 * Falling back to a slugified title means every project and KIV item has a
 * working URL the moment this ships; filling the field in later only pins
 * a slug that already worked.
 */
export function entrySlug(entry: Entry): string {
  const authored = stripStega(entry.slug ?? '').trim();
  if (authored) return authored;
  return toSlug(entry.title ?? '');
}

export const projectPath = (entry: Entry) => `/work/${entrySlug(entry)}`;
export const kivPath = (entry: Entry) => `/kiv/${entrySlug(entry)}`;

/** Index position of the entry a URL slug refers to, or -1. */
export function indexOfSlug(entries: Entry[], slug: string): number {
  return entries.findIndex((entry) => entrySlug(entry) === slug);
}
