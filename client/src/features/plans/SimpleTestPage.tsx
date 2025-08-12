import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FileText } from 'lucide-react'
import PdfViewer from './PdfViewer'
import OverlayStage from './OverlayStage'
import ToolPalette, { type SnappingSettings } from './ToolPalette'

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

interface ShapeStyle {
  stroke: string
  width: number
  fill?: string
  opacity?: number
  arrowStart?: boolean
  arrowEnd?: boolean
}

interface Shape {
  id: string
  type: 'rect' | 'ellipse' | 'polyline' | 'polygon' | 'arrow' | 'text' | 'highlighter' | 'measure_line' | 'measure_area'
  page: number
  layer: 'Markup' | 'Measurements' | 'Symbols' | 'Text'
  points?: number[]
  x?: number
  y?: number
  w?: number
  h?: number
  style: ShapeStyle
  meta: {
    text?: string
    fontSize?: number
    length?: number
    area?: number
    perimeter?: number
    units?: string
  }
}

interface LayerSettings {
  visible: boolean
  locked: boolean
  opacity: number
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

export default function SimpleTestPage() {
  const { toast } = useToast()

  // BlueBeam editor state
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [strokeColor, setStrokeColor] = useState('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [calibrations, setCalibrations] = useState<{ [pageNumber: number]: Calibration }>({})
  const [snappingSettings, setSnappingSettings] = useState<SnappingSettings>({
    enabled: false,
    snapToVertices: false,
    snapToAngles: false,
    snapToGrid: false,
    gridSpacing: 20,
    tolerance: 10
  })
  const [layerSettings, setLayerSettings] = useState<{ [layer: string]: LayerSettings }>({
    'Markup': { visible: true, locked: false, opacity: 1 },
    'Measurements': { visible: true, locked: false, opacity: 1 },
    'Symbols': { visible: true, locked: false, opacity: 1 },
    'Text': { visible: true, locked: false, opacity: 1 }
  })
  const [showEditor, setShowEditor] = useState(false)
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleTestEditor = () => {
    setShowEditor(true)
    toast({
      title: "BlueBeam Editor Loaded",
      description: "Editor ready. Upload a PDF or use the sample document.",
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    console.log('Starting file upload:', file.name, file.size) // Debug log
    
    try {
      // Read the file as ArrayBuffer for better compatibility
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const pdfUrl = URL.createObjectURL(blob)
      
      console.log('Created blob URL:', pdfUrl) // Debug log
      
      // Reset page state for new document
      setCurrentPage(1)
      setShapes([])
      setSelectedId(null)
      setPageInfo(null)
      setThumbnails([])
      
      setUploadedPdfUrl(pdfUrl)
      
      toast({
        title: "PDF Uploaded Successfully",
        description: `${file.name} is now loaded in the editor`,
      })
    } catch (error) {
      console.error('Upload error:', error) // Debug log
      toast({
        title: "Upload Failed",
        description: "Failed to load the PDF file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const currentPdfUrl = uploadedPdfUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  
  const testPlanFile = {
    id: 'test-plan-file-id',
    filename: uploadedPdfUrl ? 'Uploaded Plan.pdf' : 'Test Plan.pdf',
    url: currentPdfUrl,
    pages: 14
  }

  if (!showEditor) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <FileText className="w-24 h-24 text-slate-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            BlueBeam-Style PDF Editor Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
            Upload your own PDF plans or use the sample document to test all professional annotation and measurement tools.
          </p>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div className="flex items-center justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-8 h-8 border-2 border-slate-400 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-slate-600 dark:text-slate-400">Uploading PDF...</p>
                      </>
                    ) : (
                      <>
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          Click to upload your PDF plans
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Supports PDF files up to 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
            
            {uploadedPdfUrl && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  ✓ PDF uploaded successfully and ready for editing
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleTestEditor}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg w-full"
              disabled={isUploading}
            >
              <FileText className="w-5 h-5 mr-2" />
              {uploadedPdfUrl ? 'Open Your PDF in BlueBeam Editor' : 'Launch BlueBeam Editor with Sample'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEditor(false)}
              >
                Back to Test Page
              </Button>
              
              {/* Upload button in editor header */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border border-slate-400 border-t-blue-600 rounded-full mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Upload New PDF
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">BlueBeam Test Editor</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Professional PDF Annotation and Measurement Tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BlueBeam Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Palette */}
        <ToolPalette
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          onStrokeColorChange={setStrokeColor}
          onStrokeWidthChange={setStrokeWidth}
          snappingSettings={snappingSettings}
          onSnappingSettingsChange={setSnappingSettings}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex">
          {/* PDF Viewer with Overlay */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
            <PdfViewer
              key={testPlanFile.url} // Force re-render when URL changes
              pdfUrl={testPlanFile.url}
              currentPage={currentPage}
              zoom={zoom}
              setCurrentPage={setCurrentPage}
              setZoom={setZoom}
              onThumbsReady={setThumbnails}
              onPageReady={setPageInfo}
            />
            {pageInfo && (
              <OverlayStage
                pageWidth={pageInfo.width}
                pageHeight={pageInfo.height}
                zoom={zoom}
                shapes={shapes}
                setShapes={setShapes}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                activeTool={selectedTool}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                currentPage={currentPage}
                calibrations={calibrations}
                onCalibration={(page, pixels, units) => {
                  setCalibrations(prev => ({ ...prev, [page]: { pixelsPerUnit: pixels, units } }))
                }}
                snappingSettings={snappingSettings}
              />
            )}
          </div>

          {/* Right Rail - Info & Measurements */}
          <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Page Navigation */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Page {currentPage}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(testPlanFile.pages || 1, currentPage + 1))}
                    disabled={currentPage >= (testPlanFile.pages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {thumbnails.map((thumb) => (
                  <button
                    key={thumb.pageNumber}
                    className={`aspect-[8.5/11] border rounded ${
                      currentPage === thumb.pageNumber
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setCurrentPage(thumb.pageNumber)}
                  >
                    <canvas
                      ref={(el) => {
                        if (el && el !== thumb.canvas) {
                          const ctx = el.getContext('2d');
                          if (ctx) {
                            el.width = thumb.canvas.width;
                            el.height = thumb.canvas.height;
                            ctx.drawImage(thumb.canvas, 0, 0);
                          }
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                    <div className="text-xs text-slate-600 mt-1">
                      {thumb.pageNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Information */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Scale</h4>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span>
                  {calibrations[currentPage] ? (
                    `1 px = ${(1 / calibrations[currentPage].pixelsPerUnit).toFixed(3)} ${calibrations[currentPage].units}`
                  ) : (
                    'Not calibrated - use Calibrate tool to set scale'
                  )}
                </span>
              </div>
            </div>

            {/* Active Measurements */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Measurements</h4>
              <div className="space-y-2">
                {shapes
                  .filter(shape => shape.page === currentPage && (shape.type === 'measure_line' || shape.type === 'measure_area'))
                  .map(shape => (
                    <div 
                      key={shape.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedId === shape.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedId(shape.id)}
                    >
                      <div className="text-xs text-slate-500 uppercase tracking-wide">
                        {shape.type === 'measure_line' ? 'Length' : 'Area'}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {shape.type === 'measure_line' && shape.meta.length && (
                          `${shape.meta.length.toFixed(2)} ${shape.meta.units}`
                        )}
                        {shape.type === 'measure_area' && shape.meta.area && (
                          <>
                            <div>{shape.meta.area.toFixed(2)} {shape.meta.units}</div>
                            {shape.meta.perimeter && (
                              <div className="text-xs text-slate-500">
                                Perimeter: {shape.meta.perimeter.toFixed(2)} {shape.meta.units?.replace('²', '')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                }
                {shapes.filter(shape => shape.page === currentPage && (shape.type === 'measure_line' || shape.type === 'measure_area')).length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No measurements on this page
                    <br />
                    <span className="text-xs">Use the measurement tools to get started</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}