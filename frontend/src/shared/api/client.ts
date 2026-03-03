const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function postFile<T>(endpoint: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    body: form,
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }

  return body as T
}
