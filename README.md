# Roundnet Directory

A small, searchable directory of useful software and websites for the roundnet community.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Directory entries are stored in Neon Postgres and managed through Drizzle ORM. Favicons are pulled from each approved website on the server and refreshed daily, with a local fallback when a site is unavailable.

Copy the Vercel-provisioned database variables into `.env.local`, then run:

```bash
npm run db:migrate
npm run db:seed
```

The admin dashboard is available at `/admin` and uses `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` server-side environment variables. Public suggestions are submitted at `/submit` and remain pending until approved.

## License

MIT
