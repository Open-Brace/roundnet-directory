"use client";

import { useState } from "react";

import { addSiteAction } from "@/app/admin/actions";
import { getBaseUrl } from "@/lib/base-url";

export function AdminAddSiteForm() {
  const [url, setUrl] = useState("");

  return (
    <form action={addSiteAction} className="add-site-form">
      <div className="form-field">
        <label htmlFor="new-title">Title</label>
        <input id="new-title" maxLength={120} name="title" required />
      </div>
      <div className="form-field">
        <div className="label-row">
          <label htmlFor="new-url">URL</label>
          <button
            className="inline-action"
            disabled={!url.trim()}
            onClick={() => setUrl(getBaseUrl(url))}
            title="Remove the path, query, and fragment"
            type="button"
          >
            Use base URL
          </button>
        </div>
        <input
          id="new-url"
          name="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          required
          type="url"
          value={url}
        />
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
