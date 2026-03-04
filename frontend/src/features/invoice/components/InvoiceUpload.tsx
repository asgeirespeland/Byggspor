import { useState } from 'react'

import { useInvoiceParse } from '../hooks/useInvoiceParse'
import InvoiceTable from './InvoiceTable'

export default function InvoiceUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const { parse, reset, data, loading, error } = useInvoiceParse()

  const handleDragEnter = () => setIsDragging(true)

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const acceptFile = (files: FileList | null) => {
    setFileError(null)
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      setFileError('Filen må være i XML-format.')
      return
    }

    setSelectedFile(file)
    reset()
  }

  const handleParse = async () => {
    if (!selectedFile) return
    await parse(selectedFile)
  }

  const handleClear = () => {
    setSelectedFile(null)
    setFileError(null)
    reset()
  }

  return (
    <div>
      <h3 className="pb-2 text-2xl font-bold text-gray-900">Materialfaktura</h3>
      <p className="pb-2 text-gray-600">
        Last opp en EHF-faktura for å se materialer med NOBB-data og EPD-status.
      </p>

      <div className="rounded-md bg-white p-7">
        {/* Drop zone */}
        {!selectedFile && (
          <div
            className={`rounded-md border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? 'border-[#30466e] bg-indigo-200'
                : 'border-gray-400 bg-indigo-100'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <p className="text-gray-700">Dra og slipp filen din her</p>
            <p className="mb-5 mt-5 text-gray-400">— eller —</p>
            <input
              id="file-input"
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files)}
            />
            <label
              htmlFor="file-input"
              className="inline-block cursor-pointer rounded-md bg-[#30466e] px-6 py-4 text-amber-50 transition-colors hover:bg-[#222e45]"
            >
              Velg fil
            </label>
          </div>
        )}

        {/* File error */}
        {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}

        {/* Selected file */}
        {selectedFile && (
          <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-[#30466e]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleParse}
                disabled={loading}
                className="rounded-md bg-[#30466e] px-4 py-2 text-sm text-white transition-colors hover:bg-[#222e45] disabled:opacity-50"
              >
                {loading ? 'Analyserer...' : 'Analyser'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Fjern
              </button>
            </div>
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {data && <InvoiceTable data={data} />}
      </div>
    </div>
  )
}
