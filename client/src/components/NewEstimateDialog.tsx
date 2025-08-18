import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { DollarSign, Calculator, Clock, Package, Settings } from 'lucide-react'

const estimateFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft'),
  laborHours: z.string().default('0'),
  materialCosts: z.string().default('0'),
  equipmentCosts: z.string().default('0'),
  overheadPercentage: z.string().default('15'),
  profitMarginPercentage: z.string().default('20'),
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

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      title: `Estimate for ${leadName}`,
      description: '',
      status: 'draft',
      laborHours: '0',
      materialCosts: '0',
      equipmentCosts: '0',
      overheadPercentage: '15',
      profitMarginPercentage: '20',
      notes: '',
    },
  })

  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      // Convert string values to appropriate types
      const laborHours = parseFloat(data.laborHours) || 0
      const materialCosts = Math.round((parseFloat(data.materialCosts) || 0) * 100) // Convert to cents
      const equipmentCosts = Math.round((parseFloat(data.equipmentCosts) || 0) * 100) // Convert to cents
      const overheadPercentage = parseFloat(data.overheadPercentage) || 15
      const profitMarginPercentage = parseFloat(data.profitMarginPercentage) || 20

      // Calculate total cost
      const baseCosts = materialCosts + equipmentCosts + Math.round(laborHours * 7500) // $75/hour in cents
      const overheadAmount = Math.round(baseCosts * (overheadPercentage / 100))
      const subtotalWithOverhead = baseCosts + overheadAmount
      const profitAmount = Math.round(subtotalWithOverhead * (profitMarginPercentage / 100))
      const totalCents = subtotalWithOverhead + profitAmount

      const estimateData = {
        leadId,
        title: data.title,
        description: data.description || '',
        status: data.status,
        totalCents,
        laborHours: laborHours.toString(),
        materialCosts,
        equipmentCosts,
        overheadPercentage: overheadPercentage.toString(),
        profitMarginPercentage: profitMarginPercentage.toString(),
        notes: data.notes || '',
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

  // Calculate totals in real-time
  const watchedValues = form.watch()
  const laborHours = parseFloat(watchedValues.laborHours) || 0
  const materialCosts = parseFloat(watchedValues.materialCosts) || 0
  const equipmentCosts = parseFloat(watchedValues.equipmentCosts) || 0
  const overheadPercentage = parseFloat(watchedValues.overheadPercentage) || 15
  const profitMarginPercentage = parseFloat(watchedValues.profitMarginPercentage) || 20

  const laborCost = laborHours * 75 // $75/hour
  const baseCosts = materialCosts + equipmentCosts + laborCost
  const overheadAmount = baseCosts * (overheadPercentage / 100)
  const subtotalWithOverhead = baseCosts + overheadAmount
  const profitAmount = subtotalWithOverhead * (profitMarginPercentage / 100)
  const totalCost = subtotalWithOverhead + profitAmount

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

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cost Breakdown
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laborHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Labor Hours
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Labor Cost</Label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                    ${laborCost.toFixed(2)} (@ $75/hr)
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="materialCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Material Costs ($)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipmentCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Equipment Costs ($)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overheadPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profitMarginPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Margin (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
              <h3 className="text-lg font-semibold">Cost Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Costs:</span>
                  <span>${baseCosts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overhead ({overheadPercentage}%):</span>
                  <span>${overheadAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotalWithOverhead.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit ({profitMarginPercentage}%):</span>
                  <span>${profitAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
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