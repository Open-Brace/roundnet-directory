import type { DirectorySite } from "@/data/sites";

const MAX_ICON_BYTES = 256_000;
const REQUEST_TIMEOUT_MS = 8_000;

export type ResolvedSite = {
  url: string;
  title: string;
  hostname: string;
  favicon: string;
};

const fallbackFavicon = "/favicon-fallback.svg";

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      namedEntities[name.toLowerCase()] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i"),
  );

  return match?.[1] ?? match?.[2];
}

function findFavicon(html: string, pageUrl: string) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel")?.toLowerCase() ?? "";
    const href = getAttribute(tag, "href");

    if (href && rel.split(/\s+/).some((value) => value.includes("icon"))) {
      try {
        return new URL(href, pageUrl).toString();
      } catch {
        // Try the next icon declaration.
      }
    }
  }

  return new URL("/favicon.ico", pageUrl).toString();
}

async function fetchFaviconAsDataUrl(url: string) {
  if (url.startsWith("data:image/") && url.length <= MAX_ICON_BYTES) {
    return url;
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "RoundnetDirectory/1.0" },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return fallbackFavicon;

    const contentType = response.headers.get("content-type")?.split(";")[0];
    const declaredSize = Number(response.headers.get("content-length") ?? 0);

    if (!contentType?.startsWith("image/") || declaredSize > MAX_ICON_BYTES) {
      return fallbackFavicon;
    }

    const icon = Buffer.from(await response.arrayBuffer());
    if (icon.byteLength > MAX_ICON_BYTES) return fallbackFavicon;

    return `data:${contentType};base64,${icon.toString("base64")}`;
  } catch {
    return fallbackFavicon;
  }
}

export async function resolveSite(site: DirectorySite): Promise<ResolvedSite> {
  const fallbackUrl = new URL(site.url);

  try {
    const response = await fetch(site.url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "RoundnetDirectory/1.0",
      },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Site returned ${response.status}`);

    const html = await response.text();
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1]) : site.fallbackTitle;
    const resolvedUrl = response.url || site.url;
    const faviconUrl = findFavicon(html, resolvedUrl);

    return {
      url: resolvedUrl,
      title: title || site.fallbackTitle,
      hostname: new URL(resolvedUrl).hostname.replace(/^www\./, ""),
      favicon: await fetchFaviconAsDataUrl(faviconUrl),
    };
  } catch {
    return {
      url: site.url,
      title: site.fallbackTitle,
      hostname: fallbackUrl.hostname.replace(/^www\./, ""),
      favicon: await fetchFaviconAsDataUrl(
        new URL("/favicon.ico", fallbackUrl).toString(),
      ),
    };
  }
}
