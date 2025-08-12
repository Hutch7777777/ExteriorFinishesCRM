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
  type: 'rect' | 'ellipse' | 'polyline' | 'polygon' | 'arrow' | 'text' | 'highlighter'
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
  }
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
  strokeColor
}: OverlayStageProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [tempShape, setTempShape] = useState<Shape | null>(null)

  const stageWidth = pageWidth * zoom
  const stageHeight = pageHeight * zoom

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

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    
    if (!pos) return

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
    if (!isDrawing || !tempShape) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return

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
        if (tempShape.points) {
          updatedShape.points = [...tempShape.points.slice(0, -2), normalizedX, normalizedY]
        }
        break
    }

    setTempShape(updatedShape)
  }

  const handleStageMouseUp = () => {
    if (!isDrawing || !tempShape) return

    if (activeTool === 'polyline' || activeTool === 'polygon') {
      // Continue drawing for polyline/polygon - double click to finish
      return
    }

    // Finish drawing
    setShapes([...(shapes || []), tempShape])
    setTempShape(null)
    setIsDrawing(false)
    setCurrentPoints([])
  }

  const handleStageDoubleClick = () => {
    if (isDrawing && tempShape && (activeTool === 'polyline' || activeTool === 'polygon')) {
      // Finish polyline/polygon
      let finalShape = { ...tempShape }
      
      if (activeTool === 'polygon' && finalShape.points && finalShape.points.length >= 6) {
        // Close the polygon
        finalShape.points = [...finalShape.points, finalShape.points[0], finalShape.points[1]]
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
    </div>
  )
}