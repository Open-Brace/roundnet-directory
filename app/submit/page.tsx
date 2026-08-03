import Link from "next/link";

import { SubmissionForm } from "@/components/submission-form";

export const metadata = { title: "Suggest a website — Roundnet Directory" };

export default function SubmitPage() {
  return (
    <main className="narrow-page">
      <nav className="back-nav">
        <Link href="/">← Directory</Link>
      </nav>
      <header className="page-header">
        <h1>Suggest a website</h1>
        <p>Share a useful roundnet site. Submissions are reviewed before appearing.</p>
      </header>
      <SubmissionForm />
    </main>
  );
}
