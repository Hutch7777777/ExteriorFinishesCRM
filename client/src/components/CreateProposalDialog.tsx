import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'

const proposalSchema = z.object({
  customerId: z.string().min(1, 'Lead is required'),
  title: z.string().min(1, 'Title is required'),
  homeowner: z.string().min(1, 'Homeowner name is required'),
  address: z.string().min(1, 'Address is required'),
  validDays: z.number().min(1).max(365).default(60),
  projectDescription: z.string().min(1, 'Project description is required'),
  baseCostCents: z.number().min(0, 'Base cost must be positive'),
  projectInclusions: z.array(z.string()).default([]),
  projectExclusions: z.array(z.string()).default([]),
  baseExclusions: z.array(z.string()).default([]),
  options: z.array(z.object({
    name: z.string().min(1, 'Option name is required'),
    description: z.string().min(1, 'Option description is required'),
    costCents: z.number().min(0, 'Option cost must be positive'),
  })).default([]),
  insuranceLimits: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type ProposalFormData = z.infer<typeof proposalSchema>

interface CreateProposalDialogProps {
  children: React.ReactNode
}

export function CreateProposalDialog({ children }: CreateProposalDialogProps) {
  const [open, setOpen] = useState(false)
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Use leads from the pipeline instead of customers
  // Mock leads data matching the pipeline
  const leads = [
    {
      id: '1',
      name: 'Acme Corporation',
      contact: 'John Smith',
      email: 'john@acme.com',
      phone: '(555) 123-4567',
      status: 'qualified',
      value: 150000,
      source: 'Website',
      createdAt: '2025-01-08',
      nextAction: 'Send proposal',
      notes: 'Interested in siding renovation for 5-story building'
    },
    {
      id: '2',
      name: 'Downtown Apartments',
      contact: 'Sarah Johnson',
      email: 'sarah@downtown.com',
      phone: '(555) 987-6543',
      status: 'proposal',
      value: 250000,
      source: 'Referral',
      createdAt: '2025-01-05',
      nextAction: 'Follow up on proposal',
      notes: 'Large residential complex, decision expected this week'
    },
    {
      id: '3',
      name: 'Tech Startup HQ',
      contact: 'Mike Chen',
      email: 'mike@techstartup.com',
      phone: '(555) 456-7890',
      status: 'negotiation',
      value: 85000,
      source: 'Cold Call',
      createdAt: '2025-01-03',
      nextAction: 'Schedule site visit',
      notes: 'Budget constraints, looking for cost-effective solutions'
    },
    {
      id: '4',
      name: 'Retail Plaza LLC',
      contact: 'Lisa Brown',
      email: 'lisa@retailplaza.com',
      phone: '(555) 234-5678',
      status: 'contacted',
      value: 180000,
      source: 'Trade Show',
      createdAt: '2025-01-10',
      nextAction: 'Send information packet',
      notes: 'Shopping center renovation project'
    },
    {
      id: '5',
      name: 'Manufacturing Co',
      contact: 'David Wilson',
      email: 'david@manufacturing.com',
      phone: '(555) 345-6789',
      status: 'lead',
      value: 120000,
      source: 'Cold Call',
      createdAt: '2025-01-12',
      nextAction: 'Initial contact made',
      notes: 'Industrial facility siding replacement'
    }
  ]

  // Filter leads that are ready for proposals (qualified, proposal, or negotiation stages)
  const proposalReadyLeads = leads.filter(lead => 
    ['qualified', 'proposal', 'negotiation'].includes(lead.status)
  )

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      customerId: '',
      title: '',
      homeowner: '',
      address: '',
      validDays: 60,
      projectDescription: '',
      baseCostCents: 0,
      projectInclusions: [
        'Complete Removal of Existing Siding',
        'Inspection of Substrate',
        'Weather Barrier Installation',
        'Flashing & Waterproofing',
        'Siding Installation',
        'Trim Details',
        'Caulking and Sealing',
        'Fasteners & Accessories',
        'Final Clean-Up'
      ],
      projectExclusions: [
        'Gutters',
        'Fascia',
        'Roofing'
      ],
      baseExclusions: [
        'Special OCIP requirements, prevailing/special wages (unless specified), permits, testing of any kind.',
        'All exterior insulation and girt systems.',
        'Cranes, forklift, scaffolding, flaggers, traffic control for material delivery, certified riggers.',
        'Supply or install of gutters/downspouts.',
        'Roof scoped work beyond siding including scuppers, venting and coping.',
        'All work that goes below grade.',
        'WSST or retentions greater than 5%.'
      ],
      options: [],
      insuranceLimits: 'GL-$1,000,000, GA-$2,000,000.00\nUmbrella Liability- EO-$2,000,000, Aggregate $2,000,000\nCopy Of insurance certificate available upon request.',
      additionalNotes: 'Exterior Finishes would like to thank you for the opportunity to quote your upcoming project. Please do not hesitate to contact us if you have any questions or concerns.',
    },
  })

  const createProposalMutation = useMutation({
    mutationFn: (data: ProposalFormData) => 
      apiRequest('POST', '/api/trpc/proposals.create', { 
        input: { ...data, divisionKey: division } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast({
        title: 'Success',
        description: 'Proposal created successfully',
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ProposalFormData) => {
    createProposalMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Create a professional proposal with Lake Stevens Grange formatting
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proposalReadyLeads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} - {lead.contact}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lake Stevens Grange Siding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="homeowner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Homeowner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Robin King" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Days</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address</FormLabel>
                  <FormControl>
                    <Input placeholder="2109 103rd Ave SE, Lake Stevens, WA 98258" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exterior Finishes have included Material and Labor to replace the entirety of the Lake Stevens Grange Siding."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Base Cost */}
            <FormField
              control={form.control}
              name="baseCostCents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="pl-7"
                        placeholder="46,260.00"
                        {...field} 
                        value={field.value / 100}
                        onChange={(e) => field.onChange(Math.round((parseFloat(e.target.value) || 0) * 100))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProposalMutation.isPending}>
                {createProposalMutation.isPending ? 'Creating...' : 'Create Proposal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}