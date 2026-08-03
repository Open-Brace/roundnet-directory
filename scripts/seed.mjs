import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const sql = neon(databaseUrl);
const directorySites = [
  ["https://fwango.io/", "Fwango"],
  ["https://www.rallyreview.net/", "Rally Review"],
  ["https://asl-rosters.vercel.app/", "ASL 2026 Roster Explorer"],
  ["https://irf-worlds-roster-explorer.vercel.app/", "Worlds 2026 Roster Explorer"],
  ["https://courtform.lovable.app/", "Courtform"],
  ["https://www.cutserve.app/", "CutServe"],
  ["https://spikewiki.com/", "Spike Wiki"],
];

for (const [position, [url, title]] of directorySites.entries()) {
  await sql`
    INSERT INTO sites (url, title, status, position)
    VALUES (${url}, ${title}, 'approved', ${position})
    ON CONFLICT (url) DO UPDATE SET
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      position = EXCLUDED.position,
      updated_at = NOW()
  `;
}

console.log(`Seeded ${directorySites.length} directory sites.`);
