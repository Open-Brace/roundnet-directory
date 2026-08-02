import { Directory } from "@/components/directory";
import { directorySites } from "@/data/sites";
import { resolveSite } from "@/lib/site-metadata";

export const revalidate = 86_400;

export default async function Home() {
  const sites = await Promise.all(directorySites.map(resolveSite));

  return (
    <main>
      <header className="page-header">
        <h1>Roundnet Directory</h1>
        <p>Useful tools and websites for roundnet.</p>
      </header>
      <Directory sites={sites} />
    </main>
  );
}
