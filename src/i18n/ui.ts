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
		logOut: 'Cerrar sesión',
		loginTitle: 'Iniciar sesión',
		joinTitle: 'Crear cuenta',
		nameLabel: 'Nombre',
		emailLabel: 'Correo electrónico',
		passwordLabel: 'Contraseña',
		loginSubmit: 'Entrar',
		joinSubmit: 'Registrarse',
		loginHint: '¿No tienes cuenta?',
		joinHint: '¿Ya tienes cuenta?',
		loginError: 'Correo o contraseña incorrectos.',
		joinError: 'No se pudo crear la cuenta. Inténtalo de nuevo.',
		emailTaken: 'Este correo ya está registrado.',
		passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
		invalidInput: 'Revisa los campos e inténtalo de nuevo.',
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
		logOut: 'Log out',
		loginTitle: 'Log in',
		joinTitle: 'Create account',
		nameLabel: 'Name',
		emailLabel: 'Email',
		passwordLabel: 'Password',
		loginSubmit: 'Sign in',
		joinSubmit: 'Sign up',
		loginHint: "Don't have an account?",
		joinHint: 'Already have an account?',
		loginError: 'Invalid email or password.',
		joinError: 'Could not create the account. Please try again.',
		emailTaken: 'This email is already registered.',
		passwordTooShort: 'Password must be at least 8 characters.',
		invalidInput: 'Please check the fields and try again.',
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
