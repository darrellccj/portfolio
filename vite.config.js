import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// base: './' keeps asset paths relative so the build works on GitHub Pages
// project subpaths (e.g. user.github.io/portfolio/) as well as at a root domain.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two entry pages: the koi-pond original and the sky variant.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        sky: fileURLToPath(new URL('./index2.html', import.meta.url)),
      },
    },
  },
});
