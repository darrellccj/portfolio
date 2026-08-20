import {defineField, defineType} from 'sanity'

export const ditherStudy = defineType({
  name: 'ditherStudy',
  title: 'Dither study',
  type: 'document',
  // Singleton — backs the canvas plate's aria-label and source image.
  fields: [
    defineField({name: 'work', type: 'string', description: 'Title of the artwork.'}),
    defineField({name: 'credit', type: 'string', description: 'Artist and date.'}),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      description: 'Source plate. The canvas renders an ordered dither of this image.',
    }),
  ],
  preview: {select: {title: 'work', subtitle: 'credit', media: 'image'}},
})
