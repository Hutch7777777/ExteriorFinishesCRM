import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const leadSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contact: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  value: z.number().min(0, 'Estimated value must be positive'),
  source: z.string().min(1, 'Lead source is required'),
  projectType: z.string().min(1, 'Project type is required'),
  timeline: z.string().min(1, 'Timeline is required'),
  budget: z.string().min(1, 'Budget range is required'),
  notes: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface AddLeadDialogProps {
  children: React.ReactNode
  onLeadAdded?: (lead: any) => void
}

export function AddLeadDialog({ children, onLeadAdded }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      value: 0,
      source: '',
      projectType: '',
      timeline: '',
      budget: '',
      notes: '',
    },
  })

  // Since we're using mock data for leads, we'll simulate creating a lead
  // In a real implementation, this would create a lead in the database
  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // For now, we'll create a customer in the database and return mock lead data
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        addressJson: { address: data.address },
        notes: data.notes || '',
        divisionKey: division,
      }
      
      // Create customer in database
      await apiRequest('/api/trpc/customers.create', {
        method: 'POST',
        body: { input: customerData },
      })

      // Return mock lead data for the pipeline
      const newLead = {
        id: Date.now().toString(), // Temporary ID
        name: data.name,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: 'lead', // Always starts in first stage
        value: data.value,
        source: data.source,
        projectType: data.projectType,
        timeline: data.timeline,
        budget: data.budget,
        createdAt: new Date().toISOString().split('T')[0],
        nextAction: 'Initial contact made',
        notes: data.notes || '',
      }
      
      return newLead
    },
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Success',
        description: 'Lead added successfully to the pipeline',
      })
      setOpen(false)
      form.reset()
      
      // Call the callback to update the parent component
      if (onLeadAdded) {
        onLeadAdded(newLead)
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lead',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data)
  }

  const leadSources = [
    'Website',
    'Referral', 
    'Cold Call',
    'Trade Show',
    'Social Media',
    'Google Search',
    'Print Ad',
    'Direct Mail',
    'Word of Mouth',
    'Partner/Vendor',
    'Other'
  ]

  const projectTypes = [
    'New Construction',
    'Commercial Renovation', 
    'Residential Renovation',
    'Repair & Maintenance',
    'Industrial Project',
    'Multi-Family Complex',
    'Retail/Office Building',
    'Warehouse/Storage',
    'Other'
  ]

  const timelineOptions = [
    'ASAP',
    'Within 30 days',
    '1-3 months',
    '3-6 months', 
    '6+ months',
    'TBD'
  ]

  const budgetRanges = [
    'Under $50k',
    '$50k - $100k',
    '$100k - $200k',
    '$200k - $500k',
    '$500k+',
    'TBD'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead that will be added to your sales pipeline
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company and Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Business Ave, City, ST 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="150000" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timelineOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lead Source */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information about this lead..."
                      className="min-h-[100px]"
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
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? 'Adding Lead...' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}