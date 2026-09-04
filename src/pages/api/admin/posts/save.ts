import type { APIRoute } from 'astro';
import { and, eq, max, ne } from 'drizzle-orm';
import { db } from '../../../../db';
import { posts } from '../../../../db/schema';
import { requireAdmin } from '../../../../lib/auth';
import { excerptFromContent } from '../../../../lib/seo';
import { slugify } from '../../../../lib/slugify';

function json(data: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

type SaveBody = {
	id?: unknown;
	title?: unknown;
	slug?: unknown;
	language?: unknown;
	content?: unknown;
	excerpt?: unknown;
	coverImageUrl?: unknown;
	isPublished?: unknown;
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const admin = await requireAdmin(cookies);
	if (!admin) {
		return json({ ok: false, error: 'unauthorized' }, 401);
	}

	let body: SaveBody;
	try {
		body = (await request.json()) as SaveBody;
	} catch {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
	const slug = slugify(rawSlug || title);
	const language = body.language === 'en' ? 'en' : body.language === 'es' ? 'es' : null;
	const content = typeof body.content === 'string' ? body.content.trim() : '';
	const isPublished = body.isPublished === true;
	const excerptRaw =
		typeof body.excerpt === 'string'
			? body.excerpt.trim()
			: body.excerpt === null
				? ''
				: '';
	const coverImageUrlRaw =
		typeof body.coverImageUrl === 'string'
			? body.coverImageUrl.trim()
			: body.coverImageUrl === null
				? ''
				: '';

	const id =
		typeof body.id === 'number' && Number.isInteger(body.id) && body.id > 0
			? body.id
			: undefined;

	if (!title || !slug || !language || !content) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const excerpt = excerptRaw || excerptFromContent(content);
	const coverImageUrl = coverImageUrlRaw || null;

	const conflictQuery = id
		? and(
				eq(posts.slug, slug),
				eq(posts.language, language),
				ne(posts.id, id),
			)
		: and(eq(posts.slug, slug), eq(posts.language, language));

	const conflict = await db
		.select({ id: posts.id })
		.from(posts)
		.where(conflictQuery)
		.get();

	if (conflict) {
		return json({ ok: false, error: 'slug_taken' }, 409);
	}

	const now = new Date();

	if (id) {
		const existing = await db
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.id, id))
			.get();

		if (!existing) {
			return json({ ok: false, error: 'not_found' }, 404);
		}

		await db
			.update(posts)
			.set({
				title,
				slug,
				language,
				content,
				excerpt,
				coverImageUrl,
				isPublished,
				updatedAt: now,
			})
			.where(eq(posts.id, id));

		return json({ ok: true, id }, 200);
	}

	const [agg] = await db
		.select({ maxGroup: max(posts.translationGroupId) })
		.from(posts);
	const translationGroupId = (agg?.maxGroup ?? 0) + 1;

	const inserted = await db
		.insert(posts)
		.values({
			authorId: admin.id,
			title,
			slug,
			language,
			content,
			excerpt,
			coverImageUrl,
			isPublished,
			translationGroupId,
			createdAt: now,
			updatedAt: now,
		})
		.returning({ id: posts.id })
		.get();

	return json({ ok: true, id: inserted?.id }, 201);
};
