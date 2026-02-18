import * as React from "react"
import { Upload } from "lucide-react"

import { cn } from "@/lib/utils"

interface FileDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesAdded: (files: File[]) => void
  accept?: string
  maxFiles?: number
}

const FileDropzone = React.forwardRef<HTMLDivElement, FileDropzoneProps>(
  ({ className, onFilesAdded, accept, maxFiles, ...props }, ref) => {
    const [isDragActive, setIsDragActive] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files)
        // Basic filter based on accept prop (simple extension check)
        const validFiles = accept 
          ? fileList.filter(file => accept.includes(file.name.split('.').pop()?.toLowerCase() || '')) 
          : fileList
        
        onFilesAdded(validFiles)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesAdded(Array.from(e.target.files))
        // Reset value to allow selecting same file again if needed
        e.target.value = ""
      }
    }

    const handleClick = () => {
      inputRef.current?.click()
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 transition-colors hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/50 cursor-pointer",
          isDragActive && "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-950/20",
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Upload className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Seret & jatuhkan file di sini, atau <span className="text-blue-600 dark:text-blue-400">klik untuk pilih</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {accept ? accept.replace(/\./g, '').toUpperCase().split(',').join(', ') : 'All files'} (maks 10Mb)
            </p>
          </div>
        </div>
      </div>
    )
  }
)
FileDropzone.displayName = "FileDropzone"

export { FileDropzone }
