import { relations, sql } from 'drizzle-orm';
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
	index,
} from 'drizzle-orm/sqlite-core';

export const roles = sqliteTable('roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
});

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	roleId: integer('role_id')
		.notNull()
		.references(() => roles.id),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	name: text('name').notNull(),
	bio: text('bio'),
	avatarUrl: text('avatar_url'),
	socialLinks: text('social_links', { mode: 'json' }).$type<{
		twitter?: string;
		github?: string;
		website?: string;
	}>(),
});

export const posts = sqliteTable(
	'posts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		authorId: integer('author_id')
			.notNull()
			.references(() => users.id),
		title: text('title').notNull(),
		slug: text('slug').notNull(),
		content: text('content').notNull(),
		coverImageUrl: text('cover_image_url'),
		language: text('language', { enum: ['es', 'en'] }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		isPublished: integer('is_published', { mode: 'boolean' })
			.notNull()
			.default(false),
	},
	(table) => [
		uniqueIndex('posts_slug_language_idx').on(table.slug, table.language),
		index('posts_slug_idx').on(table.slug),
		index('posts_language_idx').on(table.language),
	],
);

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id],
	}),
	posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
	author: one(users, {
		fields: [posts.authorId],
		references: [users.id],
	}),
}));

export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
