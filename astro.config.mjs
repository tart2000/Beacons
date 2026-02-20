// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
// En prod (ex. GitHub Pages), définir PUBLISH_BASE_PATH (ex. '/Beacons/'). Plus tard, ta propre URL (ex. '/').
export default defineConfig({
  base: process.env.PUBLISH_BASE_PATH || './',
  integrations: [tailwind()]
});