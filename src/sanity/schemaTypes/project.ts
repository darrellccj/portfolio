import {defineField, defineType} from 'sanity'

export const PROJECT_STATUSES = ['Idea', 'In progress', 'Parked', 'Done'] as const

// A project is something made *for someone* — a client, or yourself with a
// defined problem. If you can only name what you are curious about, it is
// a log entry instead (see docs/direction.md).
//
// Only `title`, `status` and `desc` are needed for the list. The write-up
// fields are for projects that have earned one; ideas and parked projects
// use `standing` and `openQuestions` instead. Every page field is optional,
// so a project with nothing but a line still renders a valid page.
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'list', title: 'List', default: true},
    {name: 'writeup', title: 'Write-up'},
    {name: 'unfinished', title: 'Idea / parked'},
    {name: 'media', title: 'Media & links'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'list',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'list',
      description: 'The URL for this project — /projects/<slug>.',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'list',
      description: 'Where it honestly stands. Unfinished is fine; hiding it is not.',
      options: {list: [...PROJECT_STATUSES], layout: 'radio', direction: 'horizontal'},
      initialValue: 'Idea',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'desc',
      title: 'One line',
      type: 'text',
      rows: 2,
      group: 'list',
      description: 'Who it was for and what it does, in a sentence.',
    }),
    defineField({
      name: 'tag',
      type: 'string',
      group: 'list',
      description: 'Optional context, e.g. "Proptech".',
    }),
    defineField({name: 'year', type: 'string', group: 'list'}),
    defineField({
      name: 'order',
      type: 'number',
      group: 'list',
      description: 'Lower numbers appear first within the same status.',
    }),

    defineField({
      name: 'need',
      title: 'The need',
      type: 'text',
      rows: 6,
      group: 'writeup',
      description: 'Who it was for and what they actually needed.',
    }),
    defineField({
      name: 'requirements',
      title: 'Their requirements',
      type: 'text',
      rows: 6,
      group: 'writeup',
      description: 'What the client (or you, as the client) asked for.',
    }),
    defineField({
      name: 'judgement',
      title: 'Where my judgement differed',
      type: 'text',
      rows: 6,
      group: 'writeup',
      description: 'Where you went against the brief, the client or the AI — and why.',
    }),
    defineField({
      name: 'decisions',
      title: 'Decisions and trade-offs',
      type: 'text',
      rows: 6,
      group: 'writeup',
    }),
    defineField({
      name: 'change',
      title: 'What I would change',
      type: 'text',
      rows: 6,
      group: 'writeup',
    }),
    defineField({
      name: 'sections',
      title: 'Extra sections',
      type: 'array',
      of: [{type: 'contentSection'}],
      group: 'writeup',
      description: 'Anything the fields above do not cover.',
    }),

    defineField({
      name: 'standing',
      title: 'Where it stands',
      type: 'text',
      rows: 5,
      group: 'unfinished',
      description: 'What you were trying to figure out, how far it got, and why it stopped (or has not started).',
    }),
    defineField({
      name: 'openQuestions',
      title: 'Open questions',
      type: 'array',
      of: [{type: 'string'}],
      group: 'unfinished',
    }),
    defineField({
      name: 'notes',
      type: 'array',
      of: [{type: 'string'}],
      group: 'unfinished',
      description: 'Loose thoughts, one per line.',
    }),

    defineField({
      name: 'timeline',
      type: 'string',
      group: 'media',
      description: 'When it ran, e.g. "Aug – Sep 2026".',
    }),
    defineField({
      name: 'href',
      title: 'Primary link',
      type: 'string',
      group: 'media',
      description: 'The live thing, if there is one. Leave empty or # if not.',
    }),
    defineField({
      name: 'links',
      title: 'Other links',
      type: 'array',
      of: [{type: 'linkItem'}],
      group: 'media',
    }),
    defineField({
      name: 'cover',
      title: 'Cover plate',
      type: 'plate',
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      type: 'array',
      of: [{type: 'plate'}],
      group: 'media',
    }),
  ],
  orderings: [
    {title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {select: {title: 'title', subtitle: 'status', media: 'cover'}},
})
