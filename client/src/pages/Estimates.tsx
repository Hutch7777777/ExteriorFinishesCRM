import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { Plus, Edit } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createEstimateSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']),
  totalCents: z.number().min(0, 'Total must be positive'),
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

export default function Estimates() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CreateEstimateData>({
    resolver: zodResolver(createEstimateSchema),
    defaultValues: {
      jobId: '',
      status: 'draft',
      totalCents: 0,
    },
  })

  // Fetch estimates
  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ['estimates.list', division, statusFilter],
    queryFn: () => trpcClient.estimates.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
      status: statusFilter !== 'all' ? statusFilter as any : undefined
    }),
    retry: false,
  })

  // Fetch jobs for the dropdown
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs.list', division],
    queryFn: () => trpcClient.jobs.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr'
    }),
    retry: false,
  })

  // Create estimate mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateEstimateData) => {
      return trpcClient.estimates.create({
        jobId: data.jobId,
        status: data.status,
        totalCents: data.totalCents,
        linesJson: [], // Empty array for now
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates.list'] })
      setIsCreateDialogOpen(false)
      form.reset()
      toast({ title: 'Estimate created successfully' })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create estimate',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleCreateSubmit = (data: CreateEstimateData) => {
    createMutation.mutate(data)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const columns = [
    {
      key: 'job',
      header: 'Customer',
      render: (value: any, row: Estimate) => (
        <div className="font-medium">{row.job?.customer?.name || 'Unknown Customer'}</div>
      )
    },
    {
      key: 'totalCents',
      header: 'Total',
      render: (value: number) => (
        <div className="font-medium">{formatCurrency(value)}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {statusOptions.find(opt => opt.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ]

  const rowActions = (estimate: Estimate) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        window.location.href = `/${division}/estimates/edit/${estimate.id}`
      }}
    >
      <Edit className="h-4 w-4" />
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estimates</h1>
      </div>

      <DataTable
        columns={columns}
        data={estimates}
        isLoading={isLoading}
        statusFilter={{
          options: statusOptions,
          onFilter: handleStatusFilter,
          placeholder: "Filter by status"
        }}
        actions={{
          create: {
            label: "Create Estimate",
            onClick: () => setIsCreateDialogOpen(true)
          },
          rowActions
        }}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
            <DialogDescription>
              Create a new estimate for the {division.toUpperCase()} division
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="jobId">Job *</Label>
              <Select 
                value={form.watch('jobId')} 
                onValueChange={(value) => form.setValue('jobId', value)}
              >
                <SelectTrigger className={form.formState.errors.jobId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.customer?.name || 'Unknown Customer'} - {job.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.jobId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.jobId.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="totalCents">Total Amount ($) *</Label>
              <Input 
                id="totalCents" 
                type="number"
                step="0.01"
                {...form.register('totalCents', { 
                  valueAsNumber: true,
                  setValueAs: (value) => Math.round(parseFloat(value) * 100)
                })}
                className={form.formState.errors.totalCents ? 'border-destructive' : ''}
              />
              {form.formState.errors.totalCents && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.totalCents.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Estimate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}