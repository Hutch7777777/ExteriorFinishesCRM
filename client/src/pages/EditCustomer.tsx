import React from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  fieldSupervisorId: z.string().optional(),
  // Enhanced reporting fields
  customerType: z.enum(['residential', 'commercial', 'government', 'property_management']).optional(),
  acquisitionSource: z.enum(['referral', 'website', 'marketing', 'cold_call', 'repeat_customer', 'trade_show', 'social_media', 'other']).optional(),
  businessName: z.string().optional(),
  primaryContact: z.string().optional(),
  secondaryContact: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  preferredCommunication: z.enum(['email', 'phone', 'text']).optional(),
  creditScore: z.number().optional(),
  paymentTerms: z.string().optional(),
  discountRate: z.string().optional(),
  territory: z.string().optional(),
  accountManager: z.string().optional(),
  lifetimeValueCents: z.number().optional(),
  averageProjectSize: z.number().optional(),
  projectCount: z.number().optional(),
  lastProjectDate: z.string().optional(),
  satisfactionRating: z.string().optional(),
  referralCount: z.number().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

type UpdateCustomerData = z.infer<typeof updateCustomerSchema>

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  fieldSupervisorId: string | null
  divisionId: string
  createdAt: string
  // Enhanced reporting fields
  customerType?: string
  acquisitionSource?: string
  businessName?: string | null
  primaryContact?: string | null
  secondaryContact?: string | null
  website?: string | null
  taxId?: string | null
  preferredCommunication?: string
  creditScore?: number | null
  paymentTerms?: string
  discountRate?: number
  territory?: string | null
  accountManager?: string | null
  lifetimeValueCents?: number
  averageProjectSize?: number
  projectCount?: number
  lastProjectDate?: string | null
  satisfactionRating?: number | null
  referralCount?: number
  isActive?: boolean
  tags?: string[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function EditCustomer() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const customerId = (params as any).id
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const form = useForm<UpdateCustomerData>({
    resolver: zodResolver(updateCustomerSchema),
  })

  // Fetch customer
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customers.getById', customerId],
    queryFn: () => trpcClient.customers.getById({ id: customerId }),
    retry: false,
    enabled: !!customerId,
  })

  // Fetch users for field supervisor selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users.list', division],
    queryFn: () => trpcClient.users.list({ divisionKey: division as 'mfnc' | 'sfnc' | 'rr' }),
    enabled: !!division,
  })

  // Set form values when customer data loads
  React.useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
        fieldSupervisorId: customer.fieldSupervisorId || 'none',
        // Enhanced reporting fields
        customerType: customer.customerType || 'residential',
        acquisitionSource: customer.acquisitionSource || 'other',
        businessName: customer.businessName || '',
        primaryContact: customer.primaryContact || '',
        secondaryContact: customer.secondaryContact || '',
        website: customer.website || '',
        taxId: customer.taxId || '',
        preferredCommunication: customer.preferredCommunication || 'email',
        creditScore: customer.creditScore || undefined,
        paymentTerms: customer.paymentTerms || 'net_30',
        discountRate: customer.discountRate || '0.00',
        territory: customer.territory || '',
        accountManager: customer.accountManager || '',
        lifetimeValueCents: customer.lifetimeValueCents || 0,
        averageProjectSize: customer.averageProjectSize || 0,
        projectCount: customer.projectCount || 0,
        lastProjectDate: customer.lastProjectDate ? new Date(customer.lastProjectDate).toISOString().split('T')[0] : '',
        satisfactionRating: customer.satisfactionRating || '',
        referralCount: customer.referralCount || 0,
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        tags: customer.tags || [],
      })
    }
  }, [customer, form])

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCustomerData) => {
      return trpcClient.customers.update({
        id: customerId,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
        fieldSupervisorId: data.fieldSupervisorId === 'none' ? null : data.fieldSupervisorId || undefined,
        // Enhanced reporting fields
        customerType: data.customerType,
        acquisitionSource: data.acquisitionSource,
        businessName: data.businessName || undefined,
        primaryContact: data.primaryContact || undefined,
        secondaryContact: data.secondaryContact || undefined,
        website: data.website || undefined,
        taxId: data.taxId || undefined,
        preferredCommunication: data.preferredCommunication,
        creditScore: data.creditScore,
        paymentTerms: data.paymentTerms,
        discountRate: data.discountRate,
        territory: data.territory || undefined,
        accountManager: data.accountManager || undefined,
        lifetimeValueCents: data.lifetimeValueCents,
        averageProjectSize: data.averageProjectSize,
        projectCount: data.projectCount,
        lastProjectDate: data.lastProjectDate ? new Date(data.lastProjectDate) : undefined,
        satisfactionRating: data.satisfactionRating,
        referralCount: data.referralCount,
        isActive: data.isActive,
        tags: data.tags,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers.list'] })
      queryClient.invalidateQueries({ queryKey: ['customers.getById', customerId] })
      toast({ title: 'Customer updated successfully' })
      window.location.href = `/${division}/customers`
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update customer',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/trpc/customers.delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: { id: customerId } })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete customer');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers.list'] })
      toast({ 
        title: 'Customer deleted successfully',
        description: 'The customer has been permanently removed.'
      })
      window.location.href = `/${division}/customers`
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete customer',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: UpdateCustomerData) => {
    updateMutation.mutate(data)
  }

  const handleBack = () => {
    window.location.href = `/${division}/customers`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Customer not found
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
        <h1 className="text-2xl font-semibold">Edit Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Update customer details for the {division.toUpperCase()} division
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Label htmlFor="fieldSupervisorId">Field Supervisor</Label>
              <Select 
                value={form.watch('fieldSupervisorId') || 'none'} 
                onValueChange={(value) => form.setValue('fieldSupervisorId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supervisor assigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Customer Type */}
            <div>
              <Label>Customer Type</Label>
              <Select 
                value={form.watch('customerType') || 'residential'} 
                onValueChange={(value) => form.setValue('customerType', value as any)}
              >
                <SelectTrigger>
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
            <div>
              <Label>How did they find us?</Label>
              <Select 
                value={form.watch('acquisitionSource') || 'other'} 
                onValueChange={(value) => form.setValue('acquisitionSource', value as any)}
              >
                <SelectTrigger>
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
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input 
                  id="businessName" 
                  {...form.register('businessName')}
                />
              </div>
            )}

            {/* Primary Contact */}
            <div>
              <Label htmlFor="primaryContact">Primary Contact Person</Label>
              <Input 
                id="primaryContact" 
                {...form.register('primaryContact')}
              />
            </div>

            {/* Secondary Contact */}
            <div>
              <Label htmlFor="secondaryContact">Secondary Contact</Label>
              <Input 
                id="secondaryContact" 
                {...form.register('secondaryContact')}
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                type="url"
                placeholder="https://example.com"
                {...form.register('website')}
              />
            </div>

            {/* Territory */}
            <div>
              <Label htmlFor="territory">Territory/Area</Label>
              <Input 
                id="territory" 
                {...form.register('territory')}
              />
            </div>

            {/* Preferred Communication */}
            <div>
              <Label>Preferred Communication</Label>
              <Select 
                value={form.watch('preferredCommunication') || 'email'} 
                onValueChange={(value) => form.setValue('preferredCommunication', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credit Score */}
            <div>
              <Label htmlFor="creditScore">Credit Score</Label>
              <Input 
                id="creditScore" 
                type="number"
                min="300"
                max="850"
                {...form.register('creditScore', { valueAsNumber: true })}
              />
            </div>

            {/* Payment Terms */}
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input 
                id="paymentTerms" 
                placeholder="e.g., Net 30, COD"
                {...form.register('paymentTerms')}
              />
            </div>

            {/* Discount Rate */}
            <div>
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <Input 
                id="discountRate" 
                type="text"
                placeholder="0.00"
                {...form.register('discountRate')}
              />
            </div>

            {/* Lifetime Value */}
            <div>
              <Label htmlFor="lifetimeValueCents">Lifetime Value ($)</Label>
              <Input 
                id="lifetimeValueCents" 
                type="number"
                min="0"
                step="0.01"
                {...form.register('lifetimeValueCents', { valueAsNumber: true })}
              />
            </div>

            {/* Average Project Size */}
            <div>
              <Label htmlFor="averageProjectSize">Average Project Size ($)</Label>
              <Input 
                id="averageProjectSize" 
                type="number"
                min="0"
                step="0.01"
                {...form.register('averageProjectSize', { valueAsNumber: true })}
              />
            </div>

            {/* Project Count */}
            <div>
              <Label htmlFor="projectCount">Total Projects</Label>
              <Input 
                id="projectCount" 
                type="number"
                min="0"
                {...form.register('projectCount', { valueAsNumber: true })}
              />
            </div>

            {/* Last Project Date */}
            <div>
              <Label htmlFor="lastProjectDate">Last Project Date</Label>
              <Input 
                id="lastProjectDate" 
                type="date"
                {...form.register('lastProjectDate')}
              />
            </div>

            {/* Satisfaction Rating */}
            <div>
              <Label htmlFor="satisfactionRating">Satisfaction Rating (1-5)</Label>
              <Input 
                id="satisfactionRating" 
                type="text"
                placeholder="5.0"
                {...form.register('satisfactionRating')}
              />
            </div>

            {/* Referral Count */}
            <div>
              <Label htmlFor="referralCount">Referrals Made</Label>
              <Input 
                id="referralCount" 
                type="number"
                min="0"
                {...form.register('referralCount', { valueAsNumber: true })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isActive"
                {...form.register('isActive')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active Customer</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                {...form.register('notes')}
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
              </div>
              
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{customer?.name}"? This action cannot be undone and will permanently remove the customer and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}