'use client';

import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {presentationTool} from 'sanity/presentation';
import {visionTool} from '@sanity/vision';
import {schemaTypes} from './src/sanity/schemaTypes';
import {structure} from './src/sanity/structure';
import {apiVersion, dataset, projectId} from './src/sanity/env';

// Singletons are created and edited through Structure only — keep them
// out of the global "create new" menu.
const SINGLETON_TYPES = new Set(['profile', 'ditherStudy']);

export default defineConfig({
  name: 'default',
  title: 'portfolio',

  // Mounted inside the Next app at /studio rather than served standalone.
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [
    structureTool({structure}),
    // Presentation drives the site in draft mode beside the editor, so
    // edits are visible before they publish.
    presentationTool({
      previewUrl: {
        previewMode: {enable: '/api/draft-mode/enable'},
      },
    }),
    visionTool({defaultApiVersion: apiVersion}),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => prev.filter((t) => !SINGLETON_TYPES.has(t.schemaType)),
  },

  document: {
    actions: (prev, {schemaType}) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter(({action}) => action !== 'duplicate' && action !== 'delete')
        : prev,
  },
});
