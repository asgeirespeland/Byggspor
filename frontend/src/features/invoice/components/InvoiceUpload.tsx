import { useState } from 'react'
import { Upload, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Materialfaktura
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Last opp en EHF-faktura for å se materialer med NOBB-data og
          EPD-status.
        </p>
      </div>

      {/* Drop zone */}
      {!selectedFile && (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Upload className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            Dra og slipp filen din her
          </p>
          <p className="mt-1 text-xs text-gray-400">— eller —</p>
          <input
            id="file-input"
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files)}
          />
          <Button
            size="sm"
            className="mt-3 cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Velg fil
          </Button>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

      {/* Selected file */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <FileX className="h-4 w-4 text-gray-400" />
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
            <Button size="sm" onClick={handleParse} disabled={loading}>
              {loading ? 'Analyserer…' : 'Analyser'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Fjern
            </Button>
          </div>
        </div>
      )}

      {/* API error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {data && <InvoiceTable data={data} />}
    </div>
  )
}
