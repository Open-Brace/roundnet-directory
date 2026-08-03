"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  initialSubmissionState,
  submitSite,
} from "@/app/submit/actions";

export function SubmissionForm() {
  const [state, action, pending] = useActionState(submitSite, initialSubmissionState);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    setUrl("");
    setTitle("");
    setTitleEdited(false);
  }, [state]);

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
        // The proposed title remains editable when a site cannot be previewed.
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
    <form action={action} className="stacked-form" ref={formRef}>
      <div className="form-field">
        <label htmlFor="suggestion-url">Website URL</label>
        <input
          autoComplete="url"
          id="suggestion-url"
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

      <div className="form-field">
        <div className="label-row">
          <label htmlFor="suggestion-title">Proposed name</label>
          {previewing ? <span>Finding site name…</span> : null}
        </div>
        <input
          id="suggestion-title"
          maxLength={120}
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleEdited(true);
          }}
          placeholder="Site name"
          required
          type="text"
          value={title}
        />
        <p className="field-hint">We’ll suggest a name from the site. You can change it.</p>
      </div>

      <div aria-hidden="true" className="honeypot">
        <label htmlFor="company">Company</label>
        <input autoComplete="off" id="company" name="company" tabIndex={-1} />
      </div>

      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Submitting…" : "Submit website"}
      </button>

      {state.message ? (
        <p
          aria-live="polite"
          className={`form-message ${state.status === "error" ? "form-error" : "form-success"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
