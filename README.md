# Diglot

Blog bilingüe (ES/EN) con Astro SSR, Drizzle ORM y SQLite (listo para PostgreSQL).

## Requisitos

- Node.js >= 22.12
- npm
- Docker + Docker Compose (para producción / Portainer)

## Instalación (desarrollo)

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

Al arrancar la app en producción (contenedor), se aplican automáticamente las migraciones de la carpeta `drizzle/` si existen. El seed **no** se ejecuta solo (evita crear `password123` en producción).

### Scripts

| Script | Descripción |
|--------|-------------|
| `npm run db:generate` | Genera migraciones SQL |
| `npm run db:push` | Aplica el esquema a la DB |
| `npm run db:migrate` | Ejecuta migraciones |
| `npm run db:seed` | Inserta rol admin, usuario Mick y posts ES/EN |
| `npm run db:studio` | Abre Drizzle Studio |

## Docker / Portainer

La imagen usa Node 22 Alpine, Astro SSR (`@astrojs/node` standalone) y SQLite en un volumen persistente.

1. Define `AUTH_SECRET` en el entorno del stack (Portainer) o en un `.env` junto a `docker-compose.yml`:

```bash
AUTH_SECRET=tu-secreto-largo-y-aleatorio
```

2. (Opcional) Copia tu base local a `./data/diglot.db` en el host antes del primer arranque para conservar posts y usuarios. Si el directorio está vacío, las migraciones crean el esquema.

3. Construye y levanta:

```bash
docker compose build
docker compose up -d
```

4. La app escucha en `0.0.0.0:4321`. En Nginx Proxy Manager, apunta el proxy a `IP_DEL_HOST:4321` (o al nombre del contenedor si comparten red Docker).

Variables relevantes dentro del contenedor:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | `file:/app/data/diglot.db` |
| `HOST` | `0.0.0.0` |
| `PORT` | `4321` |
| `AUTH_SECRET` | (obligatorio) |

Volumen: `./data:/app/data` — persisten `diglot.db` y los archivos WAL.

Si el usuario `node` del contenedor (uid 1000) no puede escribir en el bind mount, ajusta el owner del directorio host: `chown -R 1000:1000 ./data`.

### Migrar a PostgreSQL (futuro)

1. Levanta una instancia Postgres
2. `npm i postgres`
3. En `drizzle.config.ts`, cambia `dialect` a `'postgresql'` y `dbCredentials.url` a tu `DATABASE_URL`
4. En `src/db/index.ts`, sustituye `better-sqlite3` por `drizzle-orm/postgres-js`
5. Regenera y aplica migraciones (`db:generate` + `db:migrate` o `db:push`)
6. En `.env`: `DATABASE_URL=postgresql://diglot:diglot@localhost:5432/diglot`

## Stack

- Astro (`output: 'server'`) + `@astrojs/node`
- Tailwind CSS v4
- Drizzle ORM + better-sqlite3
- Docker multi-stage (Node 22 Alpine) listo para Portainer
