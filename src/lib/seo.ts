import { defaultLang, type Lang } from '../i18n/ui';

const FALLBACK_SITE_URL = 'http://localhost:4321';

export type ArticleType = 'website' | 'article';

export type HreflangAlternates = Partial<Record<Lang, string>>;

export function getSiteUrl(site?: URL | string | undefined): string {
	const fromEnv = import.meta.env.PUBLIC_SITE_URL as string | undefined;
	if (fromEnv?.trim()) {
		return fromEnv.replace(/\/$/, '');
	}
	if (site) {
		return String(site).replace(/\/$/, '');
	}
	return FALLBACK_SITE_URL;
}

export function absoluteUrl(
	path: string,
	site?: URL | string | undefined,
): string {
	const base = getSiteUrl(site);
	if (/^https?:\/\//i.test(path)) {
		return path;
	}
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalized}`;
}

/** Canonical URL without query string or hash. */
export function canonicalFromAstro(
	url: URL,
	site?: URL | string | undefined,
): string {
	return absoluteUrl(url.pathname, site);
}

export function hreflangLinks(
	alternates: HreflangAlternates,
): { hreflang: string; href: string }[] {
	const links: { hreflang: string; href: string }[] = [];

	if (alternates.es) {
		links.push({ hreflang: 'es', href: alternates.es });
	}
	if (alternates.en) {
		links.push({ hreflang: 'en', href: alternates.en });
	}

	const defaultHref = alternates[defaultLang] ?? alternates.es ?? alternates.en;
	if (defaultHref) {
		links.push({ hreflang: 'x-default', href: defaultHref });
	}

	return links;
}

/** Strip markdown noise and truncate for meta description. */
export function excerptFromContent(markdown: string, maxLength = 155): string {
	const plain = markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
		.replace(/[#>*_~|-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (plain.length <= maxLength) {
		return plain;
	}

	const truncated = plain.slice(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	return `${(lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
}

export function ogLocale(lang: Lang): string {
	return lang === 'es' ? 'es_ES' : 'en_US';
}

export function alternateOgLocale(lang: Lang): string {
	return lang === 'es' ? 'en_US' : 'es_ES';
}

type BlogPostingInput = {
	headline: string;
	description: string;
	image?: string | null;
	datePublished: Date | string;
	dateModified: Date | string;
	inLanguage: Lang;
	canonicalUrl: string;
	authorName: string;
};

function toIso(value: Date | string): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	return new Date(value).toISOString();
}

export function blogPostingJsonLd(input: BlogPostingInput) {
	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: input.headline,
		description: input.description,
		datePublished: toIso(input.datePublished),
		dateModified: toIso(input.dateModified),
		inLanguage: input.inLanguage,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': input.canonicalUrl,
		},
		author: {
			'@type': 'Person',
			name: input.authorName,
		},
	};

	if (input.image) {
		jsonLd.image = [input.image];
	}

	return jsonLd;
}

export function pageAlternates(
	_lang: Lang,
	pathWithoutLang: string,
	site?: URL | string | undefined,
): Record<Lang, string> {
	const suffix = pathWithoutLang.startsWith('/')
		? pathWithoutLang
		: `/${pathWithoutLang}`;
	const cleanSuffix = suffix === '/' ? '' : suffix;

	return {
		es: absoluteUrl(`/es${cleanSuffix}`, site),
		en: absoluteUrl(`/en${cleanSuffix}`, site),
	};
}
