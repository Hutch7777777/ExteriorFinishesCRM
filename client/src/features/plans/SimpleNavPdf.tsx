import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { PdfUploadButton } from './PdfUploadButton'
import { useToast } from '@/hooks/use-toast'

export default function SimpleNavPdf() {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfUrl || totalPages <= 1) return
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
  }, [pdfUrl, totalPages, currentPage])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold">Simple PDF Navigation</h1>
          <p className="text-blue-200 text-sm">Upload a PDF and navigate with arrow keys or buttons</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          {pdfUrl && (
            <div className="flex items-center gap-2 bg-blue-700 px-3 py-2 rounded">
              <Button
                size="sm"
                variant="ghost"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="text-white hover:bg-blue-600 p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center min-w-[80px]">
                <div className="text-sm font-medium">{currentPage} / {totalPages}</div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="text-white hover:bg-blue-600 p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Upload Button */}
          <PdfUploadButton
            onUploadSuccess={(uploadedPdfUrl, filename) => {
              setPdfUrl(uploadedPdfUrl)
              setTotalPages(10) // Estimate - user can adjust
              setCurrentPage(1)
              toast({
                title: 'PDF Uploaded',
                description: `${filename} loaded successfully`,
              })
            }}
            variant="outline"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </PdfUploadButton>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {pdfUrl ? (
          <div className="w-full h-full relative">
            {/* PDF Iframe with navigation */}
            <iframe
              src={`${pdfUrl}#page=${currentPage}&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Document"
              key={`pdf-${currentPage}`}
            />
            
            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">{currentPage}/{totalPages}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Use arrow keys to navigate
              </div>
            </div>

            {/* Page Input */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Page:</span>
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
                <span className="text-sm">of {totalPages}</span>
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={totalPages}
                  onChange={(e) => setTotalPages(parseInt(e.target.value) || 1)}
                  placeholder="Total pages"
                  className="w-full px-2 py-1 text-xs border rounded"
                />
                <div className="text-xs text-gray-500 mt-1">Set total pages</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload a PDF to start</h2>
              <p className="text-gray-500 mb-4">Use the upload button in the top right to get started</p>
              <PdfUploadButton
                onUploadSuccess={(uploadedPdfUrl, filename) => {
                  setPdfUrl(uploadedPdfUrl)
                  setTotalPages(10)
                  setCurrentPage(1)
                  toast({
                    title: 'PDF Uploaded',
                    description: `${filename} loaded successfully`,
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

      {/* Status Bar */}
      <div className="bg-gray-100 border-t px-4 py-2">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {pdfUrl ? (
              <span>✅ PDF Loaded • Navigate with ← → keys or buttons • Set total pages manually</span>
            ) : (
              <span>Upload a PDF document to enable page navigation</span>
            )}
          </div>
          <div>
            Keyboard: ← → PageUp PageDown Home End
          </div>
        </div>
      </div>
    </div>
  )
}