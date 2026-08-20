import {defineField, defineType} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'tag',
      type: 'string',
      description: 'Category shown above the title, e.g. "AI · Proptech".',
    }),
    defineField({name: 'desc', title: 'Description', type: 'text', rows: 4}),
    defineField({name: 'year', type: 'string'}),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Live demo, repo, or case study. Use # if there is nothing to link yet.',
      initialValue: '#',
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Lower numbers appear first in the pinned scroll.',
    }),
  ],
  orderings: [
    {title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {select: {title: 'title', subtitle: 'tag'}},
})
