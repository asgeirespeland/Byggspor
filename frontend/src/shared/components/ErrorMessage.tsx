import { ApiError } from '@/shared/api/client'

interface Props {
  error: Error | null
  fallback?: string
}

/**
 * Inline error display with optional suggestion.
 *
 * Renders the error message and, if the error is an ApiError with a
 * `suggestion` field, shows actionable guidance below it.
 */
export default function ErrorMessage({
  error,
  fallback = 'Noe gikk galt',
}: Props) {
  if (!error) return null

  const message = error.message || fallback
  const suggestion = error instanceof ApiError ? error.suggestion : null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
      <p className="font-medium text-red-700">{message}</p>
      {suggestion && <p className="mt-1 text-red-600">{suggestion}</p>}
    </div>
  )
}
