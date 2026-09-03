/**
 * SQLite client. To migrate to PostgreSQL later:
 * 1. Run a Postgres instance
 * 2. npm i postgres
 * 3. Switch drizzle.config.ts dialect to 'postgresql'
 * 4. Replace better-sqlite3 with drizzle-orm/postgres-js + DATABASE_URL
 * 5. Regenerate and run migrations
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import * as schema from './schema';

/** Project root: reliable in Docker (WORKDIR) and local scripts */
const projectRoot = process.cwd();

/** Normalize DATABASE_URL forms: file:./x, file:/app/x, file:///app/x, or bare path */
function resolveDbPath(databaseUrl: string | undefined): string {
	if (!databaseUrl) {
		return resolve(projectRoot, 'data/diglot.db');
	}

	let path = databaseUrl;
	if (path.startsWith('file:')) {
		path = path.slice('file:'.length);
		// file:///absolute -> /absolute
		if (path.startsWith('///')) {
			path = path.slice(2);
		} else if (path.startsWith('//')) {
			path = path.slice(1);
		}
	}

	if (isAbsolute(path)) {
		return path;
	}

	return resolve(projectRoot, path);
}

const absoluteDbPath = resolveDbPath(process.env.DATABASE_URL);
mkdirSync(dirname(absoluteDbPath), { recursive: true });

const sqlite = new Database(absoluteDbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Apply SQL migrations on production boot (empty Docker volume).
// Locally prefer `npm run db:push` / `db:migrate` to avoid clashing with push-created DBs.
const migrationsFolder = resolve(projectRoot, 'drizzle');
if (process.env.NODE_ENV === 'production' && existsSync(migrationsFolder)) {
	migrate(db, { migrationsFolder });
}
