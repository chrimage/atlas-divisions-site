import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Build configuration
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
