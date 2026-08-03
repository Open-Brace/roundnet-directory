"use client";

import { useId, useState, type ComponentPropsWithRef, type CSSProperties } from "react";

import { deleteSiteAction, updateSiteAction } from "@/app/admin/actions";
import type { Category, Site } from "@/db/schema";
import { getBaseUrl } from "@/lib/base-url";

type AdminSiteFormProps = {
  categories: Category[];
  dragHandleProps?: ComponentPropsWithRef<"button">;
  index?: number;
  isDragging?: boolean;
  site: Site;
  style?: CSSProperties;
  setNodeRef?: (node: HTMLLIElement | null) => void;
};

function PencilIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="m3 11.5-.5 2 2-.5 7.75-7.75-1.5-1.5L3 11.5Z" stroke="currentColor" strokeLinejoin="round" />
      <path d="m9.75 4.75 1.5 1.5" stroke="currentColor" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="5" cy="4" r="1" />
      <circle cx="11" cy="4" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="11" cy="12" r="1" />
    </svg>
  );
}

export function AdminSiteForm({
  categories,
  dragHandleProps,
  index,
  isDragging = false,
  site,
  style,
  setNodeRef,
}: AdminSiteFormProps) {
  const updateAction = updateSiteAction.bind(null, site.id);
  const deleteAction = deleteSiteAction.bind(null, site.id);
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState(site.url);
  const panelId = useId();
  const categoryName = categories.find((category) => category.id === site.categoryId)?.name;
  const hostname = (() => {
    try {
      return new URL(site.url).hostname.replace(/^www\./, "");
    } catch {
      return site.url;
    }
  })();

  return (
    <li
      className={`admin-site-card${isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="admin-site-summary">
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            aria-label={`Reorder ${site.title}`}
            className="drag-handle"
            type="button"
          >
            <DragIcon />
          </button>
        ) : (
          <span className="position-label">{site.status}</span>
        )}

        {typeof index === "number" ? (
          <span aria-hidden="true" className="position-label">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}

        <div className="admin-site-summary-copy">
          <strong>{site.title}</strong>
          <span>{hostname}</span>
        </div>

        {categoryName && typeof index !== "number" ? (
          <span className="admin-site-category">{categoryName}</span>
        ) : null}

        <button
          aria-controls={panelId}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Close" : "Edit"} ${site.title}`}
          className="edit-site-button"
          onClick={() => setExpanded((current) => !current)}
          title={expanded ? "Close editor" : "Edit site"}
          type="button"
        >
          <PencilIcon />
        </button>
      </div>

      {expanded ? (
        <form action={updateAction} className="admin-site-form" id={panelId}>
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
            <button
              className="text-button danger-button delete-button"
              formAction={deleteAction}
              formNoValidate
              onClick={(event) => {
                const confirmed = window.confirm(
                  `Delete “${site.title}”? This can’t be undone.`,
                );
                if (!confirmed) event.preventDefault();
              }}
              type="submit"
            >
              Delete
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
