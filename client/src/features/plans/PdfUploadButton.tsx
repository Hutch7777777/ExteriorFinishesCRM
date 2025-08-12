import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FileText, Upload } from 'lucide-react'

interface PdfUploadButtonProps {
  onUploadSuccess: (pdfUrl: string, filename: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
}

export function PdfUploadButton({
  onUploadSuccess,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false
}: PdfUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      // For now, use blob URL for immediate native PDF viewing
      const pdfUrl = URL.createObjectURL(file)
      
      toast({
        title: 'PDF loaded successfully',
        description: `${file.name} is ready for annotation using native browser PDF viewer.`,
      })

      // Return the blob URL for immediate use
      onUploadSuccess(pdfUrl, file.name)

      // TODO: In the future, also upload to object storage for persistence
      // This would require proper authentication and job association
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to load PDF',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
        id="pdf-upload-input"
        disabled={isUploading || disabled}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isUploading || disabled}
        asChild
      >
        <label htmlFor="pdf-upload-input" className="cursor-pointer">
          {isUploading ? (
            <>
              <div className="animate-spin w-4 h-4 border border-slate-400 border-t-blue-600 rounded-full mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </>
          )}
        </label>
      </Button>
    </div>
  )
}