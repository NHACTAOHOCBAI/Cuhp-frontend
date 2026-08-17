/**
 * Small fetch wrapper that prepends /api/v1 and injects the bearer token from localStorage.
 * Returns parsed JSON; throws on non-2xx with the server's `detail` message.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token: explicitToken, headers, ...rest } = opts
  const token = explicitToken ?? localStorage.getItem("token")

  const finalHeaders: Record<string, string> = {}
  if (!(rest.body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json"
  }
  if (headers) {
    Object.assign(finalHeaders, headers)
  }
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const relativeUrl = path.startsWith("/api/") ? path : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  const url = `${apiBase}${relativeUrl}`;

  const res = await fetch(url, { ...rest, headers: finalHeaders })
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      if (data && typeof data === "object" && "detail" in data) {
        detail = (data as { detail: string }).detail ?? detail
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}