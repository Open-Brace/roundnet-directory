import Link from "next/link";
import { redirect } from "next/navigation";

import { addSiteAction, logoutAction } from "@/app/admin/actions";
import { AdminSiteForm } from "@/components/admin-site-form";
import { getAllSites } from "@/db/queries";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Roundnet Directory" };

type AdminPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const [allSites, params] = await Promise.all([getAllSites(), searchParams]);
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
        <form action={addSiteAction} className="add-site-form">
          <div className="form-field">
            <label htmlFor="new-title">Title</label>
            <input id="new-title" maxLength={120} name="title" required />
          </div>
          <div className="form-field">
            <label htmlFor="new-url">URL</label>
            <input id="new-url" name="url" placeholder="https://example.com" required type="url" />
          </div>
          <div className="form-field status-field">
            <label htmlFor="new-status">Status</label>
            <select defaultValue="approved" id="new-status" name="status">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="primary-button compact-button" type="submit">Add site</button>
        </form>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h2>Pending</h2>
          <span>{pending.length}</span>
        </div>
        {pending.length ? (
          <ul className="admin-site-list">
            {pending.map((site) => <AdminSiteForm key={site.id} site={site} />)}
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
        <ul className="admin-site-list">
          {approved.map((site, index) => (
            <AdminSiteForm
              index={index}
              isFirst={index === 0}
              isLast={index === approved.length - 1}
              key={site.id}
              site={site}
            />
          ))}
        </ul>
      </section>

      {rejected.length ? (
        <section className="admin-section">
          <div className="section-heading">
            <h2>Rejected</h2>
            <span>{rejected.length}</span>
          </div>
          <ul className="admin-site-list">
            {rejected.map((site) => <AdminSiteForm key={site.id} site={site} />)}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
