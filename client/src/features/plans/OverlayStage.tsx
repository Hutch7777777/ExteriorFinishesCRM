import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Ellipse, Line, Text, Arrow, Group, Transformer } from 'react-konva'
import Konva from 'konva'

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
  points?: number[] // for polyline, polygon, arrow (normalized 0-1)
  x?: number // for rect, ellipse, text (normalized 0-1)
  y?: number // for rect, ellipse, text (normalized 0-1)
  w?: number // for rect, ellipse (normalized 0-1)
  h?: number // for rect, ellipse (normalized 0-1)
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

interface CalibrationData {
  pixelsPerUnit: number
  units: string
}

interface OverlayStageProps {
  pageWidth: number
  pageHeight: number
  zoom: number
  currentPage: number
  activeTool: string
  shapes: Shape[]
  setShapes: (shapes: Shape[]) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  strokeWidth: number
  strokeColor: string
  calibrations: Record<number, CalibrationData>
  setCalibrations: (calibrations: Record<number, CalibrationData>) => void
}

export default function OverlayStage({
  pageWidth,
  pageHeight,
  zoom,
  currentPage,
  activeTool,
  shapes,
  setShapes,
  selectedId,
  setSelectedId,
  strokeWidth,
  strokeColor,
  calibrations,
  setCalibrations
}: OverlayStageProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [tempShape, setTempShape] = useState<Shape | null>(null)
  const [calibrationPoints, setCalibrationPoints] = useState<number[]>([])
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const stageWidth = pageWidth * zoom
  const stageHeight = pageHeight * zoom
  
  // Get calibration for current page
  const currentCalibration = calibrations?.[currentPage]

  // Convert normalized coordinates to pixel coordinates
  const normalizedToPixel = useCallback((normalizedCoord: number, dimension: 'width' | 'height') => {
    const baseSize = dimension === 'width' ? pageWidth : pageHeight
    return normalizedCoord * baseSize * zoom
  }, [pageWidth, pageHeight, zoom])

  // Convert pixel coordinates to normalized coordinates
  const pixelToNormalized = useCallback((pixelCoord: number, dimension: 'width' | 'height') => {
    const baseSize = dimension === 'width' ? pageWidth : pageHeight
    return pixelCoord / (baseSize * zoom)
  }, [pageWidth, pageHeight, zoom])

  // Filter shapes for current page
  const currentPageShapes = (shapes || []).filter(shape => shape.page === currentPage)

  // Set cursor based on active tool
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current
      const container = stage.container()
      
      switch (activeTool) {
        case 'select':
          container.style.cursor = 'default'
          break
        case 'text':
          container.style.cursor = 'text'
          break
        case 'arrow':
        case 'rect':
        case 'ellipse':
        case 'polyline':
        case 'polygon':
        case 'measure_line':
        case 'measure_area':
        case 'calibrate':
          container.style.cursor = 'crosshair'
          break
        case 'highlighter':
          container.style.cursor = 'copy'
          break
        default:
          container.style.cursor = 'default'
      }
    }
  }, [activeTool])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        setShapes((shapes || []).filter(shape => shape.id !== selectedId))
        setSelectedId(null)
      } else if (e.key === 'Escape') {
        setIsDrawing(false)
        setCurrentPoints([])
        setTempShape(null)
        setSelectedId(null)
        setCalibrationPoints([])
        setShowCalibrationDialog(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedId, shapes, setShapes, setSelectedId])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const stage = stageRef.current
      if (stage) {
        const selectedNode = stage.findOne(`#${selectedId}`)
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode])
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
    }
  }, [selectedId, currentPageShapes])

  const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Calculate distance between two points in pixels
  const calculatePixelDistance = useCallback((points: number[]) => {
    if (points.length < 4) return 0
    let totalDistance = 0
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = normalizedToPixel(points[i], 'width')
      const y1 = normalizedToPixel(points[i + 1], 'height')
      const x2 = normalizedToPixel(points[i + 2], 'width')
      const y2 = normalizedToPixel(points[i + 3], 'height')
      totalDistance += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    }
    return totalDistance
  }, [normalizedToPixel])

  // Calculate polygon area using shoelace formula
  const calculatePolygonArea = useCallback((points: number[]) => {
    if (points.length < 6) return 0
    let area = 0
    const pixelPoints = []
    for (let i = 0; i < points.length; i += 2) {
      pixelPoints.push({
        x: normalizedToPixel(points[i], 'width'),
        y: normalizedToPixel(points[i + 1], 'height')
      })
    }
    
    for (let i = 0; i < pixelPoints.length; i++) {
      const j = (i + 1) % pixelPoints.length
      area += pixelPoints[i].x * pixelPoints[j].y
      area -= pixelPoints[j].x * pixelPoints[i].y
    }
    return Math.abs(area) / 2
  }, [normalizedToPixel])

  // Convert measurements to real world units
  const convertToRealUnits = useCallback((pixelValue: number, isArea = false) => {
    if (!currentCalibration) return { value: pixelValue, units: 'px' }
    
    if (isArea) {
      const realArea = pixelValue / (currentCalibration.pixelsPerUnit ** 2)
      const units = currentCalibration.units === 'ft' ? 'ft²' : 
                   currentCalibration.units === 'in' ? 'in²' : 'm²'
      return { value: realArea, units }
    } else {
      const realLength = pixelValue / currentCalibration.pixelsPerUnit
      return { value: realLength, units: currentCalibration.units }
    }
  }, [currentCalibration])

  const handleCalibrationComplete = (distance: number, units: string) => {
    if (calibrationPoints.length >= 4) {
      const pixelDistance = Math.sqrt(
        (normalizedToPixel(calibrationPoints[2], 'width') - normalizedToPixel(calibrationPoints[0], 'width')) ** 2 +
        (normalizedToPixel(calibrationPoints[3], 'height') - normalizedToPixel(calibrationPoints[1], 'height')) ** 2
      )
      
      const pixelsPerUnit = pixelDistance / distance
      
      setCalibrations({
        ...calibrations,
        [currentPage]: { pixelsPerUnit, units }
      })
    }
    
    setCalibrationPoints([])
    setShowCalibrationDialog(false)
  }

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    
    if (!pos) return

    // Handle calibration tool
    if (activeTool === 'calibrate') {
      const normalizedX = pixelToNormalized(pos.x, 'width')
      const normalizedY = pixelToNormalized(pos.y, 'height')
      
      if (calibrationPoints.length === 0) {
        setCalibrationPoints([normalizedX, normalizedY])
      } else if (calibrationPoints.length === 2) {
        setCalibrationPoints([...calibrationPoints, normalizedX, normalizedY])
        setShowCalibrationDialog(true)
      }
      return
    }

    // If clicking on empty area with select tool, deselect
    if (activeTool === 'select' && e.target === stage) {
      setSelectedId(null)
      return
    }

    // If not in drawing tool, return
    if (activeTool === 'select') return

    setIsDrawing(true)
    const normalizedX = pixelToNormalized(pos.x, 'width')
    const normalizedY = pixelToNormalized(pos.y, 'height')

    const newShape: Shape = {
      id: generateId(),
      type: activeTool as Shape['type'],
      page: currentPage,
      style: {
        stroke: strokeColor,
        width: strokeWidth,
        fill: activeTool === 'highlighter' ? strokeColor : 'transparent',
        opacity: activeTool === 'highlighter' ? 0.3 : 1,
        arrowEnd: activeTool === 'arrow'
      },
      meta: {}
    }

    switch (activeTool) {
      case 'rect':
      case 'ellipse':
      case 'highlighter':
        newShape.x = normalizedX
        newShape.y = normalizedY
        newShape.w = 0
        newShape.h = 0
        break
      case 'polyline':
      case 'polygon':
      case 'arrow':
      case 'measure_line':
      case 'measure_area':
        newShape.points = [normalizedX, normalizedY]
        setCurrentPoints([normalizedX, normalizedY])
        break
      case 'text':
        const text = prompt('Enter text:')
        if (text) {
          newShape.x = normalizedX
          newShape.y = normalizedY
          newShape.meta.text = text
          newShape.meta.fontSize = 16
          setShapes([...(shapes || []), newShape])
        }
        setIsDrawing(false)
        return
    }

    setTempShape(newShape)
  }

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return
    
    // Update mouse position for measurement display
    setMousePos({ x: pos.x, y: pos.y })

    if (!isDrawing || !tempShape) return

    const normalizedX = pixelToNormalized(pos.x, 'width')
    const normalizedY = pixelToNormalized(pos.y, 'height')

    const updatedShape = { ...tempShape }

    switch (activeTool) {
      case 'rect':
      case 'ellipse':
      case 'highlighter':
        updatedShape.w = normalizedX - (tempShape.x || 0)
        updatedShape.h = normalizedY - (tempShape.y || 0)
        break
      case 'polyline':
      case 'arrow':
      case 'measure_line':
        if (tempShape.points) {
          updatedShape.points = [...tempShape.points.slice(0, -2), normalizedX, normalizedY]
          
          // Calculate live measurement for measure_line
          if (activeTool === 'measure_line') {
            const pixelDistance = calculatePixelDistance(updatedShape.points)
            const realMeasurement = convertToRealUnits(pixelDistance)
            updatedShape.meta.length = realMeasurement.value
            updatedShape.meta.units = realMeasurement.units
          }
        }
        break
    }

    setTempShape(updatedShape)
  }

  const handleStageMouseUp = () => {
    if (!isDrawing || !tempShape) return

    if (activeTool === 'polyline' || activeTool === 'polygon' || activeTool === 'measure_line' || activeTool === 'measure_area') {
      // Continue drawing for polyline/polygon/measurements - double click to finish
      return
    }

    // Finish drawing
    setShapes([...(shapes || []), tempShape])
    setTempShape(null)
    setIsDrawing(false)
    setCurrentPoints([])
  }

  const handleStageDoubleClick = () => {
    if (isDrawing && tempShape && (activeTool === 'polyline' || activeTool === 'polygon' || activeTool === 'measure_line' || activeTool === 'measure_area')) {
      // Finish polyline/polygon/measurements
      let finalShape = { ...tempShape }
      
      if ((activeTool === 'polygon' || activeTool === 'measure_area') && finalShape.points && finalShape.points.length >= 6) {
        // Close the polygon
        finalShape.points = [...finalShape.points, finalShape.points[0], finalShape.points[1]]
        
        // Calculate area for measure_area
        if (activeTool === 'measure_area') {
          const pixelArea = calculatePolygonArea(finalShape.points)
          const realMeasurement = convertToRealUnits(pixelArea, true)
          finalShape.meta.area = realMeasurement.value
          finalShape.meta.units = realMeasurement.units
          
          // Also calculate perimeter
          const pixelPerimeter = calculatePixelDistance(finalShape.points)
          const realPerimeter = convertToRealUnits(pixelPerimeter)
          finalShape.meta.perimeter = realPerimeter.value
        }
      }
      
      // Final calculation for measure_line
      if (activeTool === 'measure_line' && finalShape.points) {
        const pixelDistance = calculatePixelDistance(finalShape.points)
        const realMeasurement = convertToRealUnits(pixelDistance)
        finalShape.meta.length = realMeasurement.value
        finalShape.meta.units = realMeasurement.units
      }
      
      setShapes([...(shapes || []), finalShape])
      setTempShape(null)
      setIsDrawing(false)
      setCurrentPoints([])
    }
  }

  const handleShapeClick = (shapeId: string) => {
    if (activeTool === 'select') {
      setSelectedId(shapeId)
    }
  }

  const handleShapeChange = (shapeId: string, newAttrs: any) => {
    const updatedShapes = (shapes || []).map(shape => {
      if (shape.id === shapeId) {
        const normalizedAttrs: Partial<Shape> = {}
        
        if (newAttrs.x !== undefined) {
          normalizedAttrs.x = pixelToNormalized(newAttrs.x, 'width')
        }
        if (newAttrs.y !== undefined) {
          normalizedAttrs.y = pixelToNormalized(newAttrs.y, 'height')
        }
        if (newAttrs.width !== undefined) {
          normalizedAttrs.w = pixelToNormalized(newAttrs.width, 'width')
        }
        if (newAttrs.height !== undefined) {
          normalizedAttrs.h = pixelToNormalized(newAttrs.height, 'height')
        }
        
        return { ...shape, ...normalizedAttrs }
      }
      return shape
    })
    
    setShapes(updatedShapes)
  }

  const renderShape = (shape: Shape) => {
    const commonProps = {
      id: shape.id,
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: shape.style.width,
      fill: shape.style.fill || 'transparent',
      opacity: shape.style.opacity || 1,
      onClick: () => handleShapeClick(shape.id),
      onDragEnd: (e: any) => handleShapeChange(shape.id, e.target.attrs),
      draggable: activeTool === 'select'
    }

    switch (shape.type) {
      case 'rect':
      case 'highlighter':
        return (
          <Rect
            {...commonProps}
            x={normalizedToPixel(shape.x || 0, 'width')}
            y={normalizedToPixel(shape.y || 0, 'height')}
            width={normalizedToPixel(shape.w || 0, 'width')}
            height={normalizedToPixel(shape.h || 0, 'height')}
          />
        )
      
      case 'ellipse':
        return (
          <Ellipse
            {...commonProps}
            x={normalizedToPixel((shape.x || 0) + (shape.w || 0) / 2, 'width')}
            y={normalizedToPixel((shape.y || 0) + (shape.h || 0) / 2, 'height')}
            radiusX={Math.abs(normalizedToPixel(shape.w || 0, 'width')) / 2}
            radiusY={Math.abs(normalizedToPixel(shape.h || 0, 'height')) / 2}
          />
        )
      
      case 'polyline':
      case 'measure_line':
        return (
          <Line
            {...commonProps}
            points={shape.points?.map((point, index) => 
              normalizedToPixel(point, index % 2 === 0 ? 'width' : 'height')
            ) || []}
            lineCap="round"
            lineJoin="round"
          />
        )
      
      case 'polygon':
      case 'measure_area':
        return (
          <Line
            {...commonProps}
            points={shape.points?.map((point, index) => 
              normalizedToPixel(point, index % 2 === 0 ? 'width' : 'height')
            ) || []}
            closed={true}
            lineCap="round"
            lineJoin="round"
          />
        )
      
      case 'arrow':
        const points = shape.points?.map((point, index) => 
          normalizedToPixel(point, index % 2 === 0 ? 'width' : 'height')
        ) || []
        
        if (points.length >= 4) {
          return (
            <Arrow
              {...commonProps}
              points={points}
              pointerLength={10}
              pointerWidth={8}
              lineCap="round"
            />
          )
        }
        return null
      
      case 'text':
        return (
          <Text
            {...commonProps}
            x={normalizedToPixel(shape.x || 0, 'width')}
            y={normalizedToPixel(shape.y || 0, 'height')}
            text={shape.meta.text || ''}
            fontSize={shape.meta.fontSize || 16}
            fill={shape.style.stroke}
          />
        )
      
      default:
        return null
    }
  }

  if (pageWidth === 0 || pageHeight === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={handleStageDoubleClick}
      >
        <Layer>
          {/* Render current page shapes */}
          {currentPageShapes.map(shape => renderShape(shape))}
          
          {/* Render temporary shape while drawing */}
          {tempShape && renderShape(tempShape)}
          
          {/* Render calibration line if in progress */}
          {activeTool === 'calibrate' && calibrationPoints.length >= 2 && (
            <Line
              points={[
                normalizedToPixel(calibrationPoints[0], 'width'),
                normalizedToPixel(calibrationPoints[1], 'height'),
                ...(calibrationPoints.length >= 4 ? [
                  normalizedToPixel(calibrationPoints[2], 'width'),
                  normalizedToPixel(calibrationPoints[3], 'height')
                ] : [mousePos.x, mousePos.y])
              ]}
              stroke="#ff6b35"
              strokeWidth={3}
              dash={[5, 5]}
            />
          )}
          
          {/* Transformer for selected shapes */}
          {activeTool === 'select' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              anchorSize={8}
              borderStroke="#4A6FA5"
              borderStrokeWidth={2}
              anchorStroke="#4A6FA5"
              anchorFill="white"
            />
          )}
        </Layer>
      </Stage>

      {/* Live measurement display */}
      {isDrawing && tempShape && (activeTool === 'measure_line' || activeTool === 'measure_area') && (
        <div 
          className="absolute bg-black/80 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
          style={{ 
            left: mousePos.x + 10, 
            top: mousePos.y - 30,
            transform: mousePos.x > stageWidth - 100 ? 'translateX(-100%)' : 'none'
          }}
        >
          {activeTool === 'measure_line' && tempShape.meta.length && (
            `${tempShape.meta.length.toFixed(2)} ${tempShape.meta.units}`
          )}
          {activeTool === 'measure_area' && tempShape.points && tempShape.points.length >= 6 && (
            `Area: ${calculatePolygonArea(tempShape.points).toFixed(0)} px²`
          )}
        </div>
      )}

      {/* Calibration dialog */}
      {showCalibrationDialog && (
        <CalibrationDialog
          onComplete={handleCalibrationComplete}
          onCancel={() => {
            setShowCalibrationDialog(false)
            setCalibrationPoints([])
          }}
        />
      )}
    </div>
  )
}

// Calibration dialog component
interface CalibrationDialogProps {
  onComplete: (distance: number, units: string) => void
  onCancel: () => void
}

function CalibrationDialog({ onComplete, onCancel }: CalibrationDialogProps) {
  const [distance, setDistance] = useState('')
  const [units, setUnits] = useState('ft')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dist = parseFloat(distance)
    if (!isNaN(dist) && dist > 0) {
      onComplete(dist, units)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-80 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Calibrate Scale
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Enter the real-world distance between the two points you selected:
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Distance"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              autoFocus
              required
            />
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ft">ft</option>
              <option value="in">in</option>
              <option value="m">m</option>
            </select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Calibrate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}