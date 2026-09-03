import type { APIRoute } from 'astro';
import matter from 'gray-matter';
import { requireAdmin } from '../../../../lib/auth';
import { slugify } from '../../../../lib/slugify';

function json(data: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function parseLanguage(value: unknown): 'es' | 'en' {
	if (typeof value !== 'string') return 'es';
	const normalized = value.trim().toLowerCase();
	if (normalized === 'en' || normalized.startsWith('en')) return 'en';
	return 'es';
}

function parseIsPublished(data: Record<string, unknown>): boolean {
	if (typeof data.published === 'boolean') return data.published;
	if (typeof data.draft === 'boolean') return !data.draft;
	if (data.published === 'true' || data.published === true) return true;
	if (data.draft === 'true' || data.draft === true) return false;
	if (typeof data.status === 'string') {
		const s = data.status.toLowerCase();
		if (s === 'published' || s === 'publish') return true;
		if (s === 'draft') return false;
	}
	return false;
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const admin = await requireAdmin(cookies);
	if (!admin) {
		return json({ ok: false, error: 'unauthorized' }, 401);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ ok: false, error: 'invalid_file' }, 400);
	}

	const file = formData.get('file');
	if (!(file instanceof File) || file.size === 0) {
		return json({ ok: false, error: 'invalid_file' }, 400);
	}

	const filename = file.name || '';
	if (!/\.(md|markdown)$/i.test(filename)) {
		return json({ ok: false, error: 'invalid_file' }, 400);
	}

	const raw = await file.text();
	const parsed = matter(raw);
	const fm = parsed.data as Record<string, unknown>;

	const title =
		typeof fm.title === 'string' && fm.title.trim()
			? fm.title.trim()
			: filename.replace(/\.(md|markdown)$/i, '');

	const slug =
		typeof fm.slug === 'string' && fm.slug.trim()
			? slugify(fm.slug)
			: slugify(title);

	const language = parseLanguage(fm.language ?? fm.lang);

	const excerpt =
		typeof fm.excerpt === 'string'
			? fm.excerpt.trim()
			: typeof fm.description === 'string'
				? fm.description.trim()
				: '';

	const content = parsed.content.trim();
	const isPublished = parseIsPublished(fm);

	return json({
		ok: true,
		data: {
			title,
			slug,
			language,
			content,
			excerpt,
			isPublished,
			// date from frontmatter is informational only; not persisted here
			date: fm.date ?? null,
		},
	});
};
