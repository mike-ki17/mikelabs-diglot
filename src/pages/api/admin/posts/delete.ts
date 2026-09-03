import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { comments, posts } from '../../../../db/schema';
import { requireAdmin } from '../../../../lib/auth';

function json(data: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const admin = await requireAdmin(cookies);
	if (!admin) {
		return json({ ok: false, error: 'unauthorized' }, 401);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const id = (body as { id?: unknown })?.id;
	if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const existing = await db
		.select({ id: posts.id })
		.from(posts)
		.where(eq(posts.id, id))
		.get();

	if (!existing) {
		return json({ ok: false, error: 'not_found' }, 404);
	}

	await db.delete(comments).where(eq(comments.postId, id));
	await db.delete(posts).where(eq(posts.id, id));

	return json({ ok: true }, 200);
};
