import type { APIRoute } from 'astro';
import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '../../../../db';
import { roles, users } from '../../../../db/schema';
import { hashPassword, requireAdmin } from '../../../../lib/auth';

function json(data: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

type SocialLinks = {
	twitter?: string;
	github?: string;
	website?: string;
};

type SaveBody = {
	id?: unknown;
	name?: unknown;
	email?: unknown;
	roleId?: unknown;
	password?: unknown;
	bio?: unknown;
	avatarUrl?: unknown;
	socialLinks?: unknown;
};

/** null/undefined → null; string → trimmed or null; other → invalid */
function parseOptionalText(
	value: unknown,
): { ok: true; value: string | null } | { ok: false } {
	if (value === null || value === undefined) return { ok: true, value: null };
	if (typeof value !== 'string') return { ok: false };
	const trimmed = value.trim();
	return { ok: true, value: trimmed || null };
}

function parseSocialLinks(
	value: unknown,
): { ok: true; value: SocialLinks | null } | { ok: false } {
	if (value === null || value === undefined) return { ok: true, value: null };
	if (typeof value !== 'object' || Array.isArray(value)) return { ok: false };

	const raw = value as Record<string, unknown>;
	const result: SocialLinks = {};

	for (const key of ['twitter', 'github', 'website'] as const) {
		const v = raw[key];
		if (v === undefined || v === null) continue;
		if (typeof v !== 'string') return { ok: false };
		if (v.trim()) result[key] = v.trim();
	}

	return {
		ok: true,
		value: Object.keys(result).length > 0 ? result : null,
	};
}

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

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const email =
		typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
	const roleId =
		typeof body.roleId === 'number' &&
		Number.isInteger(body.roleId) &&
		body.roleId > 0
			? body.roleId
			: null;
	const password =
		typeof body.password === 'string' ? body.password : undefined;

	const bioParsed = parseOptionalText(body.bio);
	const avatarParsed = parseOptionalText(body.avatarUrl);
	const socialParsed = parseSocialLinks(body.socialLinks);

	if (!bioParsed.ok || !avatarParsed.ok || !socialParsed.ok) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const id =
		typeof body.id === 'number' && Number.isInteger(body.id) && body.id > 0
			? body.id
			: undefined;

	if (!name || !email || !roleId) {
		return json({ ok: false, error: 'invalid_input' }, 400);
	}

	const role = await db
		.select({ id: roles.id, name: roles.name })
		.from(roles)
		.where(eq(roles.id, roleId))
		.get();

	if (!role) {
		return json({ ok: false, error: 'invalid_role' }, 400);
	}

	const conflictQuery = id
		? and(eq(users.email, email), ne(users.id, id))
		: eq(users.email, email);

	const conflict = await db
		.select({ id: users.id })
		.from(users)
		.where(conflictQuery)
		.get();

	if (conflict) {
		return json({ ok: false, error: 'email_taken' }, 409);
	}

	if (id) {
		const existing = await db
			.select({
				id: users.id,
				roleId: users.roleId,
				roleName: roles.name,
			})
			.from(users)
			.innerJoin(roles, eq(users.roleId, roles.id))
			.where(eq(users.id, id))
			.get();

		if (!existing) {
			return json({ ok: false, error: 'not_found' }, 404);
		}

		if (password !== undefined && password.length > 0 && password.length < 8) {
			return json({ ok: false, error: 'password_too_short' }, 400);
		}

		// Prevent demoting the last admin
		if (existing.roleName === 'admin' && role.name !== 'admin') {
			const [adminCount] = await db
				.select({ total: count() })
				.from(users)
				.innerJoin(roles, eq(users.roleId, roles.id))
				.where(eq(roles.name, 'admin'));

			if ((adminCount?.total ?? 0) <= 1) {
				return json({ ok: false, error: 'last_admin' }, 409);
			}
		}

		const updatePayload: {
			name: string;
			email: string;
			roleId: number;
			bio?: string | null;
			avatarUrl?: string | null;
			socialLinks?: SocialLinks | null;
			passwordHash?: string;
		} = {
			name,
			email,
			roleId,
		};

		// Only overwrite optional profile fields when the client sent them
		if (body.bio !== undefined) updatePayload.bio = bioParsed.value;
		if (body.avatarUrl !== undefined)
			updatePayload.avatarUrl = avatarParsed.value;
		if (body.socialLinks !== undefined)
			updatePayload.socialLinks = socialParsed.value;

		if (password && password.length >= 8) {
			updatePayload.passwordHash = await hashPassword(password);
		}

		await db.update(users).set(updatePayload).where(eq(users.id, id));

		return json({ ok: true, id }, 200);
	}

	if (!password) {
		return json({ ok: false, error: 'password_required' }, 400);
	}

	if (password.length < 8) {
		return json({ ok: false, error: 'password_too_short' }, 400);
	}

	const passwordHash = await hashPassword(password);

	const inserted = await db
		.insert(users)
		.values({
			name,
			email,
			roleId,
			passwordHash,
			bio: bioParsed.value,
			avatarUrl: avatarParsed.value,
			socialLinks: socialParsed.value,
		})
		.returning({ id: users.id })
		.get();

	return json({ ok: true, id: inserted?.id }, 201);
};
