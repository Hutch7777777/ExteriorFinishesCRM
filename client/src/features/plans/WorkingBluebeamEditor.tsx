import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Square, Circle, Type, Ruler, MousePointer, PenTool } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import OverlayStage from './OverlayStage'

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
  const [isUploading, setIsUploading] = useState(false)
  const [currentPage] = useState(1)
  const [snappingSettings] = useState<SnappingSettings>({
    enabled: false,
    snapToVertices: false,
    snapToAngles: false,
    snapToGrid: false,
    gridSpacing: 20,
    tolerance: 10
  })
  const [calibrations] = useState<{ [pageNumber: number]: Calibration }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    try {
      // Create blob URL for native PDF viewing
      const pdfUrl = URL.createObjectURL(file)
      setUploadedPdfUrl(pdfUrl)
      
      toast({
        title: "PDF Loaded Successfully",
        description: "Ready for annotation using native browser PDF viewer",
      })
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to load PDF",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'line', name: 'Line', icon: PenTool },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'measurement', name: 'Measure', icon: Ruler },
  ]

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
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isUploading}
                className="cursor-pointer text-slate-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isUploading ? 'Loading...' : 'Upload PDF'}
              </Button>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool Palette */}
        <div className="w-20 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 p-2">
          <div className="space-y-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                size="sm"
                className="w-full h-12 flex flex-col items-center gap-1 text-xs"
                onClick={() => setSelectedTool(tool.id)}
                title={tool.name}
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>

          {/* Color & Stroke Controls */}
          <div className="mt-6 space-y-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8 rounded border"
              />
            </div>
            
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Width</label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{strokeWidth}px</span>
            </div>
          </div>
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
                  {/* Simple drawing canvas overlay */}
                  <canvas
                    className="absolute inset-0 w-full h-full pointer-events-auto"
                    style={{ zIndex: 10 }}
                    onMouseDown={(e) => {
                      if (selectedTool === 'rectangle') {
                        console.log('Rectangle drawing started at:', e.clientX, e.clientY)
                      }
                    }}
                  />
                  
                  {/* Tool indicator */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                    Active: {selectedTool}
                  </div>
                  
                  {/* Shape count */}
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                    Shapes: {shapes.length}
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
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                >
                  Select PDF File
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div>
            Tool: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTool}</span>
          </div>
          <div>
            Shapes: <span className="font-semibold text-slate-800 dark:text-slate-200">{shapes.length}</span>
          </div>
          {uploadedPdfUrl && (
            <div className="text-green-600 dark:text-green-400">✓ PDF Loaded</div>
          )}
        </div>
      </div>
    </div>
  )
}