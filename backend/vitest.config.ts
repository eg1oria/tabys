import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['./test/setup-env.ts'],
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: { exclude: ['src/generated/**', 'prisma/**', 'dist/**'] },
  },
});
