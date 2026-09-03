import type { APIRoute } from 'astro';
import { count, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { comments, posts, roles, users } from '../../../../db/schema';
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

	if (id === admin.id) {
		return json({ ok: false, error: 'cannot_delete_self' }, 409);
	}

	const existing = await db
		.select({
			id: users.id,
			roleName: roles.name,
		})
		.from(users)
		.innerJoin(roles, eq(users.roleId, roles.id))
		.where(eq(users.id, id))
		.get();

	if (!existing) {
		return json({ ok: false, error: 'not_found' }, 404);
	}

	if (existing.roleName === 'admin') {
		const [adminCount] = await db
			.select({ total: count() })
			.from(users)
			.innerJoin(roles, eq(users.roleId, roles.id))
			.where(eq(roles.name, 'admin'));

		if ((adminCount?.total ?? 0) <= 1) {
			return json({ ok: false, error: 'last_admin' }, 409);
		}
	}

	const [postCount] = await db
		.select({ total: count() })
		.from(posts)
		.where(eq(posts.authorId, id));

	if ((postCount?.total ?? 0) > 0) {
		return json({ ok: false, error: 'has_posts' }, 409);
	}

	await db.delete(comments).where(eq(comments.userId, id));
	await db.delete(users).where(eq(users.id, id));

	return json({ ok: true }, 200);
};
