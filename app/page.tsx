import { Directory } from "@/components/directory";
import { getApprovedSites } from "@/db/queries";
import { resolveSite } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export default async function Home() {
  const directorySites = await getApprovedSites();
  const resolvedSites = await Promise.all(
    directorySites.map((site) =>
      resolveSite({ url: site.url, fallbackTitle: site.title }),
    ),
  );

  return (
    <main>
      <header className="page-header">
        <h1>Roundnet Directory</h1>
        <p>Useful tools and websites for roundnet.</p>
      </header>
      <Directory sites={resolvedSites} />
    </main>
  );
}
