const ABSOLUTE_URL_RE = /^(?:[a-z]+:)?\/\//i;

export function resolveApiAssetUrl(path) {
  if (!path || typeof path !== 'string') return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  if (
    ABSOLUTE_URL_RE.test(trimmed)
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiBase = import.meta.env.VITE_API_URL || '';

  if (ABSOLUTE_URL_RE.test(apiBase)) {
    return new URL(normalizedPath, apiBase).toString();
  }

  return normalizedPath;
}
