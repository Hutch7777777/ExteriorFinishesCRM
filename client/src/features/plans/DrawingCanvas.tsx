import React, { useRef, useEffect, useState, useCallback } from 'react'

interface Point {
  x: number
  y: number
}

interface DrawingCanvasProps {
  activeTool: string
  strokeColor: string
  strokeWidth: number
  onShapeComplete?: (shape: any) => void
}

export function DrawingCanvas({ 
  activeTool, 
  strokeColor, 
  strokeWidth,
  onShapeComplete 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)
  const [shapes, setShapes] = useState<any[]>([])

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: any) => {
    ctx.strokeStyle = shape.color
    ctx.lineWidth = shape.strokeWidth
    ctx.setLineDash([])
    
    switch (shape.type) {
      case 'rectangle':
        ctx.strokeRect(shape.x, shape.y, shape.shapeWidth || shape.width || 0, shape.height)
        break
      case 'circle':
        ctx.beginPath()
        const w = shape.shapeWidth || shape.width || 0
        const radius = Math.sqrt(Math.pow(w, 2) + Math.pow(shape.height, 2)) / 2
        ctx.arc(shape.x + w/2, shape.y + shape.height/2, Math.abs(radius), 0, 2 * Math.PI)
        ctx.stroke()
        break
      case 'line':
        ctx.beginPath()
        ctx.moveTo(shape.startX, shape.startY)
        ctx.lineTo(shape.endX, shape.endY)
        ctx.stroke()
        break
      case 'text':
        ctx.font = `${shape.fontSize || 16}px Arial`
        ctx.fillStyle = shape.color
        ctx.fillText(shape.text || 'Text', shape.x, shape.y)
        break
    }
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw all existing shapes
    shapes.forEach(shape => drawShape(ctx, shape))
    
    // Draw current shape being created
    if (isDrawing && startPoint && currentPoint && activeTool !== 'select') {
      const tempShape = {
        type: activeTool,
        x: Math.min(startPoint.x, currentPoint.x),
        y: Math.min(startPoint.y, currentPoint.y),
        shapeWidth: Math.abs(currentPoint.x - startPoint.x),
        height: Math.abs(currentPoint.y - startPoint.y),
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        color: strokeColor,
        strokeWidth: strokeWidth
      }
      
      ctx.setLineDash([5, 5]) // Dashed line for preview
      drawShape(ctx, tempShape)
    }
  }, [shapes, isDrawing, startPoint, currentPoint, activeTool, strokeColor, strokeWidth, drawShape])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        redrawCanvas()
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [redrawCanvas])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return

    const point = getCanvasPoint(e)
    setStartPoint(point)
    setCurrentPoint(point)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'select') return

    const point = getCanvasPoint(e)
    setCurrentPoint(point)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || activeTool === 'select') return

    const point = getCanvasPoint(e)
    
    // Create the final shape
    const newShape = {
      id: `shape_${Date.now()}`,
      type: activeTool,
      x: Math.min(startPoint.x, point.x),
      y: Math.min(startPoint.y, point.y),
      shapeWidth: Math.abs(point.x - startPoint.x),
      height: Math.abs(point.y - startPoint.y),
      startX: startPoint.x,
      startY: startPoint.y,
      endX: point.x,
      endY: point.y,
      color: strokeColor,
      strokeWidth: strokeWidth,
      text: activeTool === 'text' ? prompt('Enter text:') || 'Text' : undefined
    }

    // Only add shape if it has some size (avoid accidental clicks)
    if (newShape.shapeWidth > 5 || newShape.height > 5 || activeTool === 'text') {
      setShapes(prev => [...prev, newShape])
      onShapeComplete?.(newShape)
    }

    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
      style={{ zIndex: 10 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  )
}