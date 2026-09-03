import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import {
	setAuthCookie,
	signSession,
	verifyPassword,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_json' }, 400);
	}

	const { email, password } = (body ?? {}) as {
		email?: unknown;
		password?: unknown;
	};

	if (typeof email !== 'string' || typeof password !== 'string') {
		return json({ ok: false, error: 'invalid_credentials' }, 401);
	}

	const trimmedEmail = email.trim().toLowerCase();
	if (!trimmedEmail || !password) {
		return json({ ok: false, error: 'invalid_credentials' }, 401);
	}

	const user = await db
		.select({
			id: users.id,
			passwordHash: users.passwordHash,
		})
		.from(users)
		.where(eq(users.email, trimmedEmail))
		.get();

	if (!user) {
		return json({ ok: false, error: 'invalid_credentials' }, 401);
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		return json({ ok: false, error: 'invalid_credentials' }, 401);
	}

	const token = await signSession(user.id);
	setAuthCookie(cookies, token);

	return json({ ok: true }, 200);
};

function json(data: Record<string, unknown>, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
