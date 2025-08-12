import { useState } from 'react'
import { useParams } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PdfViewer from './PdfViewer'
import OverlayStage from './OverlayStage'
import ToolPalette from './ToolPalette'
import { FileText, ChevronLeft } from 'lucide-react'

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

export default function PlansPage() {
  const params = useParams()
  const jobId = params?.jobId
  const division = params?.division || 'mfnc'

  const [selectedTool, setSelectedTool] = useState('select')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [strokeColor, setStrokeColor] = useState('#ff0000')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)

  // Sample PDF URLs for different plans
  const planUrls: Record<string, string> = {
    'plan-1': 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    'plan-2': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'plan-3': 'https://www.africau.edu/images/default/sample.pdf'
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setCurrentPage(1)
    setZoom(1)
  }

  const handlePageReady = (info: PageInfo) => {
    setPageInfo(info)
  }

  const handleThumbsReady = (thumbs: Thumbnail[]) => {
    setThumbnails(thumbs)
  }

  const handleThumbnailClick = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plans</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Job {jobId} - {division.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Upload Plans
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail - Plans List & Thumbnails */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Plans List */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Plans</h3>
            <div className="space-y-2">
              {/* Placeholder plan files */}
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlan === 'plan-1' 
                    ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
                onClick={() => handlePlanSelect('plan-1')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Floor Plan - First Floor
                    </div>
                    <div className="text-xs text-slate-500">
                      floor-plan-1.pdf
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlan === 'plan-2' 
                    ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
                onClick={() => handlePlanSelect('plan-2')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Elevation - Front
                    </div>
                    <div className="text-xs text-slate-500">
                      elevation-front.pdf
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlan === 'plan-3' 
                    ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
                onClick={() => handlePlanSelect('plan-3')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Site Plan
                    </div>
                    <div className="text-xs text-slate-500">
                      site-plan.pdf
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Thumbnails */}
          <div className="flex-1 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Pages</h3>
            {selectedPlan && thumbnails.length > 0 ? (
              <div className="space-y-2">
                {thumbnails.map((thumbnail) => (
                  <div 
                    key={thumbnail.pageNumber}
                    className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                      currentPage === thumbnail.pageNumber
                        ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => handleThumbnailClick(thumbnail.pageNumber)}
                  >
                    <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                      <canvas
                        ref={(canvas) => {
                          if (canvas && thumbnail.canvas) {
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              canvas.width = thumbnail.canvas.width
                              canvas.height = thumbnail.canvas.height
                              ctx.drawImage(thumbnail.canvas, 0, 0)
                            }
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-slate-600 dark:text-slate-400">
                      Page {thumbnail.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedPlan ? (
              <div className="text-center text-slate-500 text-sm">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                Loading pages...
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                Select a plan to view pages
              </div>
            )}
          </div>
        </div>

        {/* Center - PDF Viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative">
          <div className="absolute inset-0">
            <PdfViewer 
              pdfUrl={selectedPlan ? planUrls[selectedPlan] : ''}
              onPageReady={handlePageReady}
              onThumbsReady={handleThumbsReady}
              zoom={zoom}
              setZoom={setZoom}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
            <OverlayStage 
              selectedTool={selectedTool}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
            />
          </div>
        </div>

        {/* Right Rail - Tool Palette */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
          <ToolPalette 
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
          />
        </div>
      </div>
    </div>
  )
}