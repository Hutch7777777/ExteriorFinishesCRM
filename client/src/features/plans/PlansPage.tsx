import { useState } from 'react'
import { useParams } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PdfViewer from './PdfViewer'
import OverlayStage from './OverlayStage'
import ToolPalette from './ToolPalette'
import { FileText, ChevronLeft } from 'lucide-react'

export default function PlansPage() {
  const params = useParams()
  const jobId = params?.jobId
  const division = params?.division || 'mfnc'

  const [selectedTool, setSelectedTool] = useState('select')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [strokeColor, setStrokeColor] = useState('#ff0000')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

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
                onClick={() => setSelectedPlan('plan-1')}
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
                onClick={() => setSelectedPlan('plan-2')}
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
                onClick={() => setSelectedPlan('plan-3')}
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
            {selectedPlan ? (
              <div className="space-y-2">
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500">
                  <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-500">
                    Page 1
                  </div>
                  <div className="text-xs text-center mt-1 text-slate-600 dark:text-slate-400">
                    Page 1
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500">
                  <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-500">
                    Page 2
                  </div>
                  <div className="text-xs text-center mt-1 text-slate-600 dark:text-slate-400">
                    Page 2
                  </div>
                </div>
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
              selectedPlan={selectedPlan}
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