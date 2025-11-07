/** Select single element by selector */
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

/**
 * Simple API wrapper for JSON requests.
 * - body is serialized as JSON when provided
 * - returns the fetch Response so callers can check ok/status and call .json()
 */
export async function api(path, opts = {}) {
  const headers = opts.headers ? { ...opts.headers } : {};
  const init = {
    method: opts.method || 'GET',
    headers,
    credentials: 'same-origin'
  };
  if (opts.body !== undefined) {
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
    init.body = JSON.stringify(opts.body);
  }
  return fetch(path, init);
}

/** Escape HTML to prevent XSS when inserting text into innerHTML */
export function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
