mikelabs/
├── src/
│   ├── content/
│   │   ├── config.ts              # Validación de esquemas (Zod)
│   │   └── blog/
│   │       ├── es/                # Artículos en español
│   │       │   └── mi-primer-post.md
│   │       └── en/                # Artículos en inglés
│   │           └── my-first-post.md
│   ├── components/                # Componentes UI reusables
│   ├── layouts/                   # Layouts (BaseLayout.astro, PostLayout.astro)
│   ├── i18n/                      # Diccionarios de traducción UI (menús, botones)
│   │   ├── es.json
│   │   └── en.json
│   └── pages/                     # Enrutamiento dinámico
│       ├── index.astro            # Redirección automática o Selector de idioma
│       └── [lang]/
│           ├── index.astro        # Home según idioma (/es o /en)
│           └── blog/
│               └── [slug].astro   # Renderizador de artículos por idioma
├── public/                        # Imágenes estáticas y favicon
├── Dockerfile                     # Construcción multi-stage para producción
├── docker-compose.yml
└── astro.config.mjs