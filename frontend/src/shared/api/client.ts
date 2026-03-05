const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestOptions = {
  method?: Method
  body?: unknown
  token?: string
}

/**
 * Generic JSON request helper for backend endpoints.
 * Adds Authorization header when a bearer token is provided.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (payload as { error?: string } | null)?.error ??
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return payload as T
}

/**
 * Upload a single file using multipart/form-data.
 * Used by invoice parsing endpoints.
 */
export async function postFile<T>(
  endpoint: string,
  file: File,
  token?: string,
): Promise<T> {
  const form = new FormData()
  form.append('file', file)

  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: form,
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }

  return body as T
}
