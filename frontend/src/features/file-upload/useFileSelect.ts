import { useState, useCallback } from 'react'

interface UseFileSelectOptions {
  accept?: string[]
  errorMessage?: string
  onClear?: () => void
}

export function useFileSelect(options: UseFileSelectOptions = {}) {
  const {
    accept = ['.xml', 'text/xml'],
    errorMessage = 'Ugyldig filformat.',
    onClear,
  } = options

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const acceptFile = useCallback(
    (files: FileList) => {
      setFileError(null)
      const file = files[0]
      const matchesType = accept.some(
        (a) =>
          (a.startsWith('.') && file.name.endsWith(a)) ||
          (!a.startsWith('.') && file.type === a),
      )
      if (!matchesType) {
        setFileError(errorMessage)
        return
      }
      setSelectedFile(file)
    },
    [accept, errorMessage],
  )

  const clear = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    onClear?.()
  }, [onClear])

  return { selectedFile, fileError, acceptFile, clear }
}
