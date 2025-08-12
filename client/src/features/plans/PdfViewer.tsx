import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'

interface PdfViewerProps {
  selectedPlan: string | null
}

export default function PdfViewer({ selectedPlan }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // PDF.js integration will be implemented here
    // For now, just show a placeholder
    if (canvasRef.current && selectedPlan) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        // Clear canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        
        // Draw placeholder content
        ctx.fillStyle = '#94a3b8'
        ctx.font = '24px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(
          `PDF Viewer - ${selectedPlan}`,
          canvasRef.current.width / 2,
          canvasRef.current.height / 2 - 20
        )
        
        ctx.font = '16px system-ui'
        ctx.fillText(
          'PDF.js integration coming next',
          canvasRef.current.width / 2,
          canvasRef.current.height / 2 + 20
        )
      }
    }
  }, [selectedPlan])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleFitToScreen = () => setZoom(1)

  return (
    <div className="relative w-full h-full">
      {/* PDF Canvas */}
      <div className="absolute inset-0 overflow-auto">
        <div 
          className="min-w-full min-h-full flex items-center justify-center"
          style={{ 
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center'
          }}
        >
          <canvas 
            ref={canvasRef}
            width={800}
            height={1000}
            className="shadow-lg border border-slate-300 dark:border-slate-600 bg-white"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2">
        <div className="flex items-center gap-1">
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
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="w-4 h-4" />
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
          {selectedPlan ? `Viewing: ${selectedPlan}` : 'No plan selected'}
        </div>
      </div>

      {/* Empty state */}
      {!selectedPlan && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              📄
            </div>
            <h3 className="text-lg font-medium mb-2">No Plan Selected</h3>
            <p className="text-sm">Select a plan from the left panel to start viewing</p>
          </div>
        </div>
      )}
    </div>
  )
}