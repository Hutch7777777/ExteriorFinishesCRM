import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Calculator, Upload, UserCheck } from 'lucide-react'

const estimateFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft'),
  estimatorId: z.string().min(1, 'Estimator is required'),
  importData: z.string().optional(),
  notes: z.string().optional(),
})

type EstimateFormData = z.infer<typeof estimateFormSchema>

interface NewEstimateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
}

export function NewEstimateDialog({ open, onOpenChange, leadId, leadName }: NewEstimateDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users for estimator assignment
  const { data: users = [] } = useQuery({
    queryKey: ['/api/trpc/users.list'],
  })

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      title: `Estimate for ${leadName}`,
      description: '',
      status: 'draft',
      estimatorId: '',
      importData: '',
      notes: '',
    },
  })

  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const estimateData = {
        leadId,
        title: data.title,
        description: data.description || '',
        status: data.status,
        totalCents: 0, // Start at 0 - will be updated after import/estimation
        laborHours: '0',
        materialCosts: 0,
        equipmentCosts: 0,
        overheadPercentage: '15',
        profitMarginPercentage: '20',
        notes: data.notes || '',
        estimatorId: data.estimatorId,
        importData: data.importData || '',
        // The estimatedBy field will be set on the server side from the authenticated user
      }

      const res = await fetch('/api/trpc/estimates.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: estimateData })
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
      // Invalidate both the lead-specific estimates and the general estimates list
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/estimates.getByLeadId', leadId] })
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/estimates.list'] })
      onOpenChange(false)
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

  const onSubmit = async (data: EstimateFormData) => {
    setIsSubmitting(true)
    try {
      await createEstimateMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            New Estimate
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter estimate title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the scope of work" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimator Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Assign Estimator
              </h3>
              
              <FormField
                control={form.control}
                name="estimatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimator</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an estimator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(users as any[]).map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Import Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Information
              </h3>
              
              <FormField
                control={form.control}
                name="importData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Import Data</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste or type information to import (measurements, materials, specifications, etc.)" 
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground">
                      You can paste data from spreadsheets, measurements from plans, or any other relevant information here.
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes or special considerations" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Estimate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}