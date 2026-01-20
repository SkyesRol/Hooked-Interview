export function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim();
  const url = new URL(trimmed);
  const pathname = url.pathname.replace(/\/+$/, "");
  const normalizedPath = pathname.endsWith("/v1") ? pathname : `${pathname || ""}/v1`;
  url.pathname = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function isSameOriginAsApp(apiBaseUrl: string) {
  try {
    const api = new URL(apiBaseUrl);
    return typeof window !== "undefined" && api.origin === window.location.origin;
  } catch {
    return false;
  }
}

