import ErrorMessage from './ErrorMessage'
import FileDropZone from './FileDropZone'
import SelectedFileBar from './SelectedFileBar'
import { useFileSelect } from '@/shared/hooks/useFileSelect'
import { useRequireToken } from '@/shared/hooks/useRequireToken'

interface FileUploadShellProps<TData> {
  title: string
  description: string
  accept: string | string[]
  dropDescription: string
  fileErrorMessage: string
  analyzeLabel?: string
  analyzingLabel?: string
  parse: (file: File, token: string) => Promise<void>
  reset: () => void
  data: TData | null
  loading: boolean
  error: Error | null
  errorFallback: string
  children: (props: {
    data: TData
    clear: () => void
    requireToken: () => Promise<string>
    selectedFile: File | null
  }) => React.ReactNode
}

export default function FileUploadShell<TData>({
  title,
  description,
  accept,
  dropDescription,
  fileErrorMessage,
  analyzeLabel = 'Analyser',
  analyzingLabel = 'Analyserer…',
  parse,
  reset,
  data,
  loading,
  error,
  errorFallback,
  children,
}: FileUploadShellProps<TData>) {
  const { authReady, requireToken } = useRequireToken()

  const normalizedAccept = Array.isArray(accept) ? accept : [accept]
  const acceptAttr = normalizedAccept.join(',')

  const { selectedFile, fileError, acceptFile, clear } = useFileSelect({
    accept: normalizedAccept,
    errorMessage: fileErrorMessage,
    onClear: reset,
  })

  const handleParse = async () => {
    if (!selectedFile || !authReady) return
    const token = await requireToken()
    await parse(selectedFile, token)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>

      {!selectedFile && !data && (
        <FileDropZone
          accept={acceptAttr}
          description={dropDescription}
          onDrop={acceptFile}
        />
      )}

      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

      {selectedFile && !data && (
        <SelectedFileBar
          file={selectedFile}
          actionLabel={analyzeLabel}
          loadingLabel={analyzingLabel}
          isLoading={loading}
          onAction={handleParse}
          onClear={clear}
        />
      )}

      <ErrorMessage error={error} fallback={errorFallback} />

      {data && (
        <>
          {children({ data, clear, requireToken, selectedFile })}
          <div className="text-center">
            <button
              type="button"
              onClick={clear}
              className="text-sm text-gray-400 underline hover:text-gray-600"
            >
              Last opp ny fil
            </button>
          </div>
        </>
      )}
    </div>
  )
}
