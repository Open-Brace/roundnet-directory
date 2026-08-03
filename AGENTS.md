# Roundnet Directory agent guide

## Design authority

Follow [DESIGN.md](./DESIGN.md), the locally saved original Vercel design document selected for this project. Treat it as the visual and interaction authority for every UI change. Preserve this directory's restrained, functional use of Geist, monochrome surfaces, compact controls, clear hierarchy, visible focus states, light and dark themes, and minimal motion.

## Project conventions

- Keep the Next.js App Router and React Server Component boundaries already in place. Add client components only for interactive state.
- Keep the public directory simple: search, category filters, clean link rows, and the submission path.
- Normalize stored website URLs to their origin with no trailing slash.
- Protect every admin mutation with the existing admin-session check and validate all server-action input.
- Use Drizzle for Neon Postgres access and keep published ordering scoped to a category.
- Run `npm run typecheck` and `npm run build` before shipping.
