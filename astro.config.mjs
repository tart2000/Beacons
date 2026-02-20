// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import rehypeYouTubeEmbed from './src/plugins/rehype-youtube-embed.mjs';

// https://astro.build/config
// En prod (ex. GitHub Pages), définir PUBLISH_BASE_PATH (ex. '/Beacons/'). Plus tard, ta propre URL (ex. '/').
export default defineConfig({
  site: process.env.SITE || 'https://design.pocstudio.fr',
  base: process.env.PUBLISH_BASE_PATH || './',
  markdown: {
    rehypePlugins: [rehypeYouTubeEmbed],
  },
  integrations: [tailwind()]
});