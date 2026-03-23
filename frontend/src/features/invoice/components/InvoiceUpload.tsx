import { useState } from 'react'
import { Upload, FileX, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useUploadInvoice,
  useProjectMaterials,
  useDeleteInvoice,
} from '../hooks/useProjectMaterials'
import type { ProjectInvoiceGroup } from '../api/invoice'

interface Props {
  projectId: number
}

export default function InvoiceUpload({ projectId }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const uploadMutation = useUploadInvoice(projectId)
  const { data: invoiceGroups, isLoading } = useProjectMaterials(projectId)
  const deleteMutation = useDeleteInvoice(projectId)

  const handleDragEnter = () => setIsDragging(true)
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault()

  const acceptFile = (files: FileList | null) => {
    setFileError(null)
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      setFileError('Filen må være i XML-format.')
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    uploadMutation.mutate(selectedFile, {
      onSuccess: () => setSelectedFile(null),
    })
  }

  const handleClear = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  const hasInvoices = invoiceGroups && invoiceGroups.length > 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Materialfaktura
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Last opp EHF-fakturaer for å se materialer med NOBB-data og
          EPD-status.
        </p>
      </div>

      {/* Drop zone */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          }`}
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

      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

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
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Laster opp…' : 'Last opp'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={uploadMutation.isPending}
            >
              Fjern
            </Button>
          </div>
        </div>
      )}

      {uploadMutation.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadMutation.error instanceof Error
            ? uploadMutation.error.message
            : 'Noe gikk galt'}
        </div>
      )}

      {/* Existing invoices */}
      {isLoading && (
        <p className="text-sm text-gray-400 text-center py-4">
          Laster materialer…
        </p>
      )}

      {hasInvoices && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Opplastede fakturaer ({invoiceGroups.length})
          </p>
          {invoiceGroups.map((group) => (
            <InvoiceGroupCard
              key={group.invoice_id}
              group={group}
              onDelete={() => {
                if (group.invoice_id != null)
                  deleteMutation.mutate(group.invoice_id)
              }}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InvoiceGroupCard({
  group,
  onDelete,
  isDeleting,
}: {
  group: ProjectInvoiceGroup
  onDelete: () => void
  isDeleting: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const totalCo2 = group.items.reduce(
    (sum, item) => sum + (item.total_co2_kg ?? 0),
    0,
  )
  const itemCount = group.items.length

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate">
            {group.supplier_name ?? 'Ukjent leverandør'}
            {group.invoice_number && (
              <span className="ml-2 text-gray-400 font-normal">
                #{group.invoice_number}
              </span>
            )}
          </p>
          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
            <span>{itemCount} linjer</span>
            {totalCo2 > 0 && (
              <span>
                {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
                kg CO₂
              </span>
            )}
            {group.invoice_date && <span>{group.invoice_date}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2">Materiale</th>
                <th className="px-4 py-2">NOBB</th>
                <th className="px-4 py-2 text-right">Antall</th>
                <th className="px-4 py-2 text-right">CO₂ (kg)</th>
                <th className="px-4 py-2">EPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.items.map((item) => (
                <tr
                  key={item.id}
                  className={item.flagged ? 'bg-amber-50/50' : ''}
                >
                  <td className="px-4 py-2 text-gray-800 truncate max-w-48">
                    {item.material_name ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                    {item.nobb_number ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">
                    {item.quantity ?? '—'} {item.unit ?? ''}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">
                    {item.total_co2_kg != null
                      ? item.total_co2_kg.toLocaleString('nb-NO', {
                          maximumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.has_epd
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.has_epd ? 'Ja' : 'Nei'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
