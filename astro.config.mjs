import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mingalaredu.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/'), i18n: { defaultLocale: 'en', locales: { en: 'en', my: 'my' } } })],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { force: true },
    // Keep Node dependencies external during content sync: a warm Vite cache on
    // Windows otherwise sends CommonJS packages through the ESM module runner.
    environments: { astro: { resolve: { external: true } } },
  },
});
