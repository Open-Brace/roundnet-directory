import { isIP } from "node:net";

export function normalizeSiteUrl(value: string) {
  const input = value.trim();
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const parsed = new URL(withProtocol);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("Use an http or https website address.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Website addresses cannot include credentials.");
  }

  parsed.hash = "";

  const pathname = parsed.pathname === "/"
    ? ""
    : parsed.pathname.replace(/\/+$/, "");

  return `${parsed.origin}${pathname}${parsed.search}`;
}

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    return isBlockedIpv4(normalized.slice(7));
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("2001:db8:")
  );
}

export function isBlockedAddress(address: string) {
  const version = isIP(address);
  return version === 4 ? isBlockedIpv4(address) : version === 6 ? isBlockedIpv6(address) : false;
}
