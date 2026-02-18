import * as React from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  title?: string
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  title
}: FilePreviewDialogProps) {
  const [scale, setScale] = React.useState(1)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const imageRef = React.useRef<HTMLImageElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Reset state when file changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [open, file])

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1))
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Create object URL safely
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImageUrl(null)
    }
  }, [file])

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-zinc-950/95 border-zinc-800">
        {/* Header/Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 z-10">
          <div className="flex items-center gap-2">
             <h3 className="text-sm font-medium text-zinc-100 truncate max-w-[300px]">
              {title || file.name}
            </h3>
            <span className="text-xs text-zinc-500">
               ({Math.round(scale * 100)}%)
            </span>
          </div>
         
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="h-8 w-8 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
              title="Reset Zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="h-8 w-8 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 ml-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950 cursor-grab active:cursor-grabbing"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Preview"
              draggable={false}
              className="max-h-full max-w-full object-contain transition-transform duration-75 ease-linear select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
            />
          )}
          
          {scale > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1.5 rounded-full text-xs text-white backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
              <Move className="h-3 w-3" />
              Drag to pan
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
