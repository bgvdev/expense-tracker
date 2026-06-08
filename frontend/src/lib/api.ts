const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://expense-tracker-funw.onrender.com';

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

interface FetchOptions extends RequestInit {
  json?: unknown;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
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
    const data = await res.json().catch(() => ({}));
    const err = Object.assign(new Error((data as { message?: string }).message ?? res.statusText), {
      status: res.status,
      data,
    });
    throw err;
  }

  // 204 No Content has no body — skip JSON parsing
  if (res.status === 204) return null as unknown as T;

  return res.json() as Promise<T>;
}

export default apiFetch;
