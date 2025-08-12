import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
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
  Calculator,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Layers,
  Save,
  BarChart3
} from 'lucide-react'

export interface SnappingSettings {
  enabled: boolean
  snapToVertices: boolean
  snapToAngles: boolean
  snapToGrid: boolean
  gridSpacing: number
  tolerance: number
}

interface LayerSettings {
  Markup: boolean
  Measurements: boolean
  Symbols: boolean
  Text: boolean
}

interface ToolPaletteProps {
  selectedTool: string
  onToolSelect: (tool: string) => void
  strokeWidth: number
  onStrokeWidthChange: (width: number) => void
  strokeColor: string
  onStrokeColorChange: (color: string) => void
  snappingSettings: SnappingSettings
  onSnappingSettingsChange: (settings: SnappingSettings) => void
  layerSettings?: LayerSettings
  onLayerToggle?: (layer: keyof LayerSettings) => void
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  showScaleCheck?: boolean
  onToggleScaleCheck?: () => void
}

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer, shortcut: 'V' },
  { id: 'text', label: 'Text', icon: Type, shortcut: 'T' },
  { id: 'arrow', label: 'Arrow', icon: ArrowUp, shortcut: 'A' },
  { id: 'rect', label: 'Rectangle', icon: Square, shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'O' },
  { id: 'polyline', label: 'Polyline', icon: Minus, shortcut: 'L' },
  { id: 'polygon', label: 'Polygon', icon: Pentagon, shortcut: 'P' },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter, shortcut: 'H' },
]

const measureTools = [
  { id: 'calibrate', label: 'Calibrate', icon: Move3D, shortcut: 'C' },
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
  onStrokeColorChange,
  snappingSettings,
  onSnappingSettingsChange,
  layerSettings,
  onLayerToggle,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showScaleCheck,
  onToggleScaleCheck
}: ToolPaletteProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Undo/Redo and Save Status */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Actions
            {hasUnsavedChanges && <Save className="w-3 h-3 text-orange-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo className="w-3 h-3 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo className="w-3 h-3 mr-1" />
              Redo
            </Button>
          </div>
          <div className="mt-2">
            <Button
              variant={showScaleCheck ? "default" : "outline"}
              size="sm"
              onClick={onToggleScaleCheck}
              className="w-full"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Scale Check
            </Button>
          </div>
          {hasUnsavedChanges && (
            <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
              <Save className="w-3 h-3" />
              Auto-saving changes...
            </div>
          )}
          
          {/* Keyboard Shortcuts Help */}
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-medium">Shortcuts:</div>
              <div>Ctrl/⌘+Z: Undo • Ctrl/⌘+Y: Redo</div>
              <div>Del: Delete Selected</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                  {tool.shortcut && (
                    <span className="text-[10px] opacity-60 absolute top-1 right-1 bg-slate-500 text-white rounded px-1">
                      {tool.shortcut}
                    </span>
                  )}
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
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tool.label}</span>
                  {tool.shortcut && (
                    <span className="text-[10px] opacity-60 ml-auto bg-slate-500 text-white rounded px-1">
                      {tool.shortcut}
                    </span>
                  )}
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

      {/* Layer Management */}
      {layerSettings && onLayerToggle && (
        <Card className="mx-4 mb-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1">
              <Layers className="w-4 h-4" />
              Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {(Object.keys(layerSettings) as Array<keyof LayerSettings>).map((layer) => (
              <div key={layer} className="flex items-center space-x-2">
                <button
                  onClick={() => onLayerToggle(layer)}
                  className="flex items-center justify-center w-5 h-5 rounded border"
                >
                  {layerSettings[layer] ? (
                    <Eye className="w-3 h-3 text-blue-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-slate-400" />
                  )}
                </button>
                <Label
                  htmlFor={`layer-${layer}`}
                  className={`text-xs cursor-pointer ${
                    layerSettings[layer] ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
                  }`}
                  onClick={() => onLayerToggle(layer)}
                >
                  {layer}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Snapping */}
      <Card className="mx-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Snapping</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Snapping Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="snap-enabled"
              checked={snappingSettings.enabled}
              onCheckedChange={(checked) =>
                onSnappingSettingsChange({
                  ...snappingSettings,
                  enabled: checked as boolean,
                })
              }
            />
            <Label htmlFor="snap-enabled" className="text-xs font-medium">
              Enable Snapping
            </Label>
          </div>
          
          {snappingSettings.enabled && (
            <div className="space-y-2 pl-6">
              {/* Snap to Vertices */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snap-vertices"
                  checked={snappingSettings.snapToVertices}
                  onCheckedChange={(checked) =>
                    onSnappingSettingsChange({
                      ...snappingSettings,
                      snapToVertices: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="snap-vertices" className="text-xs">
                  Vertices
                </Label>
              </div>
              
              {/* Snap to Angles */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snap-angles"
                  checked={snappingSettings.snapToAngles}
                  onCheckedChange={(checked) =>
                    onSnappingSettingsChange({
                      ...snappingSettings,
                      snapToAngles: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="snap-angles" className="text-xs">
                  Angles (0°/45°/90°)
                </Label>
              </div>
              
              {/* Snap to Grid */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snap-grid"
                  checked={snappingSettings.snapToGrid}
                  onCheckedChange={(checked) =>
                    onSnappingSettingsChange({
                      ...snappingSettings,
                      snapToGrid: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="snap-grid" className="text-xs">
                  Grid
                </Label>
              </div>
              
              {/* Grid Spacing */}
              {snappingSettings.snapToGrid && (
                <div>
                  <Label htmlFor="grid-spacing" className="text-xs font-medium">
                    Grid Spacing (px)
                  </Label>
                  <Input
                    id="grid-spacing"
                    type="number"
                    min="5"
                    max="100"
                    value={snappingSettings.gridSpacing}
                    onChange={(e) =>
                      onSnappingSettingsChange({
                        ...snappingSettings,
                        gridSpacing: parseInt(e.target.value) || 10,
                      })
                    }
                    className="mt-1"
                    size={1}
                  />
                </div>
              )}
              
              {/* Snap Tolerance */}
              <div>
                <Label htmlFor="snap-tolerance" className="text-xs font-medium">
                  Tolerance (px)
                </Label>
                <Input
                  id="snap-tolerance"
                  type="number"
                  min="1"
                  max="50"
                  value={snappingSettings.tolerance}
                  onChange={(e) =>
                    onSnappingSettingsChange({
                      ...snappingSettings,
                      tolerance: parseInt(e.target.value) || 10,
                    })
                  }
                  className="mt-1"
                  size={1}
                />
              </div>
            </div>
          )}
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