# Diglot

Blog bilingüe (ES/EN) con Astro SSR, Drizzle ORM y SQLite (listo para PostgreSQL).

## Requisitos

- Node.js >= 22.12
- npm

## Instalación

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abre:

- http://localhost:4321/es
- http://localhost:4321/en
- http://localhost:4321/es/blog/hola-mundo
- http://localhost:4321/en/blog/hello-world

## Base de datos

Por defecto usa SQLite en `data/diglot.db` (`DATABASE_URL` en `.env`).

### Scripts

| Script | Descripción |
|--------|-------------|
| `npm run db:generate` | Genera migraciones SQL |
| `npm run db:push` | Aplica el esquema a la DB |
| `npm run db:migrate` | Ejecuta migraciones |
| `npm run db:seed` | Inserta rol admin, usuario Mick y posts ES/EN |
| `npm run db:studio` | Abre Drizzle Studio |

### Migrar a PostgreSQL

1. `docker compose up -d`
2. `npm i postgres`
3. En `drizzle.config.ts`, cambia `dialect` a `'postgresql'` y `dbCredentials.url` a tu `DATABASE_URL`
4. En `src/db/index.ts`, sustituye `better-sqlite3` por `drizzle-orm/postgres-js`
5. Regenera y aplica migraciones (`db:generate` + `db:migrate` o `db:push`)
6. En `.env`: `DATABASE_URL=postgresql://diglot:diglot@localhost:5432/diglot`

## Stack

- Astro (`output: 'server'`) + `@astrojs/node`
- Tailwind CSS v4
- Drizzle ORM + better-sqlite3
