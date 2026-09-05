import type { APIRoute } from 'astro';
import { clearAuthCookie } from '../../../lib/auth';

function safeRedirectTarget(target: unknown): string | null {
	if (typeof target !== 'string') return null;
	if (!target.startsWith('/')) return null;
	if (target.startsWith('//') || target.includes('\\')) return null;
	return target;
}

export const POST: APIRoute = async ({ cookies, request, redirect, url }) => {
	clearAuthCookie(cookies);

	const formData = await request.formData().catch(() => null);
	const redirectTo =
		safeRedirectTarget(formData?.get('redirectTo')) ??
		safeRedirectTarget(url.searchParams.get('redirectTo'));

	// Form submissions should navigate after logout; fetch calls can handle redirect client-side.
	if (formData && redirectTo) {
		return redirect(redirectTo, 303);
	}

	return new Response(
		JSON.stringify({
			ok: true,
			redirectTo: redirectTo ?? null,
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
		},
	);
};
