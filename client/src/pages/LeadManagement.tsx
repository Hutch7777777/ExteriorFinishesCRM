import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  FileText, 
  FileCheck,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import KanbanBoard from '@/components/KanbanBoard'
import { CreateProposalDialog } from '@/components/CreateProposalDialog'
import { AddLeadDialog } from '@/components/AddLeadDialog'

// Mock data for demonstration - will be managed as state
const mockLeads = [
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
    assignedTo: 'Sarah Johnson',
    avatar: 'SJ',
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
    assignedTo: 'Mike Chen',
    avatar: 'MC',
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
    assignedTo: 'John Smith',
    avatar: 'JS',
    notes: 'Budget constraints, looking for cost-effective solutions'
  }
]

const proposals = [
  {
    id: '1',
    title: 'Acme Corporation - Exterior Renovation',
    client: 'Acme Corporation',
    value: 150000,
    status: 'sent',
    sentDate: '2025-01-07',
    expiryDate: '2025-01-21',
    progress: 'awaiting_response'
  },
  {
    id: '2',
    title: 'Downtown Apartments - Siding Replacement',
    client: 'Downtown Apartments',
    value: 250000,
    status: 'draft',
    createdDate: '2025-01-06',
    expiryDate: '2025-01-20',
    progress: 'in_preparation'
  },
  {
    id: '3',
    title: 'Tech Startup HQ - Modern Facade',
    client: 'Tech Startup HQ',
    value: 85000,
    status: 'approved',
    sentDate: '2025-01-02',
    approvedDate: '2025-01-05',
    progress: 'contract_ready'
  }
]

const contracts = [
  {
    id: '1',
    title: 'Tech Startup HQ - Modern Facade Contract',
    client: 'Tech Startup HQ',
    value: 85000,
    status: 'signed',
    signedDate: '2025-01-06',
    startDate: '2025-01-15',
    endDate: '2025-03-15',
    progress: 'active'
  },
  {
    id: '2',
    title: 'Metro Office Building - Renovation Contract',
    client: 'Metro Office Building',
    value: 320000,
    status: 'draft',
    createdDate: '2025-01-04',
    startDate: '2025-02-01',
    endDate: '2025-05-01',
    progress: 'pending_signature'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'lead': return 'bg-gray-100 text-gray-800'
    case 'contacted': return 'bg-blue-100 text-blue-800'
    case 'qualified': return 'bg-green-100 text-green-800'
    case 'proposal': return 'bg-yellow-100 text-yellow-800'
    case 'negotiation': return 'bg-orange-100 text-orange-800'
    case 'won': return 'bg-emerald-100 text-emerald-800'
    case 'lost': return 'bg-red-100 text-red-800'
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'sent': return 'bg-blue-100 text-blue-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    case 'signed': return 'bg-emerald-100 text-emerald-800'
    case 'active': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function LeadManagement() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const division = (params as any).division || 'mfnc'
  const [activeTab, setActiveTab] = useState('pipeline')
  // Check authentication status
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['/api/trpc/auth.me'],
    queryFn: () => apiRequest('GET', '/api/trpc/auth.me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch leads for the current division
  const { data: leadsData = [], isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['/api/trpc/leads.list', division],
    queryFn: () => apiRequest('GET', `/api/trpc/leads.list?divisionKey=${division}`),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000,
    select: (data: any) => data?.result?.json || []
  })

  // Use real leads data from API, fallback to mock data for development
  const [localLeads, setLocalLeads] = useState(mockLeads)
  const realLeads = leadsData || []
  const leads = realLeads.length > 0 ? realLeads : localLeads

  // Function to handle adding new leads to the pipeline
  const handleLeadAdded = (newLead: any) => {
    if (realLeads.length > 0) {
      // If using real data, the query will refetch automatically
      // We could also optimistically update the cache here
    } else {
      // If using mock data, update local state
      setLocalLeads(prevLeads => [newLead, ...prevLeads])
    }
  }

  // Fetch proposals for the current division
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', division],
    queryFn: () => apiRequest('GET', `/api/trpc/proposals.list?divisionKey=${division}`),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000,
    select: (data: any) => data?.result?.json || []
  })

  // Summary stats
  const proposalsArray = Array.isArray(proposals) ? proposals : []
  const stats = {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    proposalsSent: proposalsArray.filter((p: any) => p.status === 'sent').length,
    activeContracts: contracts.filter(c => c.status === 'signed').length,
    pipelineValue: leads.reduce((sum, lead) => sum + lead.value, 0),
    proposalValue: proposalsArray.reduce((sum: number, prop: any) => sum + (prop.baseCostCents / 100), 0)
  }

  // Show authentication required message if user is not logged in
  if (userError && !user && !userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Authentication Required
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Please log in to access the lead management system.
          </p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#2C3E50] hover:to-[#1A252F] text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Lead Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your sales pipeline, proposals, and contracts for {division.toUpperCase()} division
            {leadsError && (
              <span className="block text-red-600 text-sm mt-1">
                Error loading leads: {leadsError.message || 'Failed to fetch leads'}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <AddLeadDialog onLeadAdded={handleLeadAdded}>
            <Button className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#2C3E50] hover:to-[#1A252F] text-white shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </AddLeadDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Leads</p>
                <p className="text-2xl font-semibold">{stats.totalLeads}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-[#A8C8EC] to-[#8BB5E8] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[#2C3E50]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pipeline Value</p>
                <p className="text-2xl font-semibold">${stats.pipelineValue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-[#D4E4F7] to-[#A8C8EC] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#4A6FA5]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Proposals</p>
                <p className="text-2xl font-semibold">{stats.proposalsSent}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-[#A8C8EC] to-[#8BB5E8] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#4A6FA5]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Contracts</p>
                <p className="text-2xl font-semibold">{stats.activeContracts}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-[#8BB5E8] to-[#6FA3E0] rounded-lg flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-[#2C3E50]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <KanbanBoard leads={leads} onLeadAdded={handleLeadAdded} />
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proposals</CardTitle>
                  <CardDescription>Create and manage project proposals</CardDescription>
                </div>
                <CreateProposalDialog>
                  <Button className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#2C3E50] hover:to-[#1A252F] text-white shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                </CreateProposalDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposalsLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading proposals...</div>
                ) : proposalsArray.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No proposals found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Create your first proposal to get started
                    </p>
                    <CreateProposalDialog>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Proposal
                      </Button>
                    </CreateProposalDialog>
                  </div>
                ) : (
                  proposalsArray.map((proposal: any) => (
                    <div key={proposal.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-50">{proposal.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {proposal.homeowner}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${(proposal.baseCostCents / 100).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(proposal.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate({ to: `/${division}/proposal/${proposal.id}` })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contracts</CardTitle>
                  <CardDescription>Manage project contracts and agreements</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-50">{contract.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {contract.client}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${contract.value.toLocaleString()}
                          </span>
                          {contract.startDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}