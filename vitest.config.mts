import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    // Nested Git worktrees carry independent configs and test setup. The root
    // suite validates this checkout only.
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
});
