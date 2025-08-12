import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function RobustPdfLoader() {
  const [status, setStatus] = useState<string>('Ready to test')
  const [error, setError] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const testPdfLoading = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setStatus('No file selected')
      return
    }

    setError('')
    setStatus('Starting comprehensive PDF test...')

    try {
      // Method 1: Direct ArrayBuffer approach (most reliable)
      setStatus('Method 1: Reading file as ArrayBuffer...')
      const arrayBuffer = await file.arrayBuffer()
      setStatus(`File read successfully: ${arrayBuffer.byteLength} bytes`)

      setStatus('Importing PDF.js library...')
      
      // Use dynamic import to ensure clean loading
      const pdfjsLib = await import('pdfjs-dist')
      
      // Completely disable worker - this is key!
      setStatus('Disabling PDF.js worker...')
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      
      setStatus('Creating PDF document from ArrayBuffer...')
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        disableWorker: true,
        verbosity: 0 // Reduce console spam
      })

      // Add detailed progress tracking
      loadingTask.onProgress = function(progress: any) {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          setStatus(`Loading PDF... ${percent}%`)
        }
      }

      setStatus('Waiting for PDF to load...')
      const pdf = await loadingTask.promise
      
      setStatus(`✓ PDF loaded successfully! ${pdf.numPages} pages found`)

      // Try to render the first page
      if (canvasRef.current) {
        setStatus('Rendering first page...')
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1.0 })
        
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')!
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        setStatus(`✓ SUCCESS! PDF rendered on canvas (${viewport.width}x${viewport.height})`)
        
      } else {
        setStatus('✓ PDF loaded but no canvas available for rendering')
      }

    } catch (error: any) {
      console.error('Detailed PDF error:', error)
      setError(`Failed: ${error?.message || 'Unknown error'}`)
      setStatus(`❌ Error: ${error?.message || 'Unknown error'}`)
      
      // Try alternative method
      if (error?.message?.includes('worker') || error?.message?.includes('Worker')) {
        setStatus('Attempting fallback method without any worker references...')
        try {
          await testWithoutWorker(file)
        } catch (fallbackError: any) {
          setError(`All methods failed: ${fallbackError?.message}`)
          setStatus(`❌ All loading methods failed`)
        }
      }
    }
  }

  const testWithoutWorker = async (file: File) => {
    // Ultimate fallback - pure client-side processing
    const pdfjsLib = await import('pdfjs-dist')
    
    // Force disable ALL worker functionality
    delete (pdfjsLib as any).GlobalWorkerOptions
    
    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)
    
    // Most basic PDF.js call possible
    const pdf = await pdfjsLib.getDocument({
      data: typedArray,
      disableAutoFetch: true,
      disableStream: true,
      disableWorker: true
    }).promise
    
    setStatus(`✓ Fallback method succeeded! ${pdf.numPages} pages`)
    return pdf
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Robust PDF Loading Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button onClick={testPdfLoading} className="bg-green-600 hover:bg-green-700">
            🔧 Test PDF Loading
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
            <h3 className="font-semibold mb-2 text-green-600">Status</h3>
            <p className="text-sm font-mono whitespace-pre-wrap">{status}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <h3 className="font-semibold mb-2 text-red-600">Error Details</h3>
              <p className="text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-300 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 rounded">
        <h3 className="font-semibold mb-4">PDF Render Canvas</h3>
        <div className="border border-slate-200 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-96 border"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Why PDF Loading Is Difficult</h3>
        <ul className="text-sm space-y-1 text-blue-600 dark:text-blue-400">
          <li>• Browser security restrictions on file access</li>
          <li>• PDF.js worker version conflicts and configuration issues</li>
          <li>• Different PDF encoding methods (compressed, encrypted, etc.)</li>
          <li>• Memory limitations for large PDF files</li>
          <li>• Development environment constraints (Replit, local, etc.)</li>
        </ul>
      </div>
    </div>
  )
}