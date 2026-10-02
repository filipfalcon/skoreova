import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'design',
    include: ['src/**/*.test.ts'],
  },
});
