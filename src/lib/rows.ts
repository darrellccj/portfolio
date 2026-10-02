import {excerpt, formatDate, logPath, projectPath} from './routes';

// Shapes Sanity results into IndexList rows, so the home page and the
// /projects and /log indexes can't drift apart in what a row shows.

type ProjectLike = {
  _id: string;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  desc?: string | null;
  year?: string | null;
};

type EntryLike = {
  _id: string;
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  kind?: string | null;
  summary?: string | null;
};

export const projectRow = (p: ProjectLike) => ({
  key: p._id,
  href: projectPath(p),
  rail: p.status ?? '',
  title: p.title ?? 'Untitled',
  desc: p.desc ?? '',
  tag: p.year ?? '',
});

export const entryRow = (e: EntryLike) => ({
  key: e._id,
  href: logPath(e),
  rail: formatDate(e.date),
  title: e.title ?? 'Untitled',
  desc: excerpt(e.summary),
  tag: e.kind ?? '',
});
