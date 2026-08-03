"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ResolvedSite } from "@/lib/site-metadata";

type DirectoryProps = {
  sections: DirectorySection[];
};

export type DirectorySection = {
  id: number;
  name: string;
  shortName: string;
  slug: string;
  sites: ResolvedSite[];
};

export function Directory({ sections }: DirectoryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [reservedResultsHeight, setReservedResultsHeight] = useState<number | null>(null);
  const pendingScrollPosition = useRef<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (pendingScrollPosition.current === null) return;
    window.scrollTo(0, pendingScrollPosition.current);
    pendingScrollPosition.current = null;
  }, [activeCategory]);

  function selectCategory(category: string) {
    if (category === activeCategory) return;

    pendingScrollPosition.current = window.scrollY;
    if (category === "all") {
      setReservedResultsHeight(null);
    } else {
      setReservedResultsHeight((current) =>
        Math.max(current ?? 0, resultsRef.current?.offsetHeight ?? 0),
      );
    }
    setActiveCategory(category);
  }

  const filteredSections = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    const visibleSections = activeCategory === "all"
      ? sections
      : sections.filter((section) => section.slug === activeCategory);

    return visibleSections
      .map((section) => ({
        ...section,
        sites: searchTerm
          ? section.sites.filter((site) =>
              [site.title, site.hostname, site.url].some((value) =>
                value.toLocaleLowerCase().includes(searchTerm),
              ),
            )
          : section.sites,
      }))
      .filter((section) => section.sites.length > 0);
  }, [activeCategory, query, sections]);

  const resultCount = filteredSections.reduce(
    (total, section) => total + section.sites.length,
    0,
  );

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

      <nav aria-label="Directory categories" className="category-nav">
        <button
          aria-pressed={activeCategory === "all"}
          onClick={() => selectCategory("all")}
          type="button"
        >
          All
        </button>
        {sections.map((section) => (
          <button
            aria-label={section.name}
            aria-pressed={activeCategory === section.slug}
            key={section.id}
            onClick={() => selectCategory(section.slug)}
            type="button"
          >
            {section.shortName}
          </button>
        ))}
      </nav>

      <p aria-live="polite" className="result-count">
        {resultCount} {resultCount === 1 ? "link" : "links"}
      </p>

      <div
        className="directory-results"
        ref={resultsRef}
        style={reservedResultsHeight ? { minHeight: reservedResultsHeight } : undefined}
      >
        {resultCount > 0 ? (
          <div className="directory-sections">
          {filteredSections.map((section) => (
            <section className="directory-section" key={section.id}>
              <div className="directory-section-heading">
                <h2>{section.name}</h2>
                <span>{section.sites.length}</span>
              </div>
              <ul className="site-list">
                {section.sites.map((site) => (
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
            </section>
          ))}
          </div>
        ) : (
          <p className="empty-state">No links match “{query.trim()}”.</p>
        )}
      </div>

      <footer className="directory-footer">
        <Link href="/submit">Suggest a website</Link>
        <Link href="/admin">Admin login</Link>
      </footer>
    </>
  );
}
