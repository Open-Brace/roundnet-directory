"use client";

import { useEffect, useState } from "react";

import { addSiteAction } from "@/app/admin/actions";
import type { Category } from "@/db/schema";
import { getBaseUrl } from "@/lib/base-url";

type AdminAddSiteFormProps = {
  categories: Category[];
};

export function AdminAddSiteForm({ categories }: AdminAddSiteFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!url.trim() || titleEdited) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const response = await fetch(`/api/site-metadata?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { title?: string };
        if (response.ok && data.title) setTitle(data.title);
      } catch {
        // The title remains editable when a site cannot be previewed.
      } finally {
        if (!controller.signal.aborted) setPreviewing(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [titleEdited, url]);

  return (
    <form action={addSiteAction} className="add-site-form">
      <div className="form-field">
        <div className="label-row">
          <label htmlFor="new-title">Title</label>
          {previewing ? <span>Finding site name…</span> : null}
        </div>
        <input
          id="new-title"
          maxLength={120}
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleEdited(true);
          }}
          placeholder="Site name"
          required
          value={title}
        />
      </div>
      <div className="form-field">
        <div className="label-row">
          <label htmlFor="new-url">URL</label>
          <button
            className="inline-action"
            disabled={!url.trim()}
            onClick={() => {
              setUrl(getBaseUrl(url));
              setTitleEdited(false);
            }}
            title="Remove the path, query, and fragment"
            type="button"
          >
            Use base URL
          </button>
        </div>
        <input
          id="new-url"
          name="url"
          onChange={(event) => {
            setUrl(event.target.value);
            setTitleEdited(false);
          }}
          placeholder="https://example.com"
          required
          type="url"
          value={url}
        />
      </div>
      <div className="form-field category-field">
        <label htmlFor="new-category">Category</label>
        <select id="new-category" name="categoryId" required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
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
  );
}
