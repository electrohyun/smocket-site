import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Nested Git worktrees carry independent configs and test setup. The root
    // suite validates this checkout only.
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
});
