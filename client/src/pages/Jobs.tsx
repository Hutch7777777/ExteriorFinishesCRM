import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { Plus, Edit } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createJobSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['planning', 'in_progress', 'completed']),
})

type CreateJobData = z.infer<typeof createJobSchema>

interface Job {
  id: string
  customerId: string
  divisionId: string
  status: 'planning' | 'in_progress' | 'completed'
  siteAddressJson: any
  createdBy: string
  createdAt: string
  customer?: {
    id: string
    name: string
  }
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'planning': return 'secondary'
    case 'in_progress': return 'default'
    case 'completed': return 'secondary'
    default: return 'secondary'
  }
}

export default function Jobs() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CreateJobData>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      customerId: '',
      status: 'planning',
    },
  })

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['jobs.list', division, statusFilter],
    queryFn: () => trpcClient.jobs.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
      status: statusFilter !== 'all' ? statusFilter as any : undefined
    }),
    retry: false,
  })

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers.list', division],
    queryFn: () => trpcClient.customers.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr'
    }),
    retry: false,
  })

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateJobData) => {
      return trpcClient.jobs.create({
        customerId: data.customerId,
        divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
        status: data.status,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs.list'] })
      setIsCreateDialogOpen(false)
      form.reset()
      toast({ title: 'Job created successfully' })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleCreateSubmit = (data: CreateJobData) => {
    createMutation.mutate(data)
  }

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (value: any, row: Job) => (
        <div className="font-medium">{row.customer?.name || 'Unknown Customer'}</div>
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

  const rowActions = (job: Job) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        window.location.href = `/${division}/jobs/edit/${job.id}`
      }}
    >
      <Edit className="h-4 w-4" />
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
      </div>

      <DataTable
        columns={columns}
        data={jobs}
        isLoading={isLoading}
        statusFilter={{
          options: statusOptions,
          onFilter: handleStatusFilter,
          placeholder: "Filter by status"
        }}
        actions={{
          create: {
            label: "Create Job",
            onClick: () => setIsCreateDialogOpen(true)
          },
          rowActions
        }}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Create a new job for the {division.toUpperCase()} division
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="customerId">Customer *</Label>
              <Select 
                value={form.watch('customerId')} 
                onValueChange={(value) => form.setValue('customerId', value)}
              >
                <SelectTrigger className={form.formState.errors.customerId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.customerId.message}
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
                {createMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}