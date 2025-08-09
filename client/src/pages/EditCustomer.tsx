import React from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type UpdateCustomerData = z.infer<typeof updateCustomerSchema>

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  divisionId: string
  createdAt: string
}

export default function EditCustomer() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const customerId = (params as any).id
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  // Set form values when customer data loads
  React.useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                {...form.register('notes')}
              />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Customer'}
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}