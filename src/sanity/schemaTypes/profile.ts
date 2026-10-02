import {defineField, defineType} from 'sanity'

// No role, title or stack fields on purpose — see docs/direction.md. The
// site carries a question rather than a label.
export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  // Singleton — one document, fixed id, managed via Studio structure.
  groups: [
    {name: 'home', title: 'Home', default: true},
    {name: 'about', title: 'About'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    defineField({name: 'name', type: 'string', group: 'home', validation: (r) => r.required()}),
    defineField({
      name: 'statement',
      type: 'text',
      rows: 2,
      group: 'home',
      description: 'The one sentence at the top of the home page. What you are doing, not what you are.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'intro',
      type: 'text',
      rows: 3,
      group: 'home',
      description:
        'Two plain sentences for someone who knows nothing about you: what you make, who it is for, and what a visitor will find here. No jargon, no private doubts.',
    }),
    defineField({
      name: 'exploringSince',
      type: 'date',
      group: 'home',
      description: 'When this started. Shown next to the statement.',
      options: {dateFormat: 'MMMM YYYY'},
    }),
    defineField({
      name: 'questions',
      title: 'Currently exploring',
      type: 'array',
      of: [{type: 'string'}],
      group: 'home',
      description: 'Two or three open questions. Change them at each checkpoint.',
      validation: (r) => r.max(3),
    }),

    defineField({
      name: 'about',
      type: 'text',
      rows: 10,
      group: 'about',
      description: 'The About page, written as a "now" page — why you started, what you are unsure of. Blank lines separate paragraphs.',
    }),
    defineField({
      name: 'background',
      type: 'text',
      rows: 2,
      group: 'about',
      description: 'One or two lines. Study, school — nothing more.',
    }),

    defineField({
      name: 'email',
      type: 'string',
      group: 'contact',
      validation: (r) => r.required().email(),
    }),
    defineField({name: 'location', type: 'string', group: 'contact'}),
    defineField({
      name: 'socials',
      type: 'array',
      group: 'contact',
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
  preview: {select: {title: 'name', subtitle: 'statement'}},
})
