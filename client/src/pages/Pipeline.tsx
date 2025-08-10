import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { trpcClient } from '@/lib/trpc'
import { Plus, DollarSign, Calendar, User } from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  value: number
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  source: string
  notes: string
  createdAt: string
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Leads', color: 'bg-blue-100 text-blue-800', count: 0 },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800', count: 0 },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800', count: 0 },
  { key: 'proposal', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-800', count: 0 },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-red-100 text-red-800', count: 0 },
  { key: 'won', label: 'Won', color: 'bg-green-100 text-green-800', count: 0 },
  { key: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-800', count: 0 },
]

export default function Pipeline() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data for demonstration - in real app this would come from API
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'John Smith',
      company: 'Smith Enterprises',
      email: 'john@smithent.com',
      phone: '(555) 123-4567',
      value: 25000,
      status: 'new',
      source: 'Website',
      notes: 'Interested in siding renovation for office building',
      createdAt: '2025-01-08'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      company: 'Johnson Properties',
      email: 'sarah@johnsonprop.com',
      phone: '(555) 234-5678',
      value: 45000,
      status: 'contacted',
      source: 'Referral',
      notes: 'Multi-unit residential project, very interested',
      createdAt: '2025-01-07'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      company: 'Wilson Construction',
      email: 'mike@wilsonconst.com',
      phone: '(555) 345-6789',
      value: 75000,
      status: 'proposal',
      source: 'Cold Call',
      notes: 'Large commercial project, proposal sent last week',
      createdAt: '2025-01-05'
    }
  ]

  const leads = mockLeads

  // Calculate stage counts
  const stagesWithCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(lead => lead.status === stage.key).length,
    value: leads
      .filter(lead => lead.status === stage.key)
      .reduce((sum, lead) => sum + lead.value, 0)
  }))

  const totalPipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Sales Pipeline
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track leads through your sales process and manage opportunities
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {leads.length} opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.filter(l => !['won', 'lost'].includes(l.status)).length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.value, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {leads.filter(l => l.status === 'won').length} deals closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">
              Lead to customer rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stagesWithCounts.map((stage) => (
          <div key={stage.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                {stage.label}
              </h3>
              <Badge variant="secondary" className={stage.color}>
                {stage.count}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {leads
                .filter(lead => lead.status === stage.key)
                .map((lead) => (
                  <Card key={lead.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-50">
                        {lead.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {lead.company}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(lead.value)}
                        </span>
                      </div>
                      {lead.notes && (
                        <div className="text-xs text-slate-500 line-clamp-2">
                          {lead.notes}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
            
            {stage.count > 0 && (
              <div className="text-xs text-slate-500 font-medium">
                Total: {formatCurrency(stage.value)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Add New Lead
            </DialogTitle>
            <DialogDescription>
              Add a new lead to your sales pipeline to start tracking the opportunity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input id="name" placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="ABC Corp" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="(555) 123-4567" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Estimated Value</Label>
                <Input id="value" type="number" placeholder="25000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold-call">Cold Call</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="trade-show">Trade Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional information about this lead..."
                className="min-h-20"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}