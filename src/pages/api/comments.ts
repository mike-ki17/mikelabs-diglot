import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { comments, posts } from '../../db/schema';
import { getAuthUser } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
	const user = await getAuthUser(cookies);
	if (!user) {
		return json({ ok: false, error: 'unauthorized' }, 401);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_json' }, 400);
	}

	const { postId, content } = (body ?? {}) as {
		postId?: unknown;
		content?: unknown;
	};

	if (
		typeof postId !== 'number' ||
		!Number.isInteger(postId) ||
		postId <= 0 ||
		typeof content !== 'string'
	) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const trimmed = content.trim();
	if (!trimmed) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const post = await db
		.select({ id: posts.id })
		.from(posts)
		.where(eq(posts.id, postId))
		.get();

	if (!post) {
		return json({ ok: false, error: 'post_not_found' }, 400);
	}

	await db.insert(comments).values({
		postId,
		userId: user.id,
		content: trimmed,
	});

	return json({ ok: true }, 200);
};

function json(data: Record<string, unknown>, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
