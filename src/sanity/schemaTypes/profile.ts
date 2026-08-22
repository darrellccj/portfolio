import {defineField, defineType} from 'sanity'

export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  // Singleton — one document, fixed id, managed via Studio structure.
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'role', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'roles',
      title: 'Roles (typewriter)',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Optional — short phrases the hero eyebrow cycles through. Falls back to Role above if empty.',
    }),
    defineField({
      name: 'tagline',
      type: 'text',
      rows: 3,
      description: 'Hero line — keep it to one calm sentence.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'about',
      type: 'text',
      rows: 8,
      description: 'Longer about paragraph.',
    }),
    defineField({name: 'email', type: 'string', validation: (r) => r.required().email()}),
    defineField({name: 'location', type: 'string'}),
    defineField({
      name: 'stack',
      title: 'Building with',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'socials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'href', type: 'url', validation: (r) =>
              r.required().uri({scheme: ['http', 'https', 'mailto']}),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'href'}},
        },
      ],
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'role'}},
})
