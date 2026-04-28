/**
 * Attachment uploader panel. Owns its own state; attachments are not yet wired
 * into the generate-invoice payload (backend support pending).
 */
import { useRef, useState } from 'react'
import { Inbox, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AttachmentsPanel() {
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 w-1/2 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          Vedlegg
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Inbox className="h-3.5 w-3.5" />
            Hent fra innboks
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            Last opp
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="rounded-md border border-dashed border-border bg-muted/50 px-4 py-5 text-center cursor-pointer hover:bg-muted transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-xs text-muted-foreground">
          Dra og slipp filer, lim inn, last opp eller hent fra innboks
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>{f.name}</span>
              <button
                className="text-muted-foreground hover:text-danger ml-2"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, j) => j !== i))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
