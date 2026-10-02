import {
  at,
  createIfNotExists,
  defineMigration,
  delete_,
  patch,
  set,
  setIfMissing,
  unset,
  type NodePatch,
} from 'sanity/migrate'

import content from './content.json'

// October 2026 restructure — see docs/direction.md.
//
//   profile  → drops role / roles / tagline / stack; gains statement,
//              exploringSince, questions, background. The old builder bio
//              is kept in `aboutPrevious` (not in the schema, so the Studio
//              flags it — delete it once you no longer want it).
//   project  → overview / problem / approach / outcome move into `sections`
//              under their old headings, so nothing written is lost;
//              metrics / role / stack go. Every status not in the new list
//              becomes "Parked". Website Factory becomes an "Idea".
//   kivItem  → becomes a project with status "Idea", same slug, so
//              /kiv/<slug> redirects land on it. The kivItem is deleted.
//   new      → the property agent site (Done) and two log entries for the
//              existing dither study and Lab experiment.
//
// Published documents only; drafts of projects and the profile are left as
// they are. Run a dry run first:
//
//   npx sanity migration run restructure-2026-10
//   npx sanity migration run restructure-2026-10 --no-dry-run

const STATUSES = new Set(['Idea', 'In progress', 'Parked', 'Done'])
const OLD_PROJECT_FIELDS = ['overview', 'problem', 'approach', 'outcome'] as const
const OLD_HEADINGS: Record<(typeof OLD_PROJECT_FIELDS)[number], string> = {
  overview: 'Overview',
  problem: 'Problem',
  approach: 'Approach',
  outcome: 'Outcome',
}

type Doc = {_id: string; _type: string; [field: string]: unknown}

const key = () => Math.random().toString(36).slice(2, 12)
const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
const section = (heading: string, body: string) => ({_key: key(), _type: 'contentSection', heading, body})

function migrateProfile(doc: Doc) {
  const next = content.profile
  const ops: NodePatch[] = [
    at('role', unset()),
    at('roles', unset()),
    at('tagline', unset()),
    at('stack', unset()),
    at('statement', setIfMissing(next.statement)),
    at('exploringSince', setIfMissing(next.exploringSince)),
    at('questions', setIfMissing(next.questions)),
    at('background', setIfMissing(next.background)),
  ]
  // Only on the first run: once `aboutPrevious` exists the new About may
  // already have been rewritten by hand, and must not be overwritten.
  if (!doc.aboutPrevious) {
    if (text(doc.about)) ops.push(at('aboutPrevious', set(doc.about)))
    ops.push(at('about', set(next.about)))
  }
  return patch(doc._id, ops)
}

function migrateProject(doc: Doc) {
  const moved = OLD_PROJECT_FIELDS.flatMap((field) => {
    const body = text(doc[field])
    return body ? [section(OLD_HEADINGS[field], body)] : []
  })
  const existing = Array.isArray(doc.sections) ? doc.sections : []

  const ops: NodePatch[] = [
    ...OLD_PROJECT_FIELDS.map((field) => at(field, unset())),
    at('metrics', unset()),
    at('role', unset()),
    at('stack', unset()),
  ]
  if (moved.length) ops.push(at('sections', set([...moved, ...existing])))

  const isFactory = doc._id === 'project-website-factory' || doc.title === 'Website Factory'
  if (isFactory) {
    const factory = content.websiteFactory
    ops.push(at('status', set(factory.status)))
    ops.push(at('desc', set(factory.desc)))
    ops.push(at('standing', setIfMissing(factory.standing)))
  } else if (!STATUSES.has(String(doc.status ?? ''))) {
    ops.push(at('status', set('Parked')))
  }
  return patch(doc._id, ops)
}

function kivToProject(doc: Doc) {
  const sections = [
    text(doc.why) ? section('Why it is worth building', doc.why as string) : null,
    ...(Array.isArray(doc.sections) ? doc.sections : []),
  ].filter(Boolean)

  const project: Doc = {
    _id: `project-${doc._id}`,
    _type: 'project',
    title: doc.title,
    status: 'Idea',
    order: 100 + (typeof doc.order === 'number' ? doc.order : 0),
  }
  if (doc.slug) project.slug = doc.slug
  if (text(doc.tag)) project.tag = doc.tag
  if (text(doc.desc)) project.desc = doc.desc
  if (text(doc.premise)) project.standing = doc.premise
  if (Array.isArray(doc.openQuestions) && doc.openQuestions.length) project.openQuestions = doc.openQuestions
  if (Array.isArray(doc.notes) && doc.notes.length) project.notes = doc.notes
  if (sections.length) project.sections = sections

  return [createIfNotExists(project), delete_(doc._id)]
}

export default defineMigration({
  title: 'Restructure into Projects and Log (October 2026)',
  documentTypes: ['profile', 'project', 'kivItem'],

  async *migrate(documents) {
    for await (const raw of documents()) {
      const doc = raw as Doc
      if (doc._type === 'kivItem') {
        // A KIV draft has no type to live under any more; a published one
        // becomes a project.
        yield doc._id.startsWith('drafts.') ? delete_(doc._id) : kivToProject(doc)
        continue
      }
      if (doc._id.startsWith('drafts.')) continue
      if (doc._type === 'profile') yield migrateProfile(doc)
      if (doc._type === 'project') yield migrateProject(doc)
    }

    yield [...content.newProjects, ...content.newEntries].map((doc) => createIfNotExists(doc))
  },
})
