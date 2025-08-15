import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnhancedObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: {
    filename: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    objectPath: string;
  }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Enhanced file upload component with document naming functionality.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Allows users to provide custom names for their documents
 * - Provides preview of selected files before upload
 * - Shows upload progress and status
 */
export function EnhancedObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: EnhancedObjectUploaderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [customName, setCustomName] = useState("");
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        if (result.successful && result.successful.length > 0) {
          const file = result.successful[0];
          setPendingFile(file);
          setCustomName(file.name || ""); // Pre-fill with original filename
          setShowUploadModal(false);
          setShowNamingModal(true);
        }
      })
  );

  const handleNameSubmit = () => {
    if (pendingFile && onComplete) {
      const finalName = customName.trim() || pendingFile.name;
      
      // Extract filename from the upload URL or use the original name
      const urlPath = pendingFile.uploadURL || '';
      const urlParts = urlPath.split('/');
      const uploadedFilename = urlParts[urlParts.length - 1] || pendingFile.name;
      
      onComplete({
        filename: uploadedFilename,
        originalFilename: finalName, // Use custom name as the display name
        mimeType: pendingFile.type || 'application/octet-stream',
        fileSize: pendingFile.size || 0,
        objectPath: urlPath
      });
    }
    
    setShowNamingModal(false);
    setPendingFile(null);
    setCustomName("");
  };

  const handleCancel = () => {
    setShowNamingModal(false);
    setPendingFile(null);
    setCustomName("");
  };

  return (
    <>
      <Button 
        onClick={() => setShowUploadModal(true)} 
        className={buttonClassName}
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showUploadModal}
        onRequestClose={() => setShowUploadModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />

      <Dialog open={showNamingModal} onOpenChange={setShowNamingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name Your Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">Document Name</Label>
              <Input
                id="document-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter a name for this document"
                className="w-full"
              />
            </div>
            {pendingFile && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-sm font-medium">File Details:</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Original: {pendingFile.name} ({pendingFile.type}) • {Math.round((pendingFile.size || 0) / 1024)}KB
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleNameSubmit}>
                Save Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}