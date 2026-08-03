export function getBaseUrl(value: string) {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return url.origin;
  } catch {
    return value;
  }
}
