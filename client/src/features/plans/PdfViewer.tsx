import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

interface PageInfo {
  pageNumber: number
  width: number
  height: number
  scale: number
}

interface Thumbnail {
  pageNumber: number
  canvas: HTMLCanvasElement
}

interface PdfViewerProps {
  pdfUrl: string
  onPageReady?: (pageInfo: PageInfo) => void
  onThumbsReady?: (thumbs: Thumbnail[]) => void
  zoom: number
  setZoom: (zoom: number) => void
  currentPage: number
  setCurrentPage: (page: number) => void
}

export default function PdfViewer({ 
  pdfUrl, 
  onPageReady, 
  onThumbsReady, 
  zoom, 
  setZoom, 
  currentPage, 
  setCurrentPage 
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return

    setLoading(true)
    setError(null)

    console.log('Loading PDF from URL:', pdfUrl) // Debug log
    
    pdfjsLib.getDocument({ url: pdfUrl, cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true }).promise
      .then((pdf) => {
        console.log('PDF loaded successfully:', pdf) // Debug log
        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        
        // Generate thumbnails for all pages
        generateThumbnails(pdf)
        
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading PDF:', err)
        console.error('PDF URL:', pdfUrl) // Debug log
        setError(`Failed to load PDF: ${err.message}`)
        setLoading(false)
      })
  }, [pdfUrl, setCurrentPage])

  // Generate thumbnails for all pages
  const generateThumbnails = useCallback(async (pdf: any) => {
    const thumbnails: Thumbnail[] = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 0.2 })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          thumbnails.push({
            pageNumber: pageNum,
            canvas: canvas
          })
        }
      } catch (err) {
        console.error(`Error generating thumbnail for page ${pageNum}:`, err)
      }
    }
    
    onThumbsReady?.(thumbnails)
  }, [onThumbsReady])

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !containerRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!
        
        // Calculate scale to fit container width
        const containerWidth = containerRef.current!.clientWidth - 40 // padding
        const baseViewport = page.getViewport({ scale: 1 })
        const baseScale = containerWidth / baseViewport.width
        const finalScale = baseScale * zoom
        
        const viewport = page.getViewport({ scale: finalScale })
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        // Render page
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
        
        // Notify parent about page info
        onPageReady?.({
          pageNumber: currentPage,
          width: viewport.width,
          height: viewport.height,
          scale: finalScale
        })
        
      } catch (err) {
        console.error('Error rendering page:', err)
        setError('Failed to render page')
      }
    }

    renderPage()
  }, [pdfDocument, currentPage, zoom, onPageReady])

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3)
    setZoom(newZoom)
    
    // Reset pan when zooming out to 1x or less
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 })
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.5)
    setZoom(newZoom)
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 })
    }
  }
  const handleFitToScreen = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      setPan({ x: 0, y: 0 })
    }
  }

  if (!pdfUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            📄
          </div>
          <h3 className="text-lg font-medium mb-2">No PDF Selected</h3>
          <p className="text-sm">Select a plan from the left panel to start viewing</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-6">
          <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 mb-2">Loading PDF...</p>
          <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded border max-w-md">
            <p className="font-mono break-all">{pdfUrl}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">PDF Load Error</h3>
          <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
          <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded border">
            <p className="font-mono break-all">{pdfUrl}</p>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Check browser console for detailed error information
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-auto cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        <div 
          className="min-w-full min-h-full flex items-center justify-center p-4"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center'
          }}
        >
          <canvas 
            ref={canvasRef}
            className="shadow-lg border border-slate-300 dark:border-slate-600 bg-white max-w-none"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {currentPage} / {totalPages}
          </span>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleFitToScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-1">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Page {currentPage} of {totalPages} • {Math.round(zoom * 100)}% zoom
        </div>
      </div>
    </div>
  )
}