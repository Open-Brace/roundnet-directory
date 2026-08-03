import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { AdminAddSiteForm } from "@/components/admin-add-site-form";
import { AdminSiteForm } from "@/components/admin-site-form";
import { getAllSites, getCategories } from "@/db/queries";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Roundnet Directory" };

type AdminPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const [allSites, categories, params] = await Promise.all([
    getAllSites(),
    getCategories(),
    searchParams,
  ]);
  const pending = allSites.filter((site) => site.status === "pending");
  const approved = allSites.filter((site) => site.status === "approved");
  const rejected = allSites.filter((site) => site.status === "rejected");

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Directory admin</h1>
          <p>{pending.length} awaiting review</p>
        </div>
        <div className="header-actions">
          <Link href="/">View directory</Link>
          <form action={logoutAction}>
            <button className="text-button" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      {params.notice ? <p className="admin-notice">{params.notice}</p> : null}
      {params.error ? <p className="admin-notice admin-error">{params.error}</p> : null}

      <section className="admin-section">
        <div className="section-heading">
          <h2>Add a site</h2>
        </div>
        <AdminAddSiteForm categories={categories} />
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h2>Pending</h2>
          <span>{pending.length}</span>
        </div>
        {pending.length ? (
          <ul className="admin-site-list">
            {pending.map((site) => (
              <AdminSiteForm categories={categories} key={site.id} site={site} />
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Nothing to review.</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h2>Published order</h2>
          <span>{approved.length}</span>
        </div>
        <div className="published-categories">
          {categories.map((category) => {
            const categorySites = approved.filter(
              (site) => site.categoryId === category.id,
            );
            if (!categorySites.length) return null;

            return (
              <section className="published-category" key={category.id}>
                <div className="published-category-heading">
                  <h3>{category.name}</h3>
                  <span>{categorySites.length}</span>
                </div>
                <ul className="admin-site-list">
                  {categorySites.map((site, index) => (
                    <AdminSiteForm
                      categories={categories}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === categorySites.length - 1}
                      key={site.id}
                      site={site}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      {rejected.length ? (
        <section className="admin-section">
          <div className="section-heading">
            <h2>Rejected</h2>
            <span>{rejected.length}</span>
          </div>
          <ul className="admin-site-list">
            {rejected.map((site) => (
              <AdminSiteForm categories={categories} key={site.id} site={site} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
