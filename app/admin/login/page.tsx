import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { isAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Admin — Roundnet Directory" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="narrow-page">
      <nav className="back-nav">
        <Link href="/">← Directory</Link>
      </nav>
      <header className="page-header">
        <h1>Admin</h1>
        <p>Sign in to review and manage directory links.</p>
      </header>
      <AdminLoginForm />
    </main>
  );
}
