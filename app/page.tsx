import { Directory, type DirectorySection } from "@/components/directory";
import { getApprovedSites } from "@/db/queries";
import { resolveSite } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export default async function Home() {
  const directorySites = await getApprovedSites();
  const resolvedRows = await Promise.all(
    directorySites.map(async ({ category, site }) => ({
      category,
      site: await resolveSite({ url: site.url, fallbackTitle: site.title }),
    })),
  );

  const shortNames: Record<string, string> = {
    "tools-software": "Tools",
    "organizations-events": "Organizations",
    "clubs-communities": "Clubs",
    "media-creators": "Media",
    learn: "Learn",
    "gear-apparel": "Gear",
  };

  const sections = resolvedRows.reduce<DirectorySection[]>((result, row) => {
    const existing = result.find((section) => section.id === row.category.id);
    if (existing) {
      existing.sites.push(row.site);
      return result;
    }

    result.push({
      id: row.category.id,
      name: row.category.name,
      shortName: shortNames[row.category.slug] ?? row.category.name,
      slug: row.category.slug,
      sites: [row.site],
    });
    return result;
  }, []);

  return (
    <main>
      <header className="page-header">
        <h1>Roundnet Directory</h1>
        <p>Useful tools and websites for roundnet.</p>
      </header>
      <Directory sections={sections} />
    </main>
  );
}
