export const languages = {
	es: 'Español',
	en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'es';

export const ui = {
	es: {
		siteName: 'Diglot',
		homeTitle: 'Blog',
		homeSubtitle: 'Artículos en español e inglés.',
		postsHeading: 'Artículos',
		readMore: 'Leer más',
		noPosts: 'No hay artículos publicados todavía.',
		backHome: 'Volver al inicio',
		byAuthor: 'Por',
		notFound: 'Artículo no encontrado',
		logIn: 'Log in',
		join: 'Join',
		footerHome: 'Inicio',
		footerBlog: 'Blog',
		footerLanguage: 'Idioma',
		footerRights: 'Todos los derechos reservados.',
		adSpace: 'Espacio Ad / Banner',
		commentsHeading: 'Comentarios',
		commentPlaceholder: 'Deja un comentario...',
		commentSubmit: 'Enviar',
		authorRole: 'Autor',
	},
	en: {
		siteName: 'Diglot',
		homeTitle: 'Blog',
		homeSubtitle: 'Articles in Spanish and English.',
		postsHeading: 'Articles',
		readMore: 'Read more',
		noPosts: 'No published articles yet.',
		backHome: 'Back to home',
		byAuthor: 'By',
		notFound: 'Article not found',
		logIn: 'Log in',
		join: 'Join',
		footerHome: 'Home',
		footerBlog: 'Blog',
		footerLanguage: 'Language',
		footerRights: 'All rights reserved.',
		adSpace: 'Ad Space / Banner',
		commentsHeading: 'Comments',
		commentPlaceholder: 'Leave a comment...',
		commentSubmit: 'Submit',
		authorRole: 'Author',
	},
} as const;

export function isLang(value: string): value is Lang {
	return value === 'es' || value === 'en';
}

export function t(lang: Lang) {
	return ui[lang];
}
