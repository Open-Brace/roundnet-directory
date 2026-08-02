"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { ResolvedSite } from "@/lib/site-metadata";

type DirectoryProps = {
  sites: ResolvedSite[];
};

export function Directory({ sites }: DirectoryProps) {
  const [query, setQuery] = useState("");

  const filteredSites = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    if (!searchTerm) return sites;

    return sites.filter((site) =>
      [site.title, site.hostname, site.url].some((value) =>
        value.toLocaleLowerCase().includes(searchTerm),
      ),
    );
  }, [query, sites]);

  return (
    <>
      <div className="search-field">
        <svg
          aria-hidden="true"
          className="search-icon"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" />
        </svg>
        <label className="visually-hidden" htmlFor="directory-search">
          Search roundnet links
        </label>
        <input
          autoComplete="off"
          id="directory-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search roundnet links…"
          spellCheck={false}
          type="search"
          value={query}
        />
      </div>

      <p aria-live="polite" className="result-count">
        {filteredSites.length} {filteredSites.length === 1 ? "link" : "links"}
      </p>

      {filteredSites.length > 0 ? (
        <ul className="site-list">
          {filteredSites.map((site) => (
            <li key={site.url}>
              <a href={site.url} rel="noreferrer" target="_blank">
                <Image
                  alt=""
                  className="site-icon"
                  height={20}
                  src={site.favicon}
                  unoptimized
                  width={20}
                />
                <span className="site-copy">
                  <span className="site-title">{site.title}</span>
                  <span className="site-hostname">{site.hostname}</span>
                </span>
                <svg
                  aria-hidden="true"
                  className="external-icon"
                  fill="none"
                  height="16"
                  viewBox="0 0 16 16"
                  width="16"
                >
                  <path d="M6 3h7v7M13 3 5 11" stroke="currentColor" />
                  <path d="M11 9v3.25c0 .414-.336.75-.75.75h-6.5a.75.75 0 0 1-.75-.75v-6.5c0-.414.336-.75.75-.75H7" stroke="currentColor" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">No links match “{query.trim()}”.</p>
      )}
    </>
  );
}
