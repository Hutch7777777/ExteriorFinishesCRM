import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function NativePdfViewer() {
  const [status, setStatus] = useState<string>('Ready')
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const embedRef = useRef<HTMLEmbedElement>(null)
  const objectRef = useRef<HTMLObjectElement>(null)

  const testPdfLoading = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setStatus('No file selected')
      return
    }

    setError('')
    setStatus('Testing native browser PDF support...')

    try {
      // Create blob URL
      const blobUrl = URL.createObjectURL(file)
      setPdfUrl(blobUrl)
      setStatus(`Blob URL created: ${blobUrl.substring(0, 50)}...`)

      // Test multiple native rendering methods
      setStatus('✓ Native PDF rendering ready - check viewers below')

    } catch (error: any) {
      console.error('Native PDF error:', error)
      setError(`Error: ${error?.message || 'Unknown error'}`)
      setStatus('❌ Native PDF loading failed')
    }
  }

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const downloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = fileInputRef.current?.files?.[0]?.name || 'document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Native PDF Viewer Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button onClick={testPdfLoading} className="bg-purple-600 hover:bg-purple-700">
            Test Native PDF
          </Button>
        </div>

        {pdfUrl && (
          <div className="flex gap-4">
            <Button onClick={openInNewTab} variant="outline">
              Open in New Tab
            </Button>
            <Button onClick={downloadPdf} variant="outline">
              Download PDF
            </Button>
          </div>
        )}

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
          <h3 className="font-semibold mb-2">Status</h3>
          <p className="text-sm font-mono">{status}</p>
          {error && (
            <p className="text-sm font-mono text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>

      {pdfUrl && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Method 1: HTML5 Embed */}
            <div className="border border-slate-300 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Method 1: HTML5 Embed</h3>
              <embed
                ref={embedRef}
                src={pdfUrl}
                type="application/pdf"
                className="w-full h-96 border"
              />
            </div>

            {/* Method 2: HTML5 Object */}
            <div className="border border-slate-300 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Method 2: HTML5 Object</h3>
              <object
                ref={objectRef}
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-96 border"
              >
                <p className="p-4 text-center text-slate-600">
                  Your browser doesn't support PDF viewing. 
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    Download the PDF
                  </a>
                </p>
              </object>
            </div>
          </div>

          {/* Method 3: IFrame (full width) */}
          <div className="border border-slate-300 dark:border-slate-700 rounded p-4">
            <h3 className="font-semibold mb-4">Method 3: IFrame (Full Width)</h3>
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
        <h3 className="font-semibold mb-2 text-green-700 dark:text-green-300">Native PDF Advantages</h3>
        <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
          <li>• No JavaScript library dependencies</li>
          <li>• Uses browser's built-in PDF engine</li>
          <li>• Better performance and memory usage</li>
          <li>• Native browser zoom and navigation controls</li>
          <li>• No worker configuration issues</li>
        </ul>
      </div>
    </div>
  )
}