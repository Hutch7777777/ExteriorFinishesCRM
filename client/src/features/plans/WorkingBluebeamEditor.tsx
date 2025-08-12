import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PdfUploadButton } from './PdfUploadButton'
import OverlayStage from './OverlayStage'
import ToolPalette, { type SnappingSettings } from './ToolPalette'

interface Shape {
  id: string
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
  const [currentPage] = useState(1)
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

  const handleCalibration = useCallback((pageNumber: number, calibration: Calibration) => {
    setCalibrations(prev => ({
      ...prev,
      [pageNumber]: calibration
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
              {/* Native PDF viewer using iframe */}
              <iframe
                src={uploadedPdfUrl}
                className="w-full h-full border-0"
                title="PDF Document"
                style={{ minHeight: '100%' }}
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
                  
                  {/* Zoom controls */}
                  <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90"
                      onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                    >
                      -
                    </Button>
                    <div className="bg-white/90 px-3 py-1 rounded text-sm font-medium">
                      {Math.round(zoom * 100)}%
                    </div>
                    <Button
                      size="sm"
                      variant="outline" 
                      className="bg-white/90"
                      onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                    >
                      +
                    </Button>
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
              Page: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span>
            </div>
            <div>
              Zoom: <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(zoom * 100)}%</span>
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