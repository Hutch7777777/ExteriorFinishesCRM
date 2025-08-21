import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { Plus, Edit, Users, Mail, Phone, DollarSign, Building, Globe, MapPin, MessageSquare } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  jobValue: z.string().optional(),
  // Enhanced reporting fields
  customerType: z.enum(['residential', 'commercial', 'government', 'property_management']).default('residential'),
  acquisitionSource: z.enum(['referral', 'website', 'marketing', 'cold_call', 'repeat_customer', 'trade_show', 'social_media', 'other']).default('other'),
  businessName: z.string().optional(),
  primaryContact: z.string().optional(),
  website: z.string().optional(),
  territory: z.string().optional(),
  preferredCommunication: z.enum(['email', 'phone', 'text']).default('email'),
})

type CreateCustomerData = z.infer<typeof createCustomerSchema>

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  fieldSupervisorId: string | null
  divisionId: string
  jobValueCents: number | null
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
      jobValue: '',
      customerType: 'residential',
      acquisitionSource: 'other',
      businessName: '',
      primaryContact: '',
      website: '',
      territory: '',
      preferredCommunication: 'email',
    },
  })

  // Fetch customers with improved caching
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers.list', division, searchQuery],
    queryFn: () => trpcClient.customers.list({ 
      divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
      q: searchQuery || undefined 
    }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      const jobValueCents = data.jobValue ? Math.round(parseFloat(data.jobValue) * 100) : 0
      return trpcClient.customers.create({
        divisionKey: division as 'mfnc' | 'sfnc' | 'rr',
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
        jobValueCents,
        // Enhanced reporting fields
        customerType: data.customerType,
        acquisitionSource: data.acquisitionSource,
        businessName: data.businessName || undefined,
        primaryContact: data.primaryContact || undefined,
        website: data.website || undefined,
        territory: data.territory || undefined,
        preferredCommunication: data.preferredCommunication,
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

  const handleCreateSubmit = (data: CreateCustomerData) => {
    createMutation.mutate(data)
  }

  // Define table columns for TanStack React Table
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium text-slate-900 dark:text-slate-50">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {row.original.email ? (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {row.original.email}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {row.original.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {row.original.phone}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "jobValueCents",
      header: "Job Value",
      cell: ({ row }) => (
        <div className="text-slate-600 dark:text-slate-400">
          {row.original.jobValueCents && row.original.jobValueCents > 0 ? (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ${(row.original.jobValueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <div className="max-w-xs">
          {row.original.notes ? (
            <span className="text-slate-600 dark:text-slate-400 line-clamp-2">
              {row.original.notes}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.location.href = `/${division}/customers/edit/${row.original.id}`
          }}
          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
        >
          <Edit className="w-4 h-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Customers
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your customer relationships and contact information
          </p>
        </div>
      </div>

      {/* Data table with modern styling */}
      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers by name..."
        isLoading={isLoading}
        createAction={{
          label: "Add Customer",
          onClick: () => setIsCreateDialogOpen(true)
        }}
        emptyState={{
          icon: <Users className="w-12 h-12" />,
          title: "No customers found",
          description: "Get started by adding your first customer to this division."
        }}
      />

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create New Customer
            </DialogTitle>
            <DialogDescription>
              Add a new customer to the {division.toUpperCase()} division. All fields except name are optional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                Customer Name *
              </Label>
              <Input 
                id="name" 
                placeholder="Enter customer name"
                {...form.register('name')}
                className={`${
                  form.formState.errors.name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <Input 
                id="email" 
                type="email"
                placeholder="customer@example.com"
                {...form.register('email')}
                className={`${
                  form.formState.errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                Phone Number
              </Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="(555) 123-4567"
                {...form.register('phone')}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobValue" className="text-slate-700 dark:text-slate-300">
                Job Value
              </Label>
              <Input 
                id="jobValue" 
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('jobValue')}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>
            
            {/* Customer Type */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Customer Type
              </Label>
              <Select value={form.watch('customerType')} onValueChange={(value) => form.setValue('customerType', value as any)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="property_management">Property Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acquisition Source */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                How did they find us?
              </Label>
              <Select value={form.watch('acquisitionSource')} onValueChange={(value) => form.setValue('acquisitionSource', value as any)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="marketing">Marketing Campaign</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="repeat_customer">Repeat Customer</SelectItem>
                  <SelectItem value="trade_show">Trade Show</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Name (conditional) */}
            {form.watch('customerType') !== 'residential' && (
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-slate-700 dark:text-slate-300">
                  Business Name
                </Label>
                <Input 
                  id="businessName" 
                  placeholder="Enter business name"
                  {...form.register('businessName')}
                  className="border-slate-200 dark:border-slate-800"
                />
              </div>
            )}

            {/* Primary Contact */}
            <div className="space-y-2">
              <Label htmlFor="primaryContact" className="text-slate-700 dark:text-slate-300">
                Primary Contact Person
              </Label>
              <Input 
                id="primaryContact" 
                placeholder="Main contact person"
                {...form.register('primaryContact')}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Territory */}
            <div className="space-y-2">
              <Label htmlFor="territory" className="text-slate-700 dark:text-slate-300">
                Territory/Area
              </Label>
              <Input 
                id="territory" 
                placeholder="Geographic area or territory"
                {...form.register('territory')}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Preferred Communication */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Preferred Communication
              </Label>
              <Select value={form.watch('preferredCommunication')} onValueChange={(value) => form.setValue('preferredCommunication', value as any)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">
                Notes
              </Label>
              <Textarea 
                id="notes"
                placeholder="Additional notes or special requirements..."
                {...form.register('notes')}
                className="border-slate-200 dark:border-slate-800 min-h-20"
              />
            </div>
            
            <DialogFooter className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Customer
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