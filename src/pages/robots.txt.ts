import type { APIRoute } from 'astro';
import { getSiteUrl } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
	const siteUrl = getSiteUrl(site);
	const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /es/login
Disallow: /en/login
Disallow: /es/join
Disallow: /en/join

Sitemap: ${siteUrl}/sitemap.xml
`;

	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
