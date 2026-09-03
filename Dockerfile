# ---- deps: install dependencies (incl. native better-sqlite3) ----
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# ---- build: Astro SSR standalone ----
FROM node:22-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npm prune --omit=dev

# ---- runner: production image ----
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libstdc++ \
	&& mkdir -p /app/data \
	&& chown -R node:node /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/drizzle ./drizzle

USER node

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
