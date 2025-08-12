import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useLocation } from 'wouter'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import PdfViewer from './PdfViewer'
import OverlayStage from './OverlayStage'
import ToolPalette, { type SnappingSettings } from './ToolPalette'
import { FileText, ChevronLeft, Upload, File } from 'lucide-react'

interface PageInfo {
  pageNumber: number
  width: number
  height: number
  scale: number
}

interface Thumbnail {
  pageNumber: number
  canvas: HTMLCanvasElement
}

interface ShapeStyle {
  stroke: string
  width: number
  fill?: string
  opacity?: number
  arrowStart?: boolean
  arrowEnd?: boolean
}

interface Shape {
  id: string
  type: 'rect' | 'ellipse' | 'polyline' | 'polygon' | 'arrow' | 'text' | 'highlighter' | 'measure_line' | 'measure_area'
  page: number
  layer: 'Markup' | 'Measurements' | 'Symbols' | 'Text'
  points?: number[]
  x?: number
  y?: number
  w?: number
  h?: number
  style: ShapeStyle
  meta: {
    text?: string
    fontSize?: number
    length?: number
    area?: number
    perimeter?: number
    units?: string
  }
}

interface UndoRedoState {
  shapes: Shape[]
  timestamp: number
}

interface LayerSettings {
  Markup: boolean
  Measurements: boolean
  Symbols: boolean
  Text: boolean
}

interface CalibrationData {
  pixelsPerUnit: number
  units: string
}

// Scale Check Bar component
interface ScaleCheckBarProps {
  calibration: CalibrationData
}

function ScaleCheckBar({ calibration }: ScaleCheckBarProps) {
  const { pixelsPerUnit, units } = calibration;
  const tenFeetInPixels = 10 * pixelsPerUnit; // 10 feet/units in pixels
  const oneFootInPixels = pixelsPerUnit; // 1 foot/unit in pixels

  return (
    <div className="flex flex-col items-start">
      <div 
        className="relative border-b-2 border-slate-800"
        style={{ width: `${tenFeetInPixels}px`, height: '20px' }}
      >
        {/* Major tick marks */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="absolute bottom-0 border-l border-slate-800"
            style={{
              left: `${i * oneFootInPixels}px`,
              height: i % 5 === 0 ? '20px' : i % 1 === 0 ? '12px' : '8px',
              borderWidth: i % 5 === 0 ? '2px' : '1px'
            }}
          />
        ))}
        
        {/* Labels */}
        <div className="absolute -bottom-6 left-0 text-xs text-slate-600">0</div>
        <div className="absolute -bottom-6 text-xs text-slate-600" style={{ left: `${5 * oneFootInPixels - 8}px` }}>
          5{units}
        </div>
        <div className="absolute -bottom-6 text-xs text-slate-600" style={{ left: `${tenFeetInPixels - 16}px` }}>
          10{units}
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-2">
        10 {units} scale bar
      </div>
    </div>
  );
}

export default function PlansPage() {
  const params = useParams()
  const [location, setLocation] = useLocation()
  const jobId = params?.jobId
  const division = params?.division || 'mfnc'

  const [selectedTool, setSelectedTool] = useState('select')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [strokeColor, setStrokeColor] = useState('#ff0000')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [calibrations, setCalibrations] = useState<Record<number, CalibrationData>>({})
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, Shape[]>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedPlanFile, setSelectedPlanFile] = useState<any | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [snappingSettings, setSnappingSettings] = useState<SnappingSettings>({
    enabled: true,
    snapToVertices: true,
    snapToAngles: true,
    snapToGrid: false,
    gridSpacing: 20,
    tolerance: 10
  })
  const [undoStack, setUndoStack] = useState<Record<number, UndoRedoState[]>>({})
  const [redoStack, setRedoStack] = useState<Record<number, UndoRedoState[]>>({})
  const [layerSettings, setLayerSettings] = useState<LayerSettings>({
    Markup: true,
    Measurements: true,
    Symbols: true,
    Text: true
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showScaleCheck, setShowScaleCheck] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Current plan file ID from selection
  const planFileId = selectedPlanFile?.id || '550e8400-e29b-41d4-a716-446655440000'

  // Load plan files for this job
  const { data: planFilesData, isLoading: planFilesLoading } = useQuery({
    queryKey: ['/api/jobs', jobId, 'plan-files'],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/plan-files`);
      if (!response.ok) {
        if (response.status === 404) return { planFiles: [] };
        throw new Error('Failed to load plan files');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Load annotations from API
  const { data: annotationsData, isLoading: annotationsLoading } = useQuery({
    queryKey: ['/api/plans', planFileId, 'annotations'],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planFileId}/annotations`);
      if (!response.ok) {
        if (response.status === 404) return { annotations: [] };
        throw new Error('Failed to load annotations');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0, // Always refetch for latest data
  });

  // Load scales from API  
  const { data: scalesData, isLoading: scalesLoading } = useQuery({
    queryKey: ['/api/plans', planFileId, 'scales'],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planFileId}/scales`);
      if (!response.ok) {
        if (response.status === 404) return { scales: [] };
        throw new Error('Failed to load scales');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0, // Always refetch for latest data
  });

  // Save annotations mutation
  const saveAnnotationsMutation = useMutation({
    mutationFn: async ({ page, annotations }: { page: number, annotations: Shape[] }) => {
      const response = await fetch(`/api/plans/${planFileId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotations: annotations.map(shape => ({
            id: shape.id,
            page: shape.page,
            dataJson: shape
          }))
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save annotations: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setSaveError(null);
      toast({
        title: "Saved",
        description: "Annotations saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plans', planFileId, 'annotations'] });
    },
    onError: (error: Error) => {
      setSaveError(error.message);
      toast({
        title: "Save Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save scale mutation
  const saveScaleMutation = useMutation({
    mutationFn: async ({ page, pixelPerUnit, unit }: { page: number, pixelPerUnit: number, unit: string }) => {
      const response = await fetch(`/api/plans/${planFileId}/scales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, pixelPerUnit, unit })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save scale: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scale Saved",
        description: "Calibration scale saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plans', planFileId, 'scales'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Error", 
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Upload PDF mutations
  const getUploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/plans/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to get upload URL');
      return response.json();
    }
  });

  const createPlanFileMutation = useMutation({
    mutationFn: async ({ jobId, url, filename, pages }: { 
      jobId: string; 
      url: string; 
      filename: string; 
      pages: number; 
    }) => {
      const response = await fetch('/api/plans/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, url, filename, pages })
      });
      if (!response.ok) throw new Error('Failed to create plan file record');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId, 'plan-files'] });
      toast({
        title: "Upload Complete",
        description: "Redirecting to plan editor...",
      });
      setShowUploadDialog(false);
      
      // Set the uploaded plan as selected and navigate to editor view
      const planFile = data.planFile;
      setSelectedPlanFile(planFile);
      
      // Small delay to ensure state is set before showing editor
      setTimeout(() => {
        setSelectedPlan('editor'); // This will show the BlueBeam-style editor interface
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Export PDF mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanFile) {
        throw new Error('No plan file selected');
      }
      
      const response = await fetch(`/api/plans/${selectedPlanFile.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export PDF');
      }
      
      return response;
    },
    onSuccess: async (response) => {
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Get filename from response headers or create one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'annotated_plan.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "PDF with flattened annotations has been downloaded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle export PDF
  const handleExportPDF = useCallback(() => {
    if (selectedPlanFile) {
      exportMutation.mutate();
    }
  }, [selectedPlanFile, exportMutation]);

  // Undo/Redo functionality
  const saveToUndoStack = useCallback((pageNum: number, currentShapes: Shape[]) => {
    const MAX_UNDO_STATES = 50;
    setUndoStack(prev => {
      const pageStack = prev[pageNum] || [];
      const newState: UndoRedoState = {
        shapes: [...currentShapes],
        timestamp: Date.now()
      };
      
      // Add to stack and limit to MAX_UNDO_STATES
      const updatedStack = [...pageStack, newState].slice(-MAX_UNDO_STATES);
      
      return {
        ...prev,
        [pageNum]: updatedStack
      };
    });
    
    // Clear redo stack when new action is performed
    setRedoStack(prev => ({
      ...prev,
      [pageNum]: []
    }));
  }, []);

  const handleUndo = useCallback(() => {
    const pageStack = undoStack[currentPage] || [];
    if (pageStack.length > 0) {
      // Move current state to redo stack
      const currentPageShapes = shapes.filter(shape => shape.page === currentPage);
      setRedoStack(prev => ({
        ...prev,
        [currentPage]: [
          ...(prev[currentPage] || []),
          { shapes: [...currentPageShapes], timestamp: Date.now() }
        ]
      }));
      
      // Restore previous state
      const previousState = pageStack[pageStack.length - 1];
      const otherPageShapes = shapes.filter(shape => shape.page !== currentPage);
      setShapes([...otherPageShapes, ...previousState.shapes]);
      
      // Remove from undo stack
      setUndoStack(prev => ({
        ...prev,
        [currentPage]: pageStack.slice(0, -1)
      }));
      
      setHasUnsavedChanges(true);
    }
  }, [undoStack, currentPage, shapes]);

  const handleRedo = useCallback(() => {
    const pageStack = redoStack[currentPage] || [];
    if (pageStack.length > 0) {
      // Move current state to undo stack
      const currentPageShapes = shapes.filter(shape => shape.page === currentPage);
      saveToUndoStack(currentPage, currentPageShapes);
      
      // Restore next state
      const nextState = pageStack[pageStack.length - 1];
      const otherPageShapes = shapes.filter(shape => shape.page !== currentPage);
      setShapes([...otherPageShapes, ...nextState.shapes]);
      
      // Remove from redo stack
      setRedoStack(prev => ({
        ...prev,
        [currentPage]: pageStack.slice(0, -1)
      }));
      
      setHasUnsavedChanges(true);
    }
  }, [redoStack, currentPage, shapes, saveToUndoStack]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      const currentPageShapes = shapes.filter(shape => shape.page === currentPage);
      saveToUndoStack(currentPage, currentPageShapes);
      
      setShapes(prev => prev.filter(shape => shape.id !== selectedId));
      setSelectedId(null);
      setHasUnsavedChanges(true);
    }
  }, [selectedId, shapes, currentPage, saveToUndoStack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrlCmd = event.ctrlKey || event.metaKey;
      
      // Undo/Redo
      if (isCtrlCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      
      if (isCtrlCmd && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
        return;
      }
      
      // Delete
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDeleteSelected();
        return;
      }
      
      // Tool shortcuts
      switch (event.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'r':
          setSelectedTool('rect');
          break;
        case 'o':
          setSelectedTool('ellipse');
          break;
        case 'p':
          setSelectedTool('polygon');
          break;
        case 'l':
          setSelectedTool('polyline');
          break;
        case 'a':
          setSelectedTool('arrow');
          break;
        case 't':
          setSelectedTool('text');
          break;
        case 'h':
          setSelectedTool('highlighter');
          break;
        case 'c':
          setSelectedTool('calibrate');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSelected]);

  // Layer management
  const getShapeLayer = (shapeType: Shape['type']): Shape['layer'] => {
    switch (shapeType) {
      case 'measure_line':
      case 'measure_area':
        return 'Measurements';
      case 'text':
        return 'Text';
      case 'arrow':
        return 'Symbols';
      default:
        return 'Markup';
    }
  };

  const toggleLayer = useCallback((layer: keyof LayerSettings) => {
    setLayerSettings(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  // Filter shapes by visible layers
  const visibleShapes = useMemo(() => {
    return shapes.filter(shape => {
      const layer = shape.layer || getShapeLayer(shape.type);
      return layerSettings[layer];
    });
  }, [shapes, layerSettings, getShapeLayer]);

  // Load and merge server data into local state keyed by page
  useEffect(() => {
    if (annotationsData?.annotations && !annotationsLoading) {
      const pageGroupedAnnotations: Record<number, Shape[]> = {};
      const allShapes: Shape[] = [];
      
      annotationsData.annotations.forEach((annotation: any) => {
        const shape = annotation.dataJson;
        allShapes.push(shape);
        
        if (!pageGroupedAnnotations[shape.page]) {
          pageGroupedAnnotations[shape.page] = [];
        }
        pageGroupedAnnotations[shape.page].push(shape);
      });
      
      setPageAnnotations(pageGroupedAnnotations);
      setShapes(allShapes);
    }
  }, [annotationsData, annotationsLoading]);

  useEffect(() => {
    if (scalesData?.scales && !scalesLoading) {
      const loadedCalibrations: Record<number, CalibrationData> = {};
      scalesData.scales.forEach((scale: any) => {
        loadedCalibrations[scale.page] = {
          pixelsPerUnit: parseFloat(scale.pixelPerUnit),
          units: scale.unit
        };
      });
      setCalibrations(loadedCalibrations);
    }
  }, [scalesData, scalesLoading]);

  // Debounced autosave function
  const debouncedSave = useCallback((page: number, annotations: Shape[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveAnnotationsMutation.mutate({ page, annotations });
    }, 2500); // 2.5 second debounce
  }, [saveAnnotationsMutation]);

  // Auto-save when shapes change 
  useEffect(() => {
    if (shapes.length > 0 && !annotationsLoading && annotationsData) {
      // Group shapes by page and save current page
      const currentPageShapes = shapes.filter(shape => shape.page === currentPage);
      debouncedSave(currentPage, currentPageShapes);
      
      // Update page annotations state
      setPageAnnotations(prev => ({
        ...prev,
        [currentPage]: currentPageShapes
      }));
      
      // Track unsaved changes during autosave delay
      setHasUnsavedChanges(true);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [shapes, currentPage, debouncedSave, annotationsLoading, annotationsData]);

  // Clear unsaved changes flag when autosave completes
  useEffect(() => {
    if (!saveAnnotationsMutation.isPending && !saveError) {
      setHasUnsavedChanges(false);
    }
  }, [saveAnnotationsMutation.isPending, saveError]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || saveAnnotationsMutation.isPending) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveAnnotationsMutation.isPending]);

  // Set default plan file when plan files load
  useEffect(() => {
    if (planFilesData?.planFiles?.length > 0 && !selectedPlanFile) {
      setSelectedPlanFile(planFilesData.planFiles[0]);
    }
  }, [planFilesData, selectedPlanFile]);

  // Handle plan file selection change
  const handlePlanFileSelect = useCallback((planFile: any) => {
    if (planFile.id !== selectedPlanFile?.id) {
      setSelectedPlanFile(planFile);
      setCurrentPage(1);
      setShapes([]);
      setThumbnails([]);
      setPageInfo(null);
      
      // Invalidate queries for new plan
      queryClient.invalidateQueries({ queryKey: ['/api/plans', planFile.id, 'annotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plans', planFile.id, 'scales'] });
    }
  }, [selectedPlanFile, queryClient]);

  // Handle PDF upload
  const handleUploadPDF = useCallback(async (file: File) => {
    try {
      // Get upload URL
      const { uploadUrl } = await getUploadUrlMutation.mutateAsync();
      
      // Upload file to R2/S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      // Extract file URL from upload response
      const fileUrl = uploadUrl.split('?')[0]; // Remove query params to get clean URL
      
      // Create plan file record
      await createPlanFileMutation.mutateAsync({
        jobId: jobId!,
        url: fileUrl,
        filename: file.name,
        pages: 1, // Will be updated by backend after PDF processing
      });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  }, [getUploadUrlMutation, createPlanFileMutation, jobId, toast]);

  // Sample PDF URLs for different plans
  const planUrls: Record<string, string> = {
    'plan-1': 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    'plan-2': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'plan-3': 'https://www.africau.edu/images/default/sample.pdf'
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setCurrentPage(1)
    setZoom(1)
  }

  const handlePageReady = (info: PageInfo) => {
    setPageInfo(info)
  }

  const handleThumbsReady = (thumbs: Thumbnail[]) => {
    setThumbnails(thumbs)
  }

  const handleThumbnailClick = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }
  
  const handleCalibration = (page: number, pixelsPerUnit: number, units: string) => {
    setCalibrations(prev => ({
      ...prev,
      [page]: { pixelsPerUnit, units }
    }))
    
    // Save to backend
    saveScaleMutation.mutate({
      page,
      pixelPerUnit: pixelsPerUnit,
      unit: units
    })
  }

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
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                {saveError}
              </div>
            )}
            {saveAnnotationsMutation.isPending && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                Saving...
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log("Upload button clicked");
                setShowUploadDialog(true);
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Plans
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              disabled={!selectedPlanFile || exportMutation.isPending}
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export Flattened PDF'}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Plans</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Small upload button clicked");
                  setShowUploadDialog(true);
                }}
                className="text-xs px-2 py-1"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
            </div>
            
            <div className="space-y-2">
              {planFilesLoading ? (
                <div className="text-sm text-slate-500 text-center py-4">Loading plans...</div>
              ) : planFilesData?.planFiles?.length > 0 ? (
                planFilesData.planFiles.map((planFile: any) => (
                  <div
                    key={planFile.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlanFile?.id === planFile.id 
                        ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => handlePlanFileSelect(planFile)}
                  >
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {planFile.filename.replace('.pdf', '')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {planFile.pages} pages • {planFile.filename}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 text-center py-8">
                  No plans uploaded yet
                  <br />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                    className="text-xs mt-2"
                  >
                    Upload your first plan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Page Thumbnails */}
          <div className="flex-1 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Pages</h3>
            {selectedPlanFile && thumbnails.length > 0 ? (
              <div className="space-y-2">
                {thumbnails.map((thumbnail) => (
                  <div 
                    key={thumbnail.pageNumber}
                    className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                      currentPage === thumbnail.pageNumber
                        ? 'border-[#4A6FA5] bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => handleThumbnailClick(thumbnail.pageNumber)}
                  >
                    <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                      <canvas
                        ref={(canvas) => {
                          if (canvas && thumbnail.canvas) {
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              canvas.width = thumbnail.canvas.width
                              canvas.height = thumbnail.canvas.height
                              ctx.drawImage(thumbnail.canvas, 0, 0)
                            }
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-slate-600 dark:text-slate-400">
                      Page {thumbnail.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedPlanFile ? (
              <div className="text-center text-slate-500 text-sm">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                Loading pages...
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                Upload a plan to view pages
              </div>
            )}
          </div>
        </div>

        {/* Center - PDF Viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative">
          {selectedPlanFile ? (
            <div className="absolute inset-0">
              <PdfViewer 
                pdfUrl={selectedPlanFile.url}
                onPageReady={handlePageReady}
                onThumbsReady={handleThumbsReady}
                zoom={zoom}
                setZoom={setZoom}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
              <OverlayStage 
                pageWidth={pageInfo?.width || 0}
                pageHeight={pageInfo?.height || 0}
                zoom={pageInfo?.scale || 1}
                currentPage={currentPage}
                activeTool={selectedTool}
                shapes={visibleShapes}
                setShapes={(newShapes) => {
                  // Save to undo stack before making changes
                  const currentPageShapes = shapes.filter(shape => shape.page === currentPage);
                  saveToUndoStack(currentPage, currentPageShapes);
                  
                  // Ensure shapes have proper layer assignment
                  const shapesWithLayers = newShapes.map(shape => ({
                    ...shape,
                    layer: shape.layer || getShapeLayer(shape.type)
                  }));
                  
                  setShapes(shapesWithLayers);
                  setHasUnsavedChanges(true);
                }}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
                calibrations={calibrations}
                onCalibration={handleCalibration}
                snappingSettings={snappingSettings}
              />

              {/* Scale Check Overlay */}
              {showScaleCheck && calibrations[currentPage] && (
                <div className="absolute top-4 left-4 bg-white/90 border border-slate-300 rounded-lg p-3 shadow-lg">
                  <div className="text-xs font-medium text-slate-700 mb-2">Scale Check</div>
                  <ScaleCheckBar calibration={calibrations[currentPage]} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Plan Selected
                </h3>
                <p className="text-slate-500 mb-4">
                  Upload a PDF plan to get started with markups and measurements
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF Plan
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail - Tool Palette and Measurements */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
          <ToolPalette 
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            snappingSettings={snappingSettings}
            onSnappingSettingsChange={setSnappingSettings}
            layerSettings={layerSettings}
            onLayerToggle={toggleLayer}
            hasUnsavedChanges={hasUnsavedChanges}
            canUndo={(undoStack[currentPage] || []).length > 0}
            canRedo={(redoStack[currentPage] || []).length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            showScaleCheck={showScaleCheck}
            onToggleScaleCheck={() => setShowScaleCheck(!showScaleCheck)}
          />
          
          {/* Measurement Summary */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Measurements</h3>
            
            {/* Calibration Status */}
            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Scale:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {calibrations[currentPage] ? (
                      `1 px = ${(1 / calibrations[currentPage].pixelsPerUnit).toFixed(3)} ${calibrations[currentPage].units}`
                    ) : (
                      'Not calibrated'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Measurements */}
            <div className="space-y-2">
              {shapes
                .filter(shape => shape.page === currentPage && (shape.type === 'measure_line' || shape.type === 'measure_area'))
                .map(shape => (
                  <div 
                    key={shape.id}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      selectedId === shape.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedId(shape.id)}
                  >
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      {shape.type === 'measure_line' ? 'Length' : 'Area'}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {shape.type === 'measure_line' && shape.meta.length && (
                        `${shape.meta.length.toFixed(2)} ${shape.meta.units}`
                      )}
                      {shape.type === 'measure_area' && shape.meta.area && (
                        <>
                          <div>{shape.meta.area.toFixed(2)} {shape.meta.units}</div>
                          {shape.meta.perimeter && (
                            <div className="text-xs text-slate-500">
                              Perimeter: {shape.meta.perimeter.toFixed(2)} {shape.meta.units?.replace('²', '')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              }
              {shapes.filter(shape => shape.page === currentPage && (shape.type === 'measure_line' || shape.type === 'measure_area')).length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">
                  No measurements on this page
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload PDF Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">Select PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && file.type === 'application/pdf') {
                    await handleUploadPDF(file);
                  } else {
                    toast({
                      title: "Invalid File",
                      description: "Please select a PDF file",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={getUploadUrlMutation.isPending || createPlanFileMutation.isPending}
              />
            </div>
            {(getUploadUrlMutation.isPending || createPlanFileMutation.isPending) && (
              <div className="text-sm text-blue-600 text-center">
                Uploading PDF...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}