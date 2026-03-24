const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestOptions = {
  method?: Method
  body?: unknown
  token?: string
}

/**
 * Structured API error with optional machine-readable code and user suggestion.
 */
export class ApiError extends Error {
  code: string
  suggestion: string | null

  constructor(message: string, code: string, suggestion: string | null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.suggestion = suggestion
  }
}

/** Extract a structured error from a failed API response body. */
function toApiError(
  payload: Record<string, unknown> | null,
  status: number,
): ApiError {
  const message =
    (payload?.error as string) ?? `Forespørselen feilet (${status})`
  const code = (payload?.code as string) ?? 'ERROR'
  const suggestion = (payload?.suggestion as string) ?? null
  return new ApiError(message, code, suggestion)
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
    throw toApiError(payload as Record<string, unknown> | null, res.status)
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
    throw toApiError(body as Record<string, unknown>, res.status)
  }

  return body as T
}
