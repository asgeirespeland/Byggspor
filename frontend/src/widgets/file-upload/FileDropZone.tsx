import { useId, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileDropZoneProps {
  description: string
  accept: string
  onDrop: (files: FileList) => void
}

export default function FileDropZone({
  description,
  accept,
  onDrop,
}: FileDropZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files.length > 0) onDrop(e.dataTransfer.files)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setIsDragging(false)
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        isDragging
          ? 'border-border bg-muted/50'
          : 'border-border bg-muted/30 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{description}</p>
      <p className="mt-1 text-xs text-muted-foreground">— eller —</p>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            onDrop(e.target.files)
        }}
      />
      <Button
        size="sm"
        className="mt-3 cursor-pointer"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        Velg fil
      </Button>
    </div>
  )
}
