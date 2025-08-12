import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function TestNavigation() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  const totalPages = 5 // Test with a known multi-page document

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

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header with navigation */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">PDF Navigation Test</h1>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="text-white hover:bg-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm mx-2">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="text-white hover:bg-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        <iframe
          src={`${pdfUrl}#page=${currentPage}`}
          className="w-full h-full border-0"
          title="Test PDF"
          key={`test-pdf-${currentPage}`}
        />
        
        {/* Page indicator overlay */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
          Current page: {currentPage}
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-gray-200 p-2 text-sm">
        <strong>Debug:</strong> Current page = {currentPage}, Total = {totalPages}
        <br />
        <strong>PDF URL:</strong> {pdfUrl}#page={currentPage}
      </div>
    </div>
  )
}