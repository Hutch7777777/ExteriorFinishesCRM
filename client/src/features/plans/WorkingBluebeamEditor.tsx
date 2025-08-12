import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PdfUploadButton } from './PdfUploadButton'
import OverlayStage from './OverlayStage'
import ToolPalette from './ToolPalette'
import * as pdfjsLib from 'pdfjs-dist'

// Define types locally to avoid conflicts
interface SnappingSettings {
  enabled: boolean
  snapToVertices: boolean
  snapToAngles: boolean
  snapToGrid: boolean
  gridSpacing: number
  tolerance: number
}

interface Calibration {
  pixelsPerUnit: number
  units: string
}

interface Shape {
  id: string
  type: string
  page: number
  x: number
  y: number
  width?: number
  height?: number
  points?: number[]
  stroke?: string
  strokeWidth?: number
  fill?: string
  text?: string
  style?: any
  meta?: any
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'measurement'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  points?: number[]
  text?: string
  stroke: string
  strokeWidth: number
  layer: string
}

interface SnappingSettings {
  enabled: boolean
  snapToVertices: boolean
  snapToAngles: boolean
  snapToGrid: boolean
  gridSpacing: number
  tolerance: number
}

interface Calibration {
  pixelsPerUnit: number
  units: string
  scaleReference?: {
    startX: number
    startY: number
    endX: number
    endY: number
    actualLength: number
  }
}

export default function WorkingBluebeamEditor() {
  const { toast } = useToast()
  
  // Core state
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [strokeColor, setStrokeColor] = useState('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [snappingSettings] = useState<SnappingSettings>({
    enabled: false,
    snapToVertices: false,
    snapToAngles: false,
    snapToGrid: false,
    gridSpacing: 20,
    tolerance: 10
  })
  const [calibrations, setCalibrations] = useState<{ [pageNumber: number]: Calibration }>({})
  const [zoom, setZoom] = useState(1.0)
  const [layerSettings, setLayerSettings] = useState({
    Markup: true,
    Measurements: true,
    Symbols: true,
    Text: true
  })
  const [undoStack, setUndoStack] = useState<Shape[][]>([])
  const [redoStack, setRedoStack] = useState<Shape[][]>([])

  // PDF page dimensions (will be set when PDF loads)
  const [pageWidth, setPageWidth] = useState(800)
  const [pageHeight, setPageHeight] = useState(1100)

  const handleCalibration = useCallback((page: number, pixelsPerUnit: number, units: string) => {
    const calibration = { pixelsPerUnit, units }
    setCalibrations(prev => ({
      ...prev,
      [page]: calibration
    }))
  }, [])

  const handleSnappingSettingsChange = useCallback((settings: SnappingSettings) => {
    // This will be handled by the ToolPalette component internally for now
  }, [])

  const handleLayerToggle = useCallback((layer: keyof typeof layerSettings) => {
    setLayerSettings(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }, [])

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    
    const currentShapes = [...shapes]
    const previousShapes = undoStack[undoStack.length - 1]
    
    setRedoStack(prev => [...prev, currentShapes])
    setShapes(previousShapes)
    setUndoStack(prev => prev.slice(0, -1))
  }, [shapes, undoStack])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    
    const currentShapes = [...shapes]
    const nextShapes = redoStack[redoStack.length - 1]
    
    setUndoStack(prev => [...prev, currentShapes])
    setShapes(nextShapes)
    setRedoStack(prev => prev.slice(0, -1))
  }, [shapes, redoStack])

  // Save state for undo functionality
  const saveShapeState = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-9), [...shapes]]) // Keep last 10 states
    setRedoStack([]) // Clear redo stack when new action is performed
  }, [shapes])

  // PDF navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, totalPages])

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  // Load PDF and get page count
  useEffect(() => {
    if (!uploadedPdfUrl) return

    const loadPdfDocument = async () => {
      try {
        // Disable worker for better compatibility
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
        
        const doc = await pdfjsLib.getDocument({
          url: uploadedPdfUrl,
          disableWorker: true,
        }).promise
        
        setPdfDocument(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
        
        // Get first page dimensions
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        setPageWidth(viewport.width)
        setPageHeight(viewport.height)
        
      } catch (error) {
        console.error('Error loading PDF:', error)
        toast({
          title: 'PDF Error',
          description: 'Failed to load PDF document for navigation',
          variant: 'destructive'
        })
      }
    }

    loadPdfDocument()
  }, [uploadedPdfUrl, toast])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!uploadedPdfUrl || totalPages <= 1) return
      
      // Only handle when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight': 
        case 'PageDown':
          e.preventDefault()
          goToNextPage()
          break
        case 'Home':
          e.preventDefault()
          setCurrentPage(1)
          break
        case 'End':
          e.preventDefault()
          setCurrentPage(totalPages)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [uploadedPdfUrl, totalPages, goToPrevPage, goToNextPage])

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">BlueBeam-Style Editor</h1>
            <span className="text-sm text-slate-300">Native PDF + Annotations</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Page Navigation */}
              {uploadedPdfUrl && totalPages > 1 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="p-1 h-7 w-7 text-white hover:bg-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-white mx-2">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    className="p-1 h-7 w-7 text-white hover:bg-slate-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Zoom Controls */}
              {uploadedPdfUrl && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                    className="p-1 h-7 w-7 text-white hover:bg-slate-600"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-white mx-2">
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                    className="p-1 h-7 w-7 text-white hover:bg-slate-600"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <PdfUploadButton
                onUploadSuccess={(pdfUrl, filename) => {
                  setUploadedPdfUrl(pdfUrl)
                  toast({
                    title: 'PDF uploaded successfully',
                    description: `${filename} is ready for annotation.`,
                  })
                }}
                variant="outline"
                size="sm"
                className="text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Professional Tool Palette */}
        <div className="w-80 bg-slate-50 border-r border-slate-300 overflow-y-auto">
          <ToolPalette
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            snappingSettings={snappingSettings}
            onSnappingSettingsChange={handleSnappingSettingsChange}
            layerSettings={layerSettings}
            onLayerToggle={handleLayerToggle}
            hasUnsavedChanges={shapes.length > 0}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 relative bg-white dark:bg-slate-900">
          {uploadedPdfUrl ? (
            <div className="relative w-full h-full">
              {/* Native PDF viewer with page navigation */}
              <iframe
                src={`${uploadedPdfUrl}#page=${currentPage}&zoom=${Math.round(zoom * 100)}`}
                className="w-full h-full border-0"
                title="PDF Document"
                style={{ minHeight: '100%' }}
                key={`pdf-${currentPage}-${zoom}`}
              />
              
              {/* Annotation overlay - simplified version */}
              <div className="absolute inset-0 pointer-events-auto">
                <div 
                  className="w-full h-full bg-transparent relative"
                  style={{ minHeight: '100%' }}
                >
                  {/* Professional Konva-based annotation overlay */}
                  <OverlayStage
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                    zoom={zoom}
                    currentPage={currentPage}
                    activeTool={selectedTool}
                    shapes={shapes}
                    setShapes={(newShapes) => {
                      saveShapeState()
                      setShapes(newShapes)
                    }}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    calibrations={calibrations}
                    onCalibration={handleCalibration}
                    snappingSettings={snappingSettings}
                  />
                  
                  {/* Page navigation overlay controls */}
                  <div className="absolute top-4 right-4 flex gap-2 z-30">
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 bg-white/90 rounded px-2 py-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={goToPrevPage}
                          disabled={currentPage <= 1}
                          className="p-1 h-6 w-6"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-medium px-2">
                          {currentPage}/{totalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={goToNextPage}
                          disabled={currentPage >= totalPages}
                          className="p-1 h-6 w-6"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold mb-2">No PDF Loaded</h3>
                <p className="text-sm">Upload a PDF file to begin annotation</p>
                <div className="mt-4">
                  <PdfUploadButton
                    onUploadSuccess={(pdfUrl, filename) => {
                      setUploadedPdfUrl(pdfUrl)
                      toast({
                        title: 'PDF uploaded successfully',
                        description: `${filename} is ready for annotation.`,
                      })
                    }}
                    size="default"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Status Bar */}
      <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-6">
            <div>
              Tool: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTool}</span>
            </div>
            <div>
              Page: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage} of {totalPages}</span>
            </div>
            <div>
              Zoom: <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="text-xs text-slate-500">
              Navigation: ← → or PageUp/PageDown • Home/End for first/last page
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div>
              Shapes: <span className="font-semibold text-slate-800 dark:text-slate-200">{shapes.length}</span>
            </div>
            <div>
              Snapping: <span className="font-semibold text-slate-800 dark:text-slate-200">
                {snappingSettings.enabled ? 'On' : 'Off'}
              </span>
            </div>
            {uploadedPdfUrl && (
              <div className="text-green-600 dark:text-green-400">✓ PDF Ready</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}