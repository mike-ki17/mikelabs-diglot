import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '../db';
import { roles, users } from '../db/schema';

export const AUTH_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const BCRYPT_ROUNDS = 10;

function getSecretKey() {
	const secret = import.meta.env.AUTH_SECRET ?? process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error('AUTH_SECRET is not set');
	}
	return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
	password: string,
	passwordHash: string,
): Promise<boolean> {
	return bcrypt.compare(password, passwordHash);
}

export async function signSession(userId: number): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(String(userId))
		.setIssuedAt()
		.setExpirationTime(`${SESSION_MAX_AGE}s`)
		.sign(getSecretKey());
}

export async function verifySession(token: string): Promise<number | null> {
	try {
		const { payload } = await jwtVerify(token, getSecretKey());
		const userId = Number(payload.sub);
		if (!Number.isInteger(userId) || userId <= 0) return null;
		return userId;
	} catch {
		return null;
	}
}

export function setAuthCookie(cookies: AstroCookies, token: string): void {
	cookies.set(AUTH_COOKIE, token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE,
	});
}

export function clearAuthCookie(cookies: AstroCookies): void {
	cookies.set(AUTH_COOKIE, '', {
		httpOnly: true,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax',
		maxAge: 0,
		expires: new Date(0),
	});
}

export type AuthUser = {
	id: number;
	name: string;
	email: string;
	avatarUrl: string | null;
	roleId: number;
	roleName: string;
};

export async function getAuthUser(
	cookies: AstroCookies,
): Promise<AuthUser | null> {
	const token = cookies.get(AUTH_COOKIE)?.value;
	if (!token) return null;

	const userId = await verifySession(token);
	if (!userId) return null;

	const user = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			avatarUrl: users.avatarUrl,
			roleId: users.roleId,
			roleName: roles.name,
		})
		.from(users)
		.innerJoin(roles, eq(users.roleId, roles.id))
		.where(eq(users.id, userId))
		.get();

	return user ?? null;
}

export async function requireAdmin(
	cookies: AstroCookies,
): Promise<AuthUser | null> {
	const user = await getAuthUser(cookies);
	if (!user || user.roleName !== 'admin') return null;
	return user;
}

/** Safe redirect target: only allow paths under /admin. */
export function safeAdminNext(next: string | null | undefined): string | null {
	if (!next || typeof next !== 'string') return null;
	if (!next.startsWith('/admin')) return null;
	if (next.startsWith('//') || next.includes('\\')) return null;
	return next;
}
