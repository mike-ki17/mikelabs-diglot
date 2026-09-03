import { defineMiddleware } from 'astro:middleware';
import { getAuthUser } from './lib/auth';

function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminApiPath(pathname: string): boolean {
	return pathname === '/api/admin' || pathname.startsWith('/api/admin/');
}

function jsonUnauthorized(status: number, error: string) {
	return new Response(JSON.stringify({ ok: false, error }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const isPage = isAdminPath(pathname);
	const isApi = isAdminApiPath(pathname);

	if (!isPage && !isApi) {
		return next();
	}

	const user = await getAuthUser(context.cookies);

	if (!user) {
		if (isApi) {
			return jsonUnauthorized(401, 'unauthorized');
		}
		const nextPath = pathname + context.url.search;
		return context.redirect(
			`/es/login?next=${encodeURIComponent(nextPath)}`,
		);
	}

	if (user.roleName !== 'admin') {
		if (isApi) {
			return jsonUnauthorized(403, 'forbidden');
		}
		return context.redirect('/es');
	}

	return next();
});
