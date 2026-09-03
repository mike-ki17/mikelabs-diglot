import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { posts } from '../db/schema';
import { absoluteUrl, getSiteUrl } from '../lib/seo';
import type { Lang } from '../i18n/ui';

export const prerender = false;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toLastmod(date: Date | null | undefined): string | null {
	if (!date) return null;
	return date.toISOString().slice(0, 10);
}

type SitemapEntry = {
	loc: string;
	lastmod?: string | null;
	alternates: Partial<Record<Lang, string>>;
};

export const GET: APIRoute = async ({ site }) => {
	const siteUrl = getSiteUrl(site);

	const published = await db
		.select({
			slug: posts.slug,
			language: posts.language,
			updatedAt: posts.updatedAt,
			translationGroupId: posts.translationGroupId,
		})
		.from(posts)
		.where(eq(posts.isPublished, true))
		.all();

	const entries: SitemapEntry[] = [
		{
			loc: absoluteUrl('/es', siteUrl),
			alternates: {
				es: absoluteUrl('/es', siteUrl),
				en: absoluteUrl('/en', siteUrl),
			},
		},
		{
			loc: absoluteUrl('/en', siteUrl),
			alternates: {
				es: absoluteUrl('/es', siteUrl),
				en: absoluteUrl('/en', siteUrl),
			},
		},
	];

	const byGroup = new Map<
		number,
		{ es?: { slug: string; updatedAt: Date }; en?: { slug: string; updatedAt: Date } }
	>();
	const ungrouped: typeof published = [];

	for (const post of published) {
		if (post.translationGroupId == null) {
			ungrouped.push(post);
			continue;
		}
		const group = byGroup.get(post.translationGroupId) ?? {};
		group[post.language as Lang] = {
			slug: post.slug,
			updatedAt: post.updatedAt,
		};
		byGroup.set(post.translationGroupId, group);
	}

	for (const group of byGroup.values()) {
		const alternates: Partial<Record<Lang, string>> = {};
		if (group.es) {
			alternates.es = absoluteUrl(`/es/blog/${group.es.slug}`, siteUrl);
		}
		if (group.en) {
			alternates.en = absoluteUrl(`/en/blog/${group.en.slug}`, siteUrl);
		}

		for (const lang of ['es', 'en'] as const) {
			const item = group[lang];
			if (!item) continue;
			entries.push({
				loc: absoluteUrl(`/${lang}/blog/${item.slug}`, siteUrl),
				lastmod: toLastmod(item.updatedAt),
				alternates,
			});
		}
	}

	for (const post of ungrouped) {
		const lang = post.language as Lang;
		const loc = absoluteUrl(`/${lang}/blog/${post.slug}`, siteUrl);
		entries.push({
			loc,
			lastmod: toLastmod(post.updatedAt),
			alternates: { [lang]: loc },
		});
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
	.map((entry) => {
		const alternateTags = (['es', 'en'] as const)
			.filter((lang) => entry.alternates[lang])
			.map(
				(lang) =>
					`    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(entry.alternates[lang]!)}" />`,
			)
			.join('\n');

		const xDefault = entry.alternates.es ?? entry.alternates.en;
		const xDefaultTag = xDefault
			? `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(xDefault)}" />`
			: '';

		const lastmodTag = entry.lastmod
			? `\n    <lastmod>${entry.lastmod}</lastmod>`
			: '';

		return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmodTag}
${alternateTags}
${xDefaultTag}
  </url>`;
	})
	.join('\n')}
</urlset>
`;

	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
