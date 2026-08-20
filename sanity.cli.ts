import {defineCliConfig} from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  /**
   * TypeGen reads the schema and this app's `defineQuery` calls, and
   * writes result types back into src/sanity/types.ts.
   */
  typegen: {
    path: './src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: './src/sanity/types.ts',
  },
});
