// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
	output: 'server',
	image: {
		remotePatterns: [{ protocol: 'https' }],
	},
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: ['better-sqlite3'],
		},
	},
	adapter: node({
		mode: 'standalone',
	}),
});
