import {defineField, defineType} from 'sanity'

// `title`, `tag`, `desc`, `year` and `order` drive the card in the pinned
// scroll on the home page. Everything below `slug` exists only for the
// detail page at /work/[slug], and every one of those fields is optional:
// a project with nothing but a card still renders a valid, if short, page.
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'card', title: 'Card', default: true},
    {name: 'page', title: 'Detail page'},
    {name: 'media', title: 'Media'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'card',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'card',
      description: 'The URL for this project — /work/<slug>.',
      options: {source: 'title', maxLength: 96},
    }),
    defineField({
      name: 'tag',
      type: 'string',
      group: 'card',
      description: 'Category shown above the title, e.g. "AI · Proptech".',
    }),
    defineField({
      name: 'desc',
      title: 'Card blurb',
      type: 'text',
      rows: 4,
      group: 'card',
      description: 'The two or three lines that appear on the card and under the title.',
    }),
    defineField({name: 'year', type: 'string', group: 'card'}),
    defineField({
      name: 'order',
      type: 'number',
      group: 'card',
      description: 'Lower numbers appear first in the pinned scroll.',
    }),

    defineField({
      name: 'status',
      type: 'string',
      group: 'page',
      description: 'Where the project stands today.',
      options: {
        list: ['Live', 'In development', 'Shipped', 'Prototype', 'Archived'],
      },
    }),
    defineField({
      name: 'role',
      type: 'string',
      group: 'page',
      description: 'What you did on it, e.g. "Solo — design, engineering, ops".',
    }),
    defineField({
      name: 'timeline',
      type: 'string',
      group: 'page',
      description: 'How long it ran, e.g. "6 weeks, 2025".',
    }),
    defineField({
      name: 'stack',
      title: 'Built with',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      group: 'page',
    }),
    defineField({
      name: 'href',
      title: 'Primary link',
      type: 'string',
      group: 'page',
      description: 'The one link worth putting a button on. Use # if there is nothing to link yet.',
      initialValue: '#',
    }),
    defineField({
      name: 'links',
      title: 'Other links',
      type: 'array',
      of: [{type: 'linkItem'}],
      group: 'page',
      description: 'Repo, case study, press — anything beyond the primary link.',
    }),
    defineField({
      name: 'overview',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'The opening paragraph on the detail page. Longer than the card blurb.',
    }),
    defineField({
      name: 'problem',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'What was broken, missing, or expensive before this existed.',
    }),
    defineField({
      name: 'approach',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'How you built it, and the decisions worth defending.',
    }),
    defineField({
      name: 'outcome',
      type: 'text',
      rows: 6,
      group: 'page',
      description: 'What shipped, who uses it, what it changed.',
    }),
    defineField({
      name: 'metrics',
      type: 'array',
      of: [{type: 'metric'}],
      group: 'page',
      description: 'Up to four numbers worth setting in large type.',
      validation: (r) => r.max(4),
    }),
    defineField({
      name: 'sections',
      title: 'Extra sections',
      type: 'array',
      of: [{type: 'contentSection'}],
      group: 'page',
    }),

    defineField({
      name: 'cover',
      title: 'Cover plate',
      type: 'plate',
      group: 'media',
      description: 'The wide image under the title on the detail page.',
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
  preview: {select: {title: 'title', subtitle: 'tag', media: 'cover'}},
})
