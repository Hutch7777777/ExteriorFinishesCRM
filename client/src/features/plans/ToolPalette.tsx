import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  MousePointer, 
  Type, 
  ArrowUp, 
  Square, 
  Circle, 
  Minus, 
  Pentagon, 
  Highlighter,
  Ruler,
  Move3D,
  Calculator
} from 'lucide-react'

interface ToolPaletteProps {
  selectedTool: string
  onToolSelect: (tool: string) => void
  strokeWidth: number
  onStrokeWidthChange: (width: number) => void
  strokeColor: string
  onStrokeColorChange: (color: string) => void
}

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'arrow', label: 'Arrow', icon: ArrowUp },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'polyline', label: 'Polyline', icon: Minus },
  { id: 'polygon', label: 'Polygon', icon: Pentagon },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
]

const measureTools = [
  { id: 'calibrate', label: 'Calibrate', icon: Move3D },
  { id: 'measure_line', label: 'Measure Line', icon: Ruler },
  { id: 'measure_area', label: 'Measure Area', icon: Calculator },
]

const predefinedColors = [
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#000000', // Black
  '#ffffff', // White
]

export default function ToolPalette({
  selectedTool,
  onToolSelect,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange
}: ToolPaletteProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Tools */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tools</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className={`h-12 flex flex-col gap-1 ${
                    selectedTool === tool.id 
                      ? 'bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]' 
                      : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Measurement Tools */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Measurement Tools</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-2">
            {measureTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className={`h-10 flex items-center gap-2 ${
                    selectedTool === tool.id 
                      ? 'bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]' 
                      : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tool.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Properties */}
      <Card className="mx-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Stroke Width */}
          <div>
            <Label htmlFor="stroke-width" className="text-xs font-medium">
              Stroke Width
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="stroke-width"
                type="number"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(parseInt(e.target.value) || 1)}
                className="flex-1"
                size={1}
              />
              <span className="text-xs text-slate-500 w-6">px</span>
            </div>
            
            {/* Visual preview */}
            <div className="mt-2 h-6 flex items-center">
              <div 
                className="rounded-full bg-current"
                style={{ 
                  width: `${Math.max(strokeWidth, 2)}px`,
                  height: `${Math.max(strokeWidth, 2)}px`,
                  color: strokeColor
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Stroke Color */}
          <div>
            <Label className="text-xs font-medium">Stroke Color</Label>
            
            {/* Custom color picker */}
            <div className="mt-2">
              <Input
                type="color"
                value={strokeColor}
                onChange={(e) => onStrokeColorChange(e.target.value)}
                className="w-full h-8 p-1 rounded border"
              />
            </div>
            
            {/* Predefined colors */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onStrokeColorChange(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    strokeColor === color 
                      ? 'border-slate-400 dark:border-slate-500' 
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurements (Future) */}
      <Card className="mx-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Measurements</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-slate-500 text-center py-4">
            Measurement tools coming soon
          </div>
        </CardContent>
      </Card>

      {/* Layers (Future) */}
      <Card className="mx-4 mb-4 flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Layers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-slate-500 text-center py-4">
            Layer management coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}