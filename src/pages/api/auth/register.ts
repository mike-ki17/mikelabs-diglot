import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { roles, users } from '../../../db/schema';
import {
	hashPassword,
	setAuthCookie,
	signSession,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_json' }, 400);
	}

	const { name, email, password } = (body ?? {}) as {
		name?: unknown;
		email?: unknown;
		password?: unknown;
	};

	if (
		typeof name !== 'string' ||
		typeof email !== 'string' ||
		typeof password !== 'string'
	) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const trimmedName = name.trim();
	const trimmedEmail = email.trim().toLowerCase();

	if (!trimmedName || !trimmedEmail || !password) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	if (password.length < 8) {
		return json({ ok: false, error: 'password_too_short' }, 400);
	}

	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, trimmedEmail))
		.get();

	if (existing) {
		return json({ ok: false, error: 'email_taken' }, 409);
	}

	let readerRole = await db
		.select()
		.from(roles)
		.where(eq(roles.name, 'reader'))
		.get();

	if (!readerRole) {
		const [created] = await db
			.insert(roles)
			.values({ name: 'reader' })
			.returning();
		readerRole = created;
	}

	if (!readerRole) {
		return json({ ok: false, error: 'server_error' }, 500);
	}

	const passwordHash = await hashPassword(password);

	const [user] = await db
		.insert(users)
		.values({
			roleId: readerRole.id,
			email: trimmedEmail,
			passwordHash,
			name: trimmedName,
		})
		.returning({ id: users.id });

	if (!user) {
		return json({ ok: false, error: 'server_error' }, 500);
	}

	const token = await signSession(user.id);
	setAuthCookie(cookies, token);

	return json({ ok: true }, 201);
};

function json(data: Record<string, unknown>, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
