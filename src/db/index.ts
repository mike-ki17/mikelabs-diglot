/**
 * SQLite client (local). To migrate to PostgreSQL:
 * 1. docker compose up -d
 * 2. npm i postgres
 * 3. Switch drizzle.config.ts dialect to 'postgresql'
 * 4. Replace better-sqlite3 with drizzle-orm/postgres-js + DATABASE_URL
 * 5. Regenerate and run migrations
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const dbPath =
	process.env.DATABASE_URL?.replace(/^file:/, '') ??
	resolve(projectRoot, 'data/diglot.db');

const absoluteDbPath = resolve(projectRoot, dbPath);
mkdirSync(dirname(absoluteDbPath), { recursive: true });

const sqlite = new Database(absoluteDbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
