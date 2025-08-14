import React from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  User,
  Edit,
  Building
} from 'lucide-react'

export default function LeadDetail() {
  const params = useParams({ strict: false })
  const leadId = (params as any).id
  const division = (params as any).division || 'mfnc'
  const { user } = useAuth()

  // Fetch the actual lead data
  const { 
    data: lead, 
    isLoading: leadLoading, 
    error: leadError 
  } = useQuery({
    queryKey: ['/api/trpc/leads.get', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await fetch(`/api/trpc/leads.get?id=${leadId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch lead: ${res.statusText}`);
      }
      const data = await res.json();
      return data.result?.json || data.result;
    },
    enabled: !!leadId,
    retry: false
  })

  console.log('LeadDetail - leadId:', leadId, 'division:', division);
  console.log('LeadDetail - lead data:', lead);
  console.log('LeadDetail - error:', leadError);

  // Status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'qualified': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'proposal': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'negotiation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'won': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'lost': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  if (leadLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (leadError || !lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Lead Not Found</h2>
          <p className="text-slate-600 mb-4">The lead you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              console.log('Button clicked, navigating to:', `/${division}/lead-management`);
              window.location.href = `/${division}/lead-management`;
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Management
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              console.log('Back to Pipeline clicked, navigating to:', `/${division}/lead-management`);
              window.location.href = `/${division}/lead-management`;
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {lead.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{lead.contact}</p>
          </div>
          <Badge className={getStatusColor(lead.status)}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.location.href = `/${division}/estimates`}
          >
            <DollarSign className="w-4 h-4" />
            Build Estimate
          </Button>
          <Button className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Lead
          </Button>
        </div>

        {/* Lead Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Lead Value</p>
                  <p className="text-xl font-semibold">${(lead.value / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Close Probability</p>
                  <p className="text-xl font-semibold">
                    {lead.status === 'won' ? '100%' :
                     lead.status === 'lost' ? '0%' :
                     lead.status === 'negotiation' ? '80%' :
                     lead.status === 'proposal' ? '60%' :
                     lead.status === 'qualified' ? '40%' :
                     lead.status === 'contacted' ? '20%' : '10%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Days Active</p>
                  <p className="text-xl font-semibold">
                    {Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Assigned To</p>
                  <p className="text-xl font-semibold">{lead.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {lead.contact.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{lead.contact}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{lead.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Project Type</p>
                    <p className="font-medium">{lead.projectType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
                    <p className="font-medium">{lead.timeline || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Budget Range</p>
                    <p className="font-medium">${(lead.value / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lead Source</p>
                    <p className="font-medium">{lead.source || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lead.notes ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm">{lead.notes}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Added on {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No notes available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}