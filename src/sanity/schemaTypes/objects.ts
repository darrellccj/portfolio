import {defineField, defineType} from 'sanity'

// Shared building blocks for the project / KIV detail pages. They are
// registered as named types rather than inlined so both document types
// stay readable and TypeGen emits one type per shape instead of a dozen
// anonymous ones.

export const linkItem = defineType({
  name: 'linkItem',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (r) => r.required().uri({scheme: ['http', 'https', 'mailto']}),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})

export const metric = defineType({
  name: 'metric',
  title: 'Metric',
  type: 'object',
  description: 'A single number worth putting in large type.',
  fields: [
    defineField({
      name: 'value',
      type: 'string',
      description: 'Keep it short — "12k", "3 weeks", "1 person".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'label',
      type: 'string',
      description: 'What the number counts.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {select: {title: 'value', subtitle: 'label'}},
})

export const contentSection = defineType({
  name: 'contentSection',
  title: 'Section',
  type: 'object',
  description: 'A free-form block for anything the fixed fields do not cover.',
  fields: [
    defineField({name: 'heading', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'body', type: 'text', rows: 8, validation: (r) => r.required()}),
  ],
  preview: {select: {title: 'heading', subtitle: 'body'}},
})

export const plate = defineType({
  name: 'plate',
  title: 'Plate',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers.',
      validation: (r) => r.required(),
    }),
    defineField({name: 'caption', type: 'string'}),
  ],
  preview: {select: {title: 'caption', subtitle: 'alt', media: 'asset'}},
})
