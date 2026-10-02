import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'design',
    include: ['src/**/*.test.ts'],
    // The color utilities import their own modules without file extensions, which Node's resolver
    // refuses; inlined, they resolve through the bundler's.
    server: { deps: { inline: ['@material/material-color-utilities'] } },
  },
});
