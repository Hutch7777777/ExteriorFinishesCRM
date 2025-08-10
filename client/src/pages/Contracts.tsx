import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  FileCheck, 
  Plus, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Edit,
  Send
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  customer: string
  amount: number
  status: 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  signedDate?: string
  createdAt: string
}

export default function Contracts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  // Mock data for demonstration
  const mockContracts: Contract[] = [
    {
      id: '1',
      title: 'Siding Installation Contract - Downtown Office',
      customer: 'Metro Housing Partners',
      amount: 45000,
      status: 'active',
      startDate: '2025-01-15',
      endDate: '2025-03-15',
      signedDate: '2025-01-10',
      createdAt: '2025-01-08'
    },
    {
      id: '2',
      title: 'Residential Complex Siding Contract',
      customer: 'Sunrise Apartments LLC',
      amount: 67000,
      status: 'signed',
      startDate: '2025-02-01',
      endDate: '2025-04-30',
      signedDate: '2025-01-12',
      createdAt: '2025-01-05'
    },
    {
      id: '3',
      title: 'Heritage Building Restoration Contract',
      customer: 'Heritage Properties',
      amount: 125000,
      status: 'sent',
      startDate: '2025-02-15',
      endDate: '2025-06-15',
      createdAt: '2025-01-09'
    },
    {
      id: '4',
      title: 'Commercial Warehouse Siding Contract',
      customer: 'Wilson Construction',
      amount: 89000,
      status: 'completed',
      startDate: '2024-11-01',
      endDate: '2024-12-31',
      signedDate: '2024-10-28',
      createdAt: '2024-10-25'
    }
  ]

  const contracts = mockContracts

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'signed': return 'bg-purple-100 text-purple-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-slate-100 text-slate-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />
      case 'sent': return <Send className="w-4 h-4" />
      case 'signed': return <FileCheck className="w-4 h-4" />
      case 'active': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />
      default: return <FileCheck className="w-4 h-4" />
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

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: "title",
      header: "Contract",
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
      header: "Value",
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
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          {formatDate(row.original.startDate)}
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {formatDate(row.original.endDate)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          {row.original.status === 'draft' && (
            <Button variant="ghost" size="sm">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const totalContractValue = contracts.reduce((sum, contract) => sum + contract.amount, 0)
  const activeContracts = contracts.filter(c => c.status === 'active')
  const completedContracts = contracts.filter(c => c.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Contracts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage project contracts, track signatures, and monitor deliverables
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Contracts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{contracts.length}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalContractValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{activeContracts.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{completedContracts.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <DataTable
        columns={columns}
        data={contracts}
        searchPlaceholder="Search contracts..."
        isLoading={false}
        createAction={{
          label: "Create Contract",
          onClick: () => setIsCreateDialogOpen(true)
        }}
        emptyState={{
          icon: <FileCheck className="w-12 h-12" />,
          title: "No contracts found",
          description: "Create your first contract to start managing project agreements."
        }}
      />

      {/* Create Contract Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Create New Contract
            </DialogTitle>
            <DialogDescription>
              Create a new contract for a project. You can save as draft or send for signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title *</Label>
                <Input id="title" placeholder="Project contract name" />
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
                <Label htmlFor="amount">Contract Value *</Label>
                <Input id="amount" type="number" placeholder="45000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Contract Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential Siding Contract</SelectItem>
                    <SelectItem value="commercial">Commercial Siding Contract</SelectItem>
                    <SelectItem value="repair">Repair & Maintenance Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Expected End Date</Label>
                <Input id="endDate" type="date" />
              </div>
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