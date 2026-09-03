import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { posts, roles, users } from './schema';

async function seed() {
	const [adminRole] = await db
		.insert(roles)
		.values({ name: 'admin' })
		.onConflictDoNothing()
		.returning();

	const role =
		adminRole ??
		(await db.select().from(roles).where(eq(roles.name, 'admin')).get());

	if (!role) {
		throw new Error('No se pudo crear o encontrar el rol admin');
	}

	const [author] = await db
		.insert(users)
		.values({
			roleId: role.id,
			email: 'mick@mikelabs.dev',
			// Placeholder only — replace with real hashing when auth lands
			passwordHash: 'seed-placeholder-not-a-real-hash',
			name: 'Mick Castro',
			bio: 'Desarrollador fullstack. Fundador de MikeLabs.',
			avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
			socialLinks: {
				github: 'https://github.com/mick-castro',
				website: 'https://mikelabs.dev',
			},
		})
		.onConflictDoNothing()
		.returning();

	const user =
		author ??
		(await db.select().from(users).where(eq(users.email, 'mick@mikelabs.dev')).get());

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
				coverImageUrl: null,
				language: 'es',
				isPublished: true,
			},
			{
				authorId: user.id,
				title: 'Hello World',
				slug: 'hello-world',
				content: `# Hello World

This is the **first article** of the Diglot blog in English.

You can edit this markdown content from the database.`,
				coverImageUrl: null,
				language: 'en',
				isPublished: true,
			},
		])
		.onConflictDoNothing();

	console.log('Seed OK: rol admin, usuario Mick Castro, posts es/en');
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
