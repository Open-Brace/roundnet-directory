"use client";

import { useState } from "react";

import type { Category, Site } from "@/db/schema";
import { getBaseUrl } from "@/lib/base-url";

import {
  moveSiteAction,
  updateSiteAction,
} from "@/app/admin/actions";

type AdminSiteFormProps = {
  categories: Category[];
  index?: number;
  isFirst?: boolean;
  isLast?: boolean;
  site: Site;
};

export function AdminSiteForm({ categories, index, isFirst, isLast, site }: AdminSiteFormProps) {
  const updateAction = updateSiteAction.bind(null, site.id);
  const [url, setUrl] = useState(site.url);

  return (
    <li className="admin-site-card">
      <form action={updateAction} className="admin-site-form">
        <div className="admin-card-heading">
          <span className="position-label">
            {typeof index === "number" ? String(index + 1).padStart(2, "0") : site.status}
          </span>
          {site.status === "approved" ? (
            <div className="order-buttons" aria-label={`Reorder ${site.title}`}>
              <button
                aria-label={`Move ${site.title} up`}
                disabled={isFirst}
                formAction={moveSiteAction.bind(null, site.id, "up")}
                type="submit"
              >
                ↑
              </button>
              <button
                aria-label={`Move ${site.title} down`}
                disabled={isLast}
                formAction={moveSiteAction.bind(null, site.id, "down")}
                type="submit"
              >
                ↓
              </button>
            </div>
          ) : null}
        </div>

        <div className="admin-fields">
          <div className="form-field">
            <label htmlFor={`title-${site.id}`}>Title</label>
            <input
              defaultValue={site.title}
              id={`title-${site.id}`}
              maxLength={120}
              name="title"
              required
            />
          </div>
          <div className="form-field">
            <div className="label-row">
              <label htmlFor={`url-${site.id}`}>URL</label>
              <button
                className="inline-action"
                onClick={() => setUrl(getBaseUrl(url))}
                title="Remove the path, query, and fragment"
                type="button"
              >
                Use base URL
              </button>
            </div>
            <input
              id={`url-${site.id}`}
              name="url"
              onChange={(event) => setUrl(event.target.value)}
              required
              type="url"
              value={url}
            />
          </div>
          <div className="form-field category-field">
            <label htmlFor={`category-${site.id}`}>Category</label>
            <select
              defaultValue={site.categoryId ?? ""}
              id={`category-${site.id}`}
              name="categoryId"
              required
            >
              <option disabled value="">Choose</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field status-field">
            <label htmlFor={`status-${site.id}`}>Status</label>
            <select defaultValue={site.status} id={`status-${site.id}`} name="status">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="admin-card-actions">
          <button className="secondary-button" type="submit">Save</button>
          {site.status === "pending" ? (
            <>
              <button
                className="primary-button compact-button"
                name="statusOverride"
                type="submit"
                value="approved"
              >
                Approve
              </button>
              <button
                className="text-button danger-button"
                name="statusOverride"
                type="submit"
                value="rejected"
              >
                Reject
              </button>
            </>
          ) : null}
        </div>
      </form>
    </li>
  );
}
