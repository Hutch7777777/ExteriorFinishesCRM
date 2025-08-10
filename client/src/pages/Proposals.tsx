import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Plus, 
  Send, 
  Eye, 
  Download,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'

interface Proposal {
  id: string
  title: string
  customer: string
  amount: number
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
  createdAt: string
  sentAt?: string
  validUntil: string
  description: string
}

export default function Proposals() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data for demonstration
  const mockProposals: Proposal[] = [
    {
      id: '1',
      title: 'Siding Installation - Downtown Office',
      customer: 'Metro Housing Partners',
      amount: 45000,
      status: 'sent',
      createdAt: '2025-01-08',
      sentAt: '2025-01-08',
      validUntil: '2025-02-08',
      description: 'Complete siding renovation for 12-story office building including materials and labor.'
    },
    {
      id: '2',
      title: 'Residential Complex Siding',
      customer: 'Sunrise Apartments LLC',
      amount: 67000,
      status: 'approved',
      createdAt: '2025-01-05',
      sentAt: '2025-01-06',
      validUntil: '2025-02-05',
      description: 'Vinyl siding installation for 24-unit residential complex with 5-year warranty.'
    },
    {
      id: '3',
      title: 'Heritage Building Restoration',
      customer: 'Heritage Properties',
      amount: 125000,
      status: 'viewed',
      createdAt: '2025-01-03',
      sentAt: '2025-01-04',
      validUntil: '2025-02-03',
      description: 'Historic building siding restoration using period-appropriate materials and techniques.'
    },
    {
      id: '4',
      title: 'Commercial Warehouse Siding',
      customer: 'Wilson Construction',
      amount: 89000,
      status: 'draft',
      createdAt: '2025-01-09',
      validUntil: '2025-02-09',
      description: 'Industrial siding installation for new warehouse facility - 50,000 sq ft.'
    }
  ]

  const proposals = mockProposals

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'viewed': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />
      case 'sent': return <Send className="w-4 h-4" />
      case 'viewed': return <Eye className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'expired': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const columns: ColumnDef<Proposal>[] = [
    {
      accessorKey: "title",
      header: "Proposal",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-50">
            {row.original.title}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {row.original.customer}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {formatCurrency(row.original.amount)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(row.original.status)} flex items-center gap-1 w-fit`}
        >
          {getStatusIcon(row.original.status)}
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      accessorKey: "validUntil",
      header: "Valid Until",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {formatDate(row.original.validUntil)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          {row.original.status === 'draft' && (
            <Button variant="ghost" size="sm">
              <Send className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const totalProposalValue = proposals.reduce((sum, proposal) => sum + proposal.amount, 0)
  const approvedValue = proposals
    .filter(p => p.status === 'approved')
    .reduce((sum, proposal) => sum + proposal.amount, 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Proposals
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create, send, and track project proposals and estimates
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Proposal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Proposals</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{proposals.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalProposalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(approvedValue)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Win Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {Math.round((proposals.filter(p => p.status === 'approved').length / proposals.length) * 100)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <DataTable
        columns={columns}
        data={proposals}
        searchPlaceholder="Search proposals..."
        isLoading={false}
        createAction={{
          label: "Create Proposal",
          onClick: () => setIsCreateDialogOpen(true)
        }}
        emptyState={{
          icon: <FileText className="w-12 h-12" />,
          title: "No proposals found",
          description: "Create your first proposal to start tracking project estimates."
        }}
      />

      {/* Create Proposal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Create New Proposal
            </DialogTitle>
            <DialogDescription>
              Create a professional proposal for your customer. You can save as draft or send immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title *</Label>
                <Input id="title" placeholder="Project name or description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metro">Metro Housing Partners</SelectItem>
                    <SelectItem value="sunrise">Sunrise Apartments LLC</SelectItem>
                    <SelectItem value="heritage">Heritage Properties</SelectItem>
                    <SelectItem value="wilson">Wilson Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount *</Label>
                <Input id="amount" type="number" placeholder="45000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea 
                id="description" 
                placeholder="Detailed description of the work to be performed..."
                className="min-h-24"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Create & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}