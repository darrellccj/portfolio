import {defineField, defineType} from 'sanity'

export const ENTRY_KINDS = [
  {title: 'Note', value: 'note'},
  {title: 'Experiment', value: 'experiment'},
  {title: 'Update', value: 'update'},
  {title: 'Checkpoint', value: 'checkpoint'},
]

// One flexible, dated stream — the Log. Formats are deliberately undecided,
// so a new kind of thing becomes a new `kind` or tag here, never a new
// section of the site. Three lines is a valid entry.
export const entry = defineType({
  name: 'entry',
  title: 'Log entry',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'The URL for this entry — /log/<slug>.',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({
      name: 'date',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {list: ENTRY_KINDS, layout: 'radio', direction: 'horizontal'},
      initialValue: 'note',
      validation: (r) => r.required(),
      description:
        'Experiment: a question you are curious about. Update: progress on a project. Checkpoint: the quarterly "is this still the direction?" entry.',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'Lower-case, e.g. "ai". A tag earns its own page only after it has a real thread.',
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 2,
      description: 'One line for the list. Optional — the list falls back to the start of the body.',
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 14,
      description: 'Plain text. Blank lines separate paragraphs.',
    }),
    defineField({
      name: 'project',
      type: 'reference',
      to: [{type: 'project'}],
      description: 'If this is about a project, link it.',
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'If the entry lives somewhere already — e.g. /dither or /lab — link it here.',
    }),
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', date: 'date', kind: 'kind'}, prepare: ({title, date, kind}) => ({
    title,
    subtitle: [date, kind].filter(Boolean).join(' · '),
  })},
})
