import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Upload, ZoomIn, ZoomOut } from 'lucide-react'
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
}

export default function FullBluebeamEditor() {
  const { toast } = useToast()
  
  // Core state
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [strokeColor, setStrokeColor] = useState('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // PDF state
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(1.0)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  
  // Advanced features
  const [snappingSettings] = useState<SnappingSettings>({
    enabled: false,
    snapToVertices: false,
    snapToAngles: false,
    snapToGrid: false,
    gridSpacing: 20,
    tolerance: 10
  })
  const [calibrations, setCalibrations] = useState<{ [pageNumber: number]: Calibration }>({})
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

  // Navigation functions
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

  // Professional features handlers
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

  // Undo/Redo functionality
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

  // Load PDF and detect actual page count
  useEffect(() => {
    if (!uploadedPdfUrl) return

    const loadPdfDocument = async () => {
      setIsLoadingPdf(true)
      try {
        console.log('Loading PDF document for page detection:', uploadedPdfUrl)
        
        // Disable worker for better compatibility
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
        
        const doc = await pdfjsLib.getDocument({
          url: uploadedPdfUrl,
          disableWorker: true,
        }).promise
        
        console.log('PDF loaded successfully, actual pages:', doc.numPages)
        setPdfDocument(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
        
        // Get first page dimensions for overlay sizing
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        setPageWidth(viewport.width)
        setPageHeight(viewport.height)
        
        toast({
          title: 'PDF Analyzed',
          description: `Document has ${doc.numPages} pages - full navigation enabled`,
        })
        
      } catch (error) {
        console.error('Error loading PDF for page detection:', error)
        // If PDF.js fails, fall back to user-controlled page count
        setTotalPages(10)
        toast({
          title: 'PDF Loaded',
          description: 'PDF loaded - you can manually set the page count in the header',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingPdf(false)
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
      {/* Header with Navigation and Controls */}
      <div className="bg-slate-800 text-white p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Professional BlueBeam Editor</h1>
            <span className="text-sm text-slate-300">Full Navigation + Professional Tools</span>
          </div>
          
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

            {/* PDF Info and Manual Page Count */}
            {uploadedPdfUrl && (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded">
                {isLoadingPdf ? (
                  <span className="text-sm text-yellow-200">Analyzing PDF...</span>
                ) : pdfDocument ? (
                  <span className="text-sm text-green-200">✓ {totalPages} pages detected</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">Pages:</span>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={totalPages}
                      onChange={(e) => setTotalPages(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-sm bg-slate-600 text-white border border-slate-500 rounded"
                      placeholder="Set manually"
                    />
                  </div>
                )}
              </div>
            )}

            <PdfUploadButton
              onUploadSuccess={(pdfUrl, filename) => {
                setUploadedPdfUrl(pdfUrl)
                // Don't set totalPages here - let the PDF analysis handle it
                setCurrentPage(1)
                setPdfDocument(null) // Reset for new document
                toast({
                  title: 'PDF uploaded successfully',
                  description: `${filename} - analyzing page count...`,
                })
              }}
              variant="outline"
              size="sm"
              className="text-slate-800"
            />
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
              {/* PDF Viewer with Navigation */}
              <iframe
                src={`${uploadedPdfUrl}#page=${currentPage}&view=FitH`}
                className="w-full h-full border-0"
                title="PDF Document"
                style={{ minHeight: '100%' }}
                key={`pdf-page-${currentPage}`}
              />
              
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 5 }}
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
                    if (typeof newShapes === 'function') {
                      setShapes(newShapes)
                    } else {
                      setShapes(newShapes)
                    }
                  }}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  strokeWidth={strokeWidth}
                  strokeColor={strokeColor}
                  calibrations={calibrations}
                  onCalibration={handleCalibration}
                  snappingSettings={snappingSettings}
                />
              </div>
              
              {/* Quick Navigation Overlay */}
              {totalPages > 1 && (
                <div className="absolute top-4 right-4 flex gap-2 z-30 pointer-events-auto">
                  <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1}
                      className="p-1 h-7 w-7"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <div className="text-sm font-medium px-2">
                      {currentPage}/{totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                      className="p-1 h-7 w-7"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Page Input Overlay */}
              <div className="absolute top-4 left-4 z-30 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Jump to:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value)
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page)
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Use ← → keys to navigate
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload a PDF to start</h2>
                <p className="text-gray-500 mb-4">Professional measurement and markup tools ready</p>
                <PdfUploadButton
                  onUploadSuccess={(pdfUrl, filename) => {
                    setUploadedPdfUrl(pdfUrl)
                    setCurrentPage(1)
                    setPdfDocument(null)
                    toast({
                      title: 'PDF uploaded successfully',
                      description: `${filename} - analyzing page count...`,
                    })
                  }}
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PDF Document
                </PdfUploadButton>
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
              Navigation: ← → PageUp/PageDown • Home/End for first/last page
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
              <div className="text-green-600 dark:text-green-400">
                {pdfDocument ? `✓ ${totalPages} pages analyzed` : '✓ Professional Tools Active'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}