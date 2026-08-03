import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const sql = neon(databaseUrl);

const directoryCategories = [
  {
    name: "Tools & Software",
    slug: "tools-software",
    sites: [
      ["https://fwango.io", "Fwango"],
      ["https://www.rallyreview.net", "Rally Review"],
      ["https://asl-rosters.vercel.app", "ASL 2026 Roster Explorer"],
      ["https://irf-worlds-roster-explorer.vercel.app", "Worlds 2026 Roster Explorer"],
      ["https://courtform.lovable.app", "Courtform"],
      ["https://www.cutserve.app", "CutServe"],
    ],
  },
  {
    name: "Organizations & Events",
    slug: "organizations-events",
    sites: [
      ["https://www.roundnetfederation.org", "International Roundnet Federation"],
      ["https://www.roundnet.eu", "European Roundnet Association"],
    ],
  },
  {
    name: "Clubs & Communities",
    slug: "clubs-communities",
    sites: [
      ["https://www.roundnetnetherlands.com/communities", "Roundnet Netherlands Communities"],
      ["https://linktr.ee/coroundnet", "Colorado Roundnet"],
    ],
  },
  {
    name: "Media & Creators",
    slug: "media-creators",
    sites: [
      ["https://www.roundnetworld.com", "Roundnet World"],
      ["https://www.youtube.com/@Spikeball", "Spikeball on YouTube"],
      ["https://podcasts.apple.com/de/podcast/netzklatscher-der-roundnet-germany-podcast/id1493193481", "Netzklatscher — Roundnet Germany Podcast"],
    ],
  },
  {
    name: "Learn",
    slug: "learn",
    sites: [
      ["https://spikewiki.com", "Spike Wiki"],
      ["https://www.spikeball.com/pages/roundnet-101", "Roundnet 101"],
    ],
  },
  {
    name: "Gear & Apparel",
    slug: "gear-apparel",
    sites: [
      ["https://www.spikeball.com", "Spikeball"],
      ["https://www.premierspike.com", "Premier Spike"],
      ["https://revol.sport", "Revol"],
      ["https://nemesisround.net", "Nemesis Apparel"],
      ["https://strike360.com.br", "Strike 360"],
    ],
  },
];

await sql.transaction(
  directoryCategories.map((category, categoryPosition) => sql`
    INSERT INTO categories (name, slug, position)
    VALUES (${category.name}, ${category.slug}, ${categoryPosition})
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      position = EXCLUDED.position,
      updated_at = NOW()
  `),
);

const categoryRows = await sql`SELECT id, slug FROM categories`;
const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
const siteQueries = [];

for (const category of directoryCategories) {
  const categoryId = categoryIds.get(category.slug);
  if (!categoryId) throw new Error(`Missing category: ${category.slug}`);

  for (const [sitePosition, [url, title]] of category.sites.entries()) {
    siteQueries.push(sql`
      INSERT INTO sites (url, title, category_id, status, position)
      VALUES (${url}, ${title}, ${categoryId}, 'approved', ${sitePosition})
      ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        category_id = EXCLUDED.category_id,
        status = EXCLUDED.status,
        position = EXCLUDED.position,
        updated_at = NOW()
    `);
  }
}

const organizationCategoryId = categoryIds.get("organizations-events");
siteQueries.push(sql`
  UPDATE sites
  SET category_id = ${organizationCategoryId}, updated_at = NOW()
  WHERE url = 'https://www.usaroundnet.org'
`);

await sql.transaction(siteQueries);

const siteCount = directoryCategories.reduce(
  (total, category) => total + category.sites.length,
  0,
);

console.log(
  `Seeded ${directoryCategories.length} categories and ${siteCount} directory sites.`,
);
