import {defineField, defineType} from 'sanity'

export const kivItem = defineType({
  name: 'kivItem',
  title: 'KIV item',
  type: 'document',
  description: 'Keep in vault — concepts in progress.',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'tag', type: 'string'}),
    defineField({name: 'desc', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'order', type: 'number', description: 'Lower numbers appear first.'}),
  ],
  orderings: [
    {title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {select: {title: 'title', subtitle: 'tag'}},
})
