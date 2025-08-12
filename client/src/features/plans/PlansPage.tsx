import { useState } from 'react'
import { useParams } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { FileText, ChevronLeft } from 'lucide-react'

export default function PlansPage() {
  const { division = 'mfnc', jobId = '1' } = useParams()
  const { toast } = useToast()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleTestBlueBeam = () => {
    setIsRedirecting(true)
    toast({
      title: "Launching BlueBeam Editor",
      description: "Redirecting to the test editor with full functionality",
    })
    
    // Redirect to the test page
    setTimeout(() => {
      window.location.href = '/test-bluebeam'
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plans & Documents</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Job {jobId} - {division.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="p-12 max-w-2xl w-full text-center">
          <CardContent>
            <FileText className="w-24 h-24 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Professional PDF Editor
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
              Access the complete BlueBeam-style PDF editor with professional annotation tools, 
              precision measurement capabilities, and advanced markup features.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="text-left">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Annotation Tools</h4>
                  <ul className="space-y-1">
                    <li>• Text & Callout Tools</li>
                    <li>• Shape & Arrow Drawing</li>
                    <li>• Highlighting & Markup</li>
                    <li>• Multi-layer Organization</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Measurement Tools</h4>
                  <ul className="space-y-1">
                    <li>• Precision Length Measurement</li>
                    <li>• Area & Perimeter Calculation</li>
                    <li>• Scale Calibration System</li>
                    <li>• Real-time Calculations</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleTestBlueBeam}
              disabled={isRedirecting}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-medium"
            >
              {isRedirecting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Launching...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Launch BlueBeam Editor
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 mt-4">
              This will open the full-featured PDF editor with a sample document for testing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}