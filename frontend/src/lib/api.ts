// Relative URLs → Next.js rewrite proxies /api/* to Render (no CORS).
// To change the proxy destination, set BACKEND_URL in next.config.ts or .env.local.
const BASE_URL = '';

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

interface FetchOptions extends RequestInit {
  json?: unknown;
}

/**
 * The error shape apiFetch throws. Exported so call sites can narrow on it
 * instead of re-declaring the cast at every catch block.
 */
export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Pages that legitimately receive a 401 as a normal result (bad credentials) and
// must not be treated as an expired session.
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/**
 * An unexpected 401 means the stored token is gone or expired. Clear it and send
 * the user to the login page — otherwise pages that suppress the
 * "unauthenticated" error render as permanently blank with no explanation.
 */
function handleExpiredSession(path: string): void {
  if (typeof window === "undefined") return;
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return;

  localStorage.removeItem("auth_token");

  const onPublicPage = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) =>
    window.location.pathname.startsWith(p)
  );
  if (!onPublicPage) {
    window.location.replace("/login?expired=1");
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    if (res.status === 401) handleExpiredSession(path);

    const data = await res.json().catch(() => ({}));
    const err: ApiError = Object.assign(
      new Error((data as { message?: string }).message ?? res.statusText),
      { status: res.status, data }
    );
    throw err;
  }

  // 204 No Content has no body — skip JSON parsing
  if (res.status === 204) return null as unknown as T;

  return res.json() as Promise<T>;
}

export default apiFetch;
