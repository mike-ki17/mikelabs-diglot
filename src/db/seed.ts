import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { posts, roles, users } from './schema';

/** Seed admin password for local login: password123 */
const SEED_PASSWORD = 'password123';

async function seed() {
	await db.insert(roles).values({ name: 'admin' }).onConflictDoNothing();
	await db.insert(roles).values({ name: 'reader' }).onConflictDoNothing();

	const role = await db
		.select()
		.from(roles)
		.where(eq(roles.name, 'admin'))
		.get();

	if (!role) {
		throw new Error('No se pudo crear o encontrar el rol admin');
	}

	const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, 'mick@mikelabs.dev'))
		.get();

	let user = existing;

	if (existing) {
		await db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, existing.id));
		user = { ...existing, passwordHash };
	} else {
		const [author] = await db
			.insert(users)
			.values({
				roleId: role.id,
				email: 'mick@mikelabs.dev',
				passwordHash,
				name: 'Michael Castro',
				bio: 'Desarrollador fullstack. Fundador de MikeLabs.',
				avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
				socialLinks: {
					github: 'https://github.com/mick-castro',
					website: 'https://mikelabs.dev',
				},
			})
			.returning();
		user = author;
	}

	if (!user) {
		throw new Error('No se pudo crear o encontrar el usuario de prueba');
	}

	await db
		.insert(posts)
		.values([
			{
				authorId: user.id,
				title: 'Hola mundo',
				slug: 'hola-mundo',
				content: `# Hola mundo

Este es el **primer artículo** del blog Diglot en español.

Puedes editar este contenido en markdown desde la base de datos.`,
				excerpt: 'El primer artículo del blog Diglot en español.',
				coverImageUrl: null,
				language: 'es',
				translationGroupId: 1,
				isPublished: true,
			},
			{
				authorId: user.id,
				title: 'Hello World',
				slug: 'hello-world',
				content: `# Hello World

This is the **first article** of the Diglot blog in English.

You can edit this markdown content from the database.`,
				excerpt: 'The first article of the Diglot blog in English.',
				coverImageUrl: null,
				language: 'en',
				translationGroupId: 1,
				isPublished: true,
			},
		])
		.onConflictDoNothing();

	// Link existing seed posts if they were inserted before translationGroupId existed
	await db
		.update(posts)
		.set({
			translationGroupId: 1,
			excerpt: 'El primer artículo del blog Diglot en español.',
		})
		.where(eq(posts.slug, 'hola-mundo'));
	await db
		.update(posts)
		.set({
			translationGroupId: 1,
			excerpt: 'The first article of the Diglot blog in English.',
		})
		.where(eq(posts.slug, 'hello-world'));

	console.log(
		'Seed OK: roles admin/reader, usuario Mick Castro (password123), posts es/en',
	);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
