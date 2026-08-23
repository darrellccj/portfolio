import {defineField, defineType} from 'sanity'

// KIV items are ideas, not shipped work, so the detail page at
// /kiv/[slug] is shaped around thinking rather than outcomes: the
// premise, why it is worth building, what is still unresolved.
export const kivItem = defineType({
  name: 'kivItem',
  title: 'KIV item',
  type: 'document',
  description: 'Keep in vault — concepts in progress.',
  groups: [
    {name: 'row', title: 'Row', default: true},
    {name: 'page', title: 'Detail page'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'row', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'row',
      description: 'The URL for this concept — /kiv/<slug>.',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({name: 'tag', type: 'string', group: 'row'}),
    defineField({
      name: 'desc',
      title: 'Row blurb',
      type: 'text',
      rows: 3,
      group: 'row',
      description: 'The one line that appears in the KIV table.',
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'row',
      description: 'Lower numbers appear first.',
    }),

    defineField({
      name: 'status',
      type: 'string',
      group: 'page',
      description: 'How far along the thinking is.',
      options: {
        list: ['Parked', 'Researching', 'Sketching', 'Prototyping', 'Next up'],
      },
    }),
    defineField({
      name: 'premise',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'The idea in full — what it is and how it would work.',
    }),
    defineField({
      name: 'why',
      title: 'Why it is worth building',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'The gap it fills, or the reason it keeps coming back to you.',
    }),
    defineField({
      name: 'notes',
      type: 'array',
      of: [{type: 'string'}],
      group: 'page',
      description: 'Loose thoughts, one per line.',
    }),
    defineField({
      name: 'openQuestions',
      title: 'Open questions',
      type: 'array',
      of: [{type: 'string'}],
      group: 'page',
      description: 'What has to be answered before this leaves the vault.',
    }),
    defineField({
      name: 'stack',
      title: 'Would build with',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      group: 'page',
    }),
    defineField({
      name: 'sections',
      title: 'Extra sections',
      type: 'array',
      of: [{type: 'contentSection'}],
      group: 'page',
    }),
  ],
  orderings: [
    {title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {select: {title: 'title', subtitle: 'tag'}},
})
