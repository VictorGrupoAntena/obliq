// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

export default defineConfig({
  output: 'server',

  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: node({
    mode: 'standalone',
  }),
});
