import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'wouter'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator, 
  FileText, 
  Download, 
  Printer,
  Save,
  Copy,
  RefreshCw,
  UploadCloud
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Types for takeoff system
interface MaterialLine {
  id: string
  category: string
  description: string
  unit: string
  quantity: number
  unitCost: number
  totalCost: number
  supplier?: string
  notes?: string
  waste: number
}

interface LaborLine {
  id: string
  trade: string
  description: string
  unit: string
  quantity: number
  ratePerUnit: number
  hours: number
  hourlyRate: number
  totalCost: number
  crew?: string
  notes?: string
}

interface TakeoffData {
  projectInfo: {
    projectName: string
    customer: string
    address: string
    estimatedBy: string
    date: string
    sqft: number
    stories: number
  }
  materials: MaterialLine[]
  labor: LaborLine[]
  overhead: number
  profit: number
  tax: number
  totalMaterials: number
  totalLabor: number
  grandTotal: number
}

const createEstimateSchema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type CreateEstimateData = z.infer<typeof createEstimateSchema>

interface Estimate {
  id: string
  jobId: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  totalCents: number
  linesJson: any
  createdAt: string
  job?: {
    id: string
    customer?: {
      id: string
      name: string
    }
  }
}

interface Job {
  id: string
  customerId: string
  status: string
  customer?: {
    id: string
    name: string
  }
}

export default function Estimates() {
  const params = useParams();
  const division = params?.division || 'mfnc';
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeEstimate, setActiveEstimate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Sample takeoff data - replace with API integration
  const [takeoffData, setTakeoffData] = useState<TakeoffData>({
    projectInfo: {
      projectName: 'Johnson Residence Siding',
      customer: 'Robert Johnson',
      address: '123 Oak Street, Seattle, WA 98101',
      estimatedBy: 'Mike Thompson',
      date: '2025-01-11',
      sqft: 2850,
      stories: 2
    },
    materials: [
      {
        id: '1',
        category: 'Siding',
        description: 'Hardie Plank ColorPlus 8.25" x 12\'',
        unit: 'sq ft',
        quantity: 2850,
        unitCost: 4.25,
        totalCost: 12112.50,
        supplier: 'ABC Supply',
        waste: 10,
        notes: 'Color: Evening Blue'
      },
      {
        id: '2',
        category: 'Trim',
        description: 'Hardie Trim 5/4" x 4" x 12\'',
        unit: 'ln ft',
        quantity: 480,
        unitCost: 6.75,
        totalCost: 3240,
        supplier: 'ABC Supply',
        waste: 5,
        notes: 'Matching color'
      },
      {
        id: '3',
        category: 'Fasteners',
        description: 'Stainless Steel Siding Nails 2.5"',
        unit: 'box',
        quantity: 12,
        unitCost: 45.50,
        totalCost: 546,
        supplier: 'Home Depot',
        waste: 0,
        notes: '5lb boxes'
      },
      {
        id: '4',
        category: 'House Wrap',
        description: 'Tyvek HomeWrap',
        unit: 'sq ft',
        quantity: 3000,
        unitCost: 0.65,
        totalCost: 1950,
        supplier: 'Lowes',
        waste: 5,
        notes: '9ft width rolls'
      }
    ],
    labor: [
      {
        id: '1',
        trade: 'Siding Crew',
        description: 'Remove existing siding',
        unit: 'sq ft',
        quantity: 2850,
        ratePerUnit: 1.25,
        hours: 24,
        hourlyRate: 85,
        totalCost: 3562.50,
        crew: 'Crew A (3 workers)',
        notes: 'Disposal included'
      },
      {
        id: '2',
        trade: 'Siding Crew',
        description: 'Install house wrap',
        unit: 'sq ft',
        quantity: 3000,
        ratePerUnit: 0.45,
        hours: 12,
        hourlyRate: 85,
        totalCost: 1350,
        crew: 'Crew A (3 workers)',
        notes: 'Weather dependent'
      },
      {
        id: '3',
        trade: 'Siding Crew',
        description: 'Install Hardie Plank siding',
        unit: 'sq ft',
        quantity: 2850,
        ratePerUnit: 2.85,
        hours: 48,
        hourlyRate: 85,
        totalCost: 8122.50,
        crew: 'Crew A (3 workers)',
        notes: 'Includes cutting and fitting'
      },
      {
        id: '4',
        trade: 'Trim Carpenter',
        description: 'Install trim and finish work',
        unit: 'ln ft',
        quantity: 480,
        ratePerUnit: 8.50,
        hours: 32,
        hourlyRate: 95,
        totalCost: 4080,
        crew: 'Trim Specialist',
        notes: 'Detail work around windows/doors'
      }
    ],
    overhead: 15,
    profit: 20,
    tax: 10.25,
    totalMaterials: 17848.50,
    totalLabor: 17115.00,
    grandTotal: 47842.18
  })

  const form = useForm<CreateEstimateData>({
    resolver: zodResolver(createEstimateSchema),
    defaultValues: {
      leadId: '',
      title: '',
      description: '',
    },
  })

  // Fetch real estimates data
  const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ['/api/trpc/estimates.list'],
  })

  // Fetch leads for creating new estimates
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/trpc/leads.list'],
  })

  // Type the data properly
  const typedEstimates = Array.isArray(estimates) ? estimates as any[] : []
  const typedLeads = Array.isArray(leads) ? leads as any[] : []

  const createEstimateMutation = useMutation({
    mutationFn: async (data: { leadId: string; title: string; description?: string }) => {
      const res = await fetch('/api/trpc/estimates.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          input: {
            leadId: data.leadId,
            title: data.title,
            description: data.description || '',
            status: 'draft',
            totalCents: 0,
            laborHours: '0',
            materialCosts: 0,
            equipmentCosts: 0,
            overheadPercentage: '15',
            profitMarginPercentage: '20',
            notes: '',
          }
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || 'Failed to create estimate')
      }

      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/estimates.list'] })
      setIsCreateDialogOpen(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const addMaterialLine = () => {
    const newLine: MaterialLine = {
      id: `mat-${Date.now()}`,
      category: '',
      description: '',
      unit: 'sq ft',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      waste: 0
    }
    setTakeoffData(prev => ({
      ...prev,
      materials: [...prev.materials, newLine]
    }))
  }

  const addLaborLine = () => {
    const newLine: LaborLine = {
      id: `lab-${Date.now()}`,
      trade: '',
      description: '',
      unit: 'sq ft',
      quantity: 0,
      ratePerUnit: 0,
      hours: 0,
      hourlyRate: 0,
      totalCost: 0
    }
    setTakeoffData(prev => ({
      ...prev,
      labor: [...prev.labor, newLine]
    }))
  }

  const updateMaterialLine = (id: string, field: keyof MaterialLine, value: any) => {
    setTakeoffData(prev => ({
      ...prev,
      materials: prev.materials.map(line => {
        if (line.id === id) {
          const updated = { ...line, [field]: value }
          if (field === 'quantity' || field === 'unitCost' || field === 'waste') {
            const adjustedQuantity = updated.quantity * (1 + updated.waste / 100)
            updated.totalCost = adjustedQuantity * updated.unitCost
          }
          return updated
        }
        return line
      })
    }))
  }

  const updateLaborLine = (id: string, field: keyof LaborLine, value: any) => {
    setTakeoffData(prev => ({
      ...prev,
      labor: prev.labor.map(line => {
        if (line.id === id) {
          const updated = { ...line, [field]: value }
          if (field === 'quantity' || field === 'ratePerUnit' || field === 'hours' || field === 'hourlyRate') {
            updated.totalCost = updated.quantity * updated.ratePerUnit
          }
          return updated
        }
        return line
      })
    }))
  }

  const deleteMaterialLine = (id: string) => {
    setTakeoffData(prev => ({
      ...prev,
      materials: prev.materials.filter(line => line.id !== id)
    }))
  }

  const deleteLaborLine = (id: string) => {
    setTakeoffData(prev => ({
      ...prev,
      labor: prev.labor.filter(line => line.id !== id)
    }))
  }

  // Calculate totals
  const totals = useMemo(() => {
    const materialTotal = takeoffData.materials.reduce((sum, line) => sum + line.totalCost, 0)
    const laborTotal = takeoffData.labor.reduce((sum, line) => sum + line.totalCost, 0)
    const subtotal = materialTotal + laborTotal
    const overheadAmount = subtotal * (takeoffData.overhead / 100)
    const profitAmount = (subtotal + overheadAmount) * (takeoffData.profit / 100)
    const taxAmount = (subtotal + overheadAmount + profitAmount) * (takeoffData.tax / 100)
    const grandTotal = subtotal + overheadAmount + profitAmount + taxAmount

    return {
      materials: materialTotal,
      labor: laborTotal,
      subtotal,
      overhead: overheadAmount,
      profit: profitAmount,
      tax: taxAmount,
      grandTotal
    }
  }, [takeoffData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sent': return 'default'
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      default: return 'secondary'
    }
  }

  if (activeEstimate) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setActiveEstimate(null)}>
                ← Back to Estimates
              </Button>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Material & Labor Takeoff</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {takeoffData.projectInfo.projectName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Project Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Input 
                  id="customer"
                  value={takeoffData.projectInfo.customer}
                  onChange={(e) => setTakeoffData(prev => ({
                    ...prev,
                    projectInfo: { ...prev.projectInfo, customer: e.target.value }
                  }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sqft">Square Footage</Label>
                <Input 
                  id="sqft"
                  type="number"
                  value={takeoffData.projectInfo.sqft}
                  onChange={(e) => setTakeoffData(prev => ({
                    ...prev,
                    projectInfo: { ...prev.projectInfo, sqft: parseInt(e.target.value) || 0 }
                  }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stories">Stories</Label>
                <Select value={takeoffData.projectInfo.stories.toString()} 
                        onValueChange={(value) => setTakeoffData(prev => ({
                          ...prev,
                          projectInfo: { ...prev.projectInfo, stories: parseInt(value) }
                        }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Story</SelectItem>
                    <SelectItem value="2">2 Story</SelectItem>
                    <SelectItem value="3">3 Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedBy">Estimated By</Label>
                <Input 
                  id="estimatedBy"
                  value={takeoffData.projectInfo.estimatedBy}
                  onChange={(e) => setTakeoffData(prev => ({
                    ...prev,
                    projectInfo: { ...prev.projectInfo, estimatedBy: e.target.value }
                  }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="address">Project Address</Label>
              <Textarea 
                id="address"
                value={takeoffData.projectInfo.address}
                onChange={(e) => setTakeoffData(prev => ({
                  ...prev,
                  projectInfo: { ...prev.projectInfo, address: e.target.value }
                }))}
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Takeoff Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Material Takeoff</CardTitle>
                  <Button onClick={addMaterialLine} size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Category</TableHead>
                        <TableHead className="min-w-48">Description</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-20">Unit Cost</TableHead>
                        <TableHead className="w-16">Waste %</TableHead>
                        <TableHead className="w-24">Total</TableHead>
                        <TableHead className="w-32">Supplier</TableHead>
                        <TableHead className="w-32">Notes</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {takeoffData.materials.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Select value={line.category} onValueChange={(value) => updateMaterialLine(line.id, 'category', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Siding">Siding</SelectItem>
                                <SelectItem value="Trim">Trim</SelectItem>
                                <SelectItem value="Fasteners">Fasteners</SelectItem>
                                <SelectItem value="House Wrap">House Wrap</SelectItem>
                                <SelectItem value="Flashing">Flashing</SelectItem>
                                <SelectItem value="Caulk/Sealant">Caulk/Sealant</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.description}
                              onChange={(e) => updateMaterialLine(line.id, 'description', e.target.value)}
                              placeholder="Material description"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={line.unit} onValueChange={(value) => updateMaterialLine(line.id, 'unit', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sq ft">sq ft</SelectItem>
                                <SelectItem value="ln ft">ln ft</SelectItem>
                                <SelectItem value="each">each</SelectItem>
                                <SelectItem value="box">box</SelectItem>
                                <SelectItem value="roll">roll</SelectItem>
                                <SelectItem value="bundle">bundle</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateMaterialLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.unitCost}
                              onChange={(e) => updateMaterialLine(line.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.waste}
                              onChange={(e) => updateMaterialLine(line.id, 'waste', parseFloat(e.target.value) || 0)}
                              step="1"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(line.totalCost)}</div>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.supplier || ''}
                              onChange={(e) => updateMaterialLine(line.id, 'supplier', e.target.value)}
                              placeholder="Supplier"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.notes || ''}
                              onChange={(e) => updateMaterialLine(line.id, 'notes', e.target.value)}
                              placeholder="Notes"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteMaterialLine(line.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Materials:</span>
                    <span className="text-[#4A6FA5]">{formatCurrency(totals.materials)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor Tab */}
          <TabsContent value="labor" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Labor Takeoff</CardTitle>
                  <Button onClick={addLaborLine} size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Trade</TableHead>
                        <TableHead className="min-w-48">Description</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-20">Rate/Unit</TableHead>
                        <TableHead className="w-20">Hours</TableHead>
                        <TableHead className="w-20">Hr Rate</TableHead>
                        <TableHead className="w-24">Total</TableHead>
                        <TableHead className="w-32">Crew</TableHead>
                        <TableHead className="w-32">Notes</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {takeoffData.labor.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Select value={line.trade} onValueChange={(value) => updateLaborLine(line.id, 'trade', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Trade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Siding Crew">Siding Crew</SelectItem>
                                <SelectItem value="Trim Carpenter">Trim Carpenter</SelectItem>
                                <SelectItem value="General Labor">General Labor</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Crane Operator">Crane Operator</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.description}
                              onChange={(e) => updateLaborLine(line.id, 'description', e.target.value)}
                              placeholder="Labor description"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={line.unit} onValueChange={(value) => updateLaborLine(line.id, 'unit', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sq ft">sq ft</SelectItem>
                                <SelectItem value="ln ft">ln ft</SelectItem>
                                <SelectItem value="hour">hour</SelectItem>
                                <SelectItem value="day">day</SelectItem>
                                <SelectItem value="each">each</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateLaborLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.ratePerUnit}
                              onChange={(e) => updateLaborLine(line.id, 'ratePerUnit', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.hours}
                              onChange={(e) => updateLaborLine(line.id, 'hours', parseFloat(e.target.value) || 0)}
                              step="0.5"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={line.hourlyRate}
                              onChange={(e) => updateLaborLine(line.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(line.totalCost)}</div>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.crew || ''}
                              onChange={(e) => updateLaborLine(line.id, 'crew', e.target.value)}
                              placeholder="Crew"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={line.notes || ''}
                              onChange={(e) => updateLaborLine(line.id, 'notes', e.target.value)}
                              placeholder="Notes"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteLaborLine(line.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Labor:</span>
                    <span className="text-[#4A6FA5]">{formatCurrency(totals.labor)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Project Plans & Drawings
                  </CardTitle>
                  <Button size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Plans
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[600px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        BlueBeam-Style Plan Viewer
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md">
                        This section will be developed to provide plan viewing, markup, measurement, 
                        and annotation capabilities similar to BlueBeam Revu.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Button variant="outline">
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload PDF Plans
                      </Button>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Ready for BlueBeam functionality implementation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Materials Total:</span>
                      <span className="font-medium">{formatCurrency(totals.materials)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Labor Total:</span>
                      <span className="font-medium">{formatCurrency(totals.labor)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Overhead ({takeoffData.overhead}%):</span>
                      <span className="font-medium">{formatCurrency(totals.overhead)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Profit ({takeoffData.profit}%):</span>
                      <span className="font-medium">{formatCurrency(totals.profit)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Tax ({takeoffData.tax}%):</span>
                      <span className="font-medium">{formatCurrency(totals.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-3 text-lg font-bold">
                      <span className="text-slate-900 dark:text-white">Grand Total:</span>
                      <span className="text-[#4A6FA5]">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Material Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Material Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(new Set(takeoffData.materials.map(m => m.category))).map(category => {
                      const categoryTotal = takeoffData.materials
                        .filter(m => m.category === category)
                        .reduce((sum, m) => sum + m.totalCost, 0)
                      
                      return (
                        <div key={category} className="flex justify-between items-center py-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{category}:</span>
                          <span className="text-sm font-medium">{formatCurrency(categoryTotal)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#4A6FA5]">
                    {formatCurrency(totals.grandTotal / takeoffData.projectInfo.sqft)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Cost per Sq Ft</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#4A6FA5]">
                    {Math.round(takeoffData.labor.reduce((sum, l) => sum + l.hours, 0))}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Labor Hours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#4A6FA5]">
                    {Math.round((totals.labor / totals.materials) * 100)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Labor vs Material</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#4A6FA5]">
                    {Math.round(((totals.overhead + totals.profit) / totals.subtotal) * 100)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Markup</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estimate Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="overhead">Overhead %</Label>
                    <Input 
                      id="overhead"
                      type="number"
                      value={takeoffData.overhead}
                      onChange={(e) => setTakeoffData(prev => ({ ...prev, overhead: parseFloat(e.target.value) || 0 }))}
                      step="0.1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profit">Profit %</Label>
                    <Input 
                      id="profit"
                      type="number"
                      value={takeoffData.profit}
                      onChange={(e) => setTakeoffData(prev => ({ ...prev, profit: parseFloat(e.target.value) || 0 }))}
                      step="0.1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax">Tax %</Label>
                    <Input 
                      id="tax"
                      type="number"
                      value={takeoffData.tax}
                      onChange={(e) => setTakeoffData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estimates</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Material and labor takeoff estimating system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      {/* Estimates List */}
      {estimatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-slate-600">Loading estimates...</p>
        </div>
      ) : typedEstimates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {typedEstimates.map((estimate: any) => (
            <Card key={estimate.id} className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveEstimate(estimate.id)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{estimate.lead?.name || 'Unknown Lead'}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {estimate.title}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(estimate.status) as any}>
                    {statusOptions.find(opt => opt.value === estimate.status)?.label || estimate.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Amount:</span>
                    <span className="font-semibold text-[#4A6FA5]">
                      {formatCurrency(estimate.totalCents / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Created:</span>
                    <span className="text-sm">{new Date(estimate.createdAt).toLocaleDateString()}</span>
                  </div>
                  {estimate.laborHours && estimate.laborHours !== '0' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Labor Hours:</span>
                      <span className="text-sm">{estimate.laborHours}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">No estimates found</p>
          <p className="text-slate-400 text-sm mb-4">Create your first estimate to get started</p>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Estimate
          </Button>
        </div>
      )}

      {/* Create Estimate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
            <DialogDescription>
              Create an estimate for an existing lead
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => createEstimateMutation.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="leadId">Lead</Label>
              <Select 
                value={form.watch('leadId')} 
                onValueChange={(value) => {
                  form.setValue('leadId', value)
                  const selectedLead = typedLeads.find((lead: any) => lead.id === value)
                  if (selectedLead) {
                    form.setValue('title', `Estimate for ${selectedLead.name}`)
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leadsLoading ? (
                    <SelectItem value="loading" disabled>Loading leads...</SelectItem>
                  ) : typedLeads.length > 0 ? (
                    typedLeads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.projectType || 'No project type'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-leads" disabled>No leads available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.leadId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.leadId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Estimate Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter estimate title"
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Brief description of the estimate"
                className="mt-1"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createEstimateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createEstimateMutation.isPending}
                className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
              >
                {createEstimateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Estimate
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}