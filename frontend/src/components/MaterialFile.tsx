import React, { useState } from 'react'

const MaterialFile = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = () => setIsDragging(true)
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) {
      throw new Error('Something went wrong')
    }

    const xmlFiles = Array.from(files).filter(
      (file) => file.type === 'text/xml' || file.name.endsWith('.xml'),
    )
    if (xmlFiles.length === 0) {
      alert('Please select a valid XML file')
      return
    }
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name))
      const newFiles = xmlFiles.filter((f) => !existingNames.has(f.name))
      return [...prev, ...newFiles]
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div>
      <h3 className="pb-2 font-bold text-gray-900 text-2xl">Materialinvoice</h3>
      <p className="pb-2">
        Add your materialinvoice below and we will track the CO2 emmission for
        you
      </p>
      <div className="bg-white rounded-md p-7">
        <div
          className="bg-indigo-300 p-10 text-center border-2 rounded-md border-dashed border-gray-600"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={{
            backgroundColor: isDragging ? '#7986cb' : '#c5cae9',
          }}
        >
          <div>
            <p>Drag and drop your file here</p>
          </div>
          <p className="mt-5 mb-5">-- OR --</p>
          <input
            id="file-input"
            type="file"
            accept=".xml"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label
            htmlFor="file-input"
            className="inline-block bg-[#30466e] w-sm text-amber-50 px-6 py-4 rounded-md cursor-pointer hover:bg-[#222e45] transition-colors"
          >
            Browse files
          </label>
        </div>
        {/* File list — outside the drop zone */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border border-gray-200 rounded-md px-4 py-3 bg-gray-50"
              >
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB · XML
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-5 py-0.5 rounded-md font-medium">
                  Lagt til
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialFile
