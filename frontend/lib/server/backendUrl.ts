/**
 * Backend URL for Next.js Route Handlers (server-only).
 * Prefer BACKEND_URL on Railway for private networking; fall back to public URL.
 */
export function getServerBackendUrl(): string {
  const u =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://127.0.0.1:4000';
  return u.replace(/\/$/, '');
}
