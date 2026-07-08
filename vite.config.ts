import { defineConfig } from 'vite-plus';
import packageJson from './package.json';

export default defineConfig({
  fmt: {
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    // TODO: https://github.com/vitest-dev/vitest/issues/10593
    projects: packageJson.workspaces,
    coverage: {
      provider: 'v8',
      thresholds: {
        '100': true,
      },
    },
  },
});
