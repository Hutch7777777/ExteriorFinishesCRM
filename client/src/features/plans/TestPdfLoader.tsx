import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

// Simple PDF.js test without worker complexity
export function TestPdfLoader() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Ready')
  const [error, setError] = useState<string | null>(null)

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

    setStatus('Creating blob URL...')
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    try {
      // Create blob URL
      const blobUrl = URL.createObjectURL(file)
      setPdfUrl(blobUrl)
      setStatus('Blob URL created: ' + blobUrl)
      console.log('Blob URL created:', blobUrl)

      // Test blob URL accessibility
      setStatus('Testing blob URL accessibility...')
      const testResponse = await fetch(blobUrl, { method: 'HEAD' })
      console.log('Blob URL test:', testResponse.status, testResponse.statusText)
      
      if (testResponse.ok) {
        setStatus('Blob URL accessible, testing PDF.js...')
        
        // Try to load with PDF.js
        try {
          // Import PDF.js dynamically to avoid worker issues
          const pdfjsLib = await import('pdfjs-dist')
          
          // Configure worker inline
          pdfjsLib.GlobalWorkerOptions.workerSrc = `data:application/javascript,
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js');
          `
          
          setStatus('Loading PDF with PDF.js...')
          console.log('Attempting PDF.js load...')
          
          const loadingTask = pdfjsLib.getDocument({ url: blobUrl })
          const pdf = await loadingTask.promise
          
          console.log('PDF loaded successfully:', pdf.numPages, 'pages')
          setStatus(`PDF loaded successfully! ${pdf.numPages} pages`)
          setError(null)
          
        } catch (pdfjsError) {
          console.error('PDF.js error:', pdfjsError)
          setError(`PDF.js error: ${pdfjsError.message}`)
          setStatus('PDF.js failed')
        }
        
      } else {
        setError(`Blob URL not accessible: ${testResponse.status}`)
        setStatus('Failed')
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError(`Upload error: ${err.message}`)
      setStatus('Failed')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">PDF Loading Test</h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button 
            onClick={() => {
              setPdfUrl(null)
              setStatus('Ready')
              setError(null)
            }}
            variant="outline"
          >
            Reset
          </Button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="font-semibold mb-2">Status</h3>
          <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>

        {pdfUrl && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">PDF URL</h3>
            <p className="text-xs font-mono break-all text-slate-600">
              {pdfUrl}
            </p>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Check the browser console (F12) for detailed logs</p>
          <p>• This test bypasses the complex PDF viewer to isolate the loading issue</p>
          <p>• If this works, we know the issue is in the viewer component</p>
        </div>
      </div>
    </div>
  )
}