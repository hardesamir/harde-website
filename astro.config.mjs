import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://hardesamir.com',
  integrations: [sitemap()],
  // static site + serverless /oauth endpoints for the /admin CMS login
  adapter: vercel(),
});
