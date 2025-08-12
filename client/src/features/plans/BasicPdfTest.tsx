import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function BasicPdfTest() {
  const [status, setStatus] = useState<string>('Ready')
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const testPdfLoading = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setStatus('No file selected')
      return
    }

    setStatus('Creating blob URL...')
    const blobUrl = URL.createObjectURL(file)
    setPdfUrl(blobUrl)
    setStatus(`Blob created: ${blobUrl}`)

    try {
      setStatus('Testing blob accessibility...')
      const response = await fetch(blobUrl, { method: 'HEAD' })
      setStatus(`Blob test: ${response.status} ${response.statusText}`)

      if (response.ok) {
        setStatus('Importing PDF.js...')
        const pdfjsLib = await import('pdfjs-dist')
        
        // Try different worker configurations
        setStatus('Configuring worker...')
        
        // Try without worker first (fallback mode)
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''
        
        setStatus('Loading PDF document (no worker)...')
        let loadingTask
        
        try {
          // First try without worker
          loadingTask = pdfjsLib.getDocument({
            url: blobUrl,
            disableWorker: true
          })
        } catch (noWorkerError) {
          setStatus('No-worker failed, trying with worker...')
          // If that fails, try with worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          loadingTask = pdfjsLib.getDocument(blobUrl)
        }
        
        loadingTask.onProgress = (progress: any) => {
          setStatus(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
        }

        const pdf = await loadingTask.promise
        setStatus(`Success! PDF has ${pdf.numPages} pages`)

        // Try to render first page
        if (canvasRef.current) {
          setStatus('Rendering first page...')
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale: 1 })
          
          const canvas = canvasRef.current
          const context = canvas.getContext('2d')!
          
          canvas.width = viewport.width
          canvas.height = viewport.height
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise

          setStatus('Page rendered successfully!')
        }

      } else {
        setStatus(`Blob not accessible: ${response.status}`)
      }

    } catch (error: any) {
      console.error('PDF loading error:', error)
      setStatus(`Error: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Basic PDF Loading Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button onClick={testPdfLoading}>
            Test PDF Loading
          </Button>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
          <h3 className="font-semibold mb-2">Status</h3>
          <p className="text-sm font-mono">{status}</p>
        </div>

        {pdfUrl && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
            <h3 className="font-semibold mb-2">Blob URL</h3>
            <p className="text-xs font-mono break-all">{pdfUrl}</p>
          </div>
        )}
      </div>

      <div className="border border-slate-300 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 rounded">
        <h3 className="font-semibold mb-4">PDF Canvas</h3>
        <canvas 
          ref={canvasRef} 
          className="border border-slate-200 dark:border-slate-600 max-w-full"
          style={{ maxHeight: '500px' }}
        />
      </div>
    </div>
  )
}