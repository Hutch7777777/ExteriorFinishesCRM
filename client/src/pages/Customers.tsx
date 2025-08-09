import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/ui/data-table'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { Plus, Edit } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type CreateCustomerData = z.infer<typeof createCustomerSchema>

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  divisionId: string
  createdAt: string
}

export default function Customers() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CreateCustomerData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    },
  })

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers.list', division, searchQuery],
    queryFn: () => trpcClient.customers.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
      q: searchQuery || undefined 
    }),
    retry: false,
  })

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      return trpcClient.customers.create({
        divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers.list'] })
      setIsCreateDialogOpen(false)
      form.reset()
      toast({ title: 'Customer created successfully' })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create customer',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCreateSubmit = (data: CreateCustomerData) => {
    createMutation.mutate(data)
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (value: string | null) => (
        <div className="max-w-xs truncate">{value || '-'}</div>
      )
    },
  ]

  const rowActions = (customer: Customer) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        window.location.href = `/${division}/customers/edit/${customer.id}`
      }}
    >
      <Edit className="h-4 w-4" />
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers..."
        onSearch={handleSearch}
        isLoading={isLoading}
        actions={{
          create: {
            label: "Add Customer",
            onClick: () => setIsCreateDialogOpen(true)
          },
          rowActions
        }}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to the {division.toUpperCase()} division
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                {...form.register('name')}
                className={form.formState.errors.name ? 'border-destructive' : ''}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-destructive' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel"
                {...form.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                {...form.register('notes')}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}