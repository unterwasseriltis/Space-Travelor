import { defineConfig } from 'vite';

const repoName = 'Space-Travelor';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : `/${repoName}/`,
}));
