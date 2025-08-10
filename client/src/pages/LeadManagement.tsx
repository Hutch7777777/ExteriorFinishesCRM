import { useState } from 'react'
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

// Mock data for demonstration
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

  // Summary stats
  const stats = {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    proposalsSent: proposals.filter(p => p.status === 'sent').length,
    activeContracts: contracts.filter(c => c.status === 'signed').length,
    pipelineValue: leads.reduce((sum, lead) => sum + lead.value, 0),
    proposalValue: proposals.reduce((sum, prop) => sum + prop.value, 0)
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
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
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
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
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
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
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
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-yellow-600" />
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
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-purple-600" />
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
          <KanbanBoard />
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Proposal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-50">{proposal.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {proposal.client}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${proposal.value.toLocaleString()}
                          </span>
                          {proposal.sentDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Sent {new Date(proposal.sentDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
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
                ))}
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