import React, { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Building,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Check,
  X,
  MessageSquare
} from 'lucide-react'

export default function LeadDetail() {
  const params = useParams({ strict: false })
  const leadId = (params as any).id
  const division = (params as any).division || 'mfnc'
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const res = await fetch('/api/trpc/leads.update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          input: { 
            id: leadId, 
            ...updateData 
          } 
        })
      })
      if (!res.ok) throw new Error('Failed to update lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/leads.get'] })
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/leads.list'] })
      setEditingField(null)
      setEditValues({})
    }
  })



  // Handle field editing
  const startEdit = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName)
    setEditValues({ [fieldName]: currentValue })
  }

  const saveEdit = () => {
    if (editingField && editValues[editingField] !== undefined) {
      updateLeadMutation.mutate(editValues)
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValues({})
  }

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

  // Mock weather data - in a real app, this would come from a weather API
  const weatherData = {
    current: {
      temp: 71,
      condition: 'sunny',
      humidity: 41,
      icon: Sun
    },
    forecast: [
      { day: 'NOW', temp: 71, condition: 'sunny', icon: Sun, humidity: 41 },
      { day: '3PM', temp: 73, condition: 'sunny', icon: Sun, humidity: 44 },
      { day: '4PM', temp: 74, condition: 'cloudy', icon: Cloud, humidity: 44 },
      { day: '5PM', temp: 74, condition: 'cloudy', icon: Cloud, humidity: 44 },
      { day: '6PM', temp: 73, condition: 'cloudy', icon: Cloud, humidity: 17 },
      { day: '7PM', temp: 70, condition: 'cloudy', icon: Cloud, humidity: 17 },
      { day: '8PM', temp: 67, condition: 'cloudy', icon: Cloud, humidity: 23 }
    ],
    weekly: [
      { day: 'FRI', high: 70, low: 61, condition: 'rainy', icon: CloudRain, chance: 85 },
      { day: 'SAT', high: 73, low: 60, condition: 'rainy', icon: CloudRain, chance: 85 },
      { day: 'SUN', high: 73, low: 57, condition: 'cloudy', icon: Cloud, chance: 17 },
      { day: 'MON', high: 72, low: 58, condition: 'cloudy', icon: Cloud, chance: 17 },
      { day: 'TUE', high: 73, low: 58, condition: 'cloudy', icon: Cloud, chance: 23 },
      { day: 'WED', high: 73, low: 57, condition: 'sunny', icon: Sun, chance: 12 },
      { day: 'THU', high: 76, low: 58, condition: 'sunny', icon: Sun, chance: 12 }
    ]
  };

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

        {/* Compact Location & Weather Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Location Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 w-12 h-12 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Job Location</p>
                    <p className="text-xs text-slate-600">
                      {lead.address ? lead.address.split(',')[0] : '2801 SW Nevada St'}
                    </p>
                  </div>
                </div>
                
                {/* Weather Section */}
                <div className="flex items-center gap-3 border-l pl-4">
                  <weatherData.current.icon className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="text-sm font-bold">{weatherData.current.temp}°F</p>
                    <p className="text-xs text-slate-600">Sunny</p>
                  </div>
                </div>

                {/* Today's Forecast */}
                <div className="flex items-center gap-2 border-l pl-4">
                  {weatherData.forecast.slice(0, 4).map((hour, index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs text-slate-600">{hour.day}</p>
                      <hour.icon className="w-3 h-3 mx-auto my-1 text-blue-500" />
                      <p className="text-xs font-medium">{hour.temp}°</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Rate & Action */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Tax Rate: 10.35%</span>
                <Button variant="outline" size="sm" className="text-xs">
                  Directions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {/* Contact Name */}
                  <div className="flex items-center gap-2 group">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {lead.contact.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'contact' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editValues.contact || ''}
                            onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, contact: e.target.value }))}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{lead.contact}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('contact', lead.contact)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 group">
                    <Mail className="w-4 h-4" />
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'email' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="email"
                            value={editValues.email || ''}
                            onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, email: e.target.value }))}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span>{lead.email || 'No email'}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('email', lead.email || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 group">
                    <Phone className="w-4 h-4" />
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'phone' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="tel"
                            value={editValues.phone || ''}
                            onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, phone: e.target.value }))}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span>{lead.phone || 'No phone'}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('phone', lead.phone || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 group">
                    <MapPin className="w-4 h-4" />
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'address' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editValues.address || ''}
                            onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, address: e.target.value }))}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span>{lead.address || 'No address'}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('address', lead.address || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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
                  {/* Project Type */}
                  <div className="group">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Project Type</p>
                    <div className="flex items-center gap-2">
                      {editingField === 'projectType' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select 
                            value={editValues.projectType || ''} 
                            onValueChange={(value) => setEditValues((prev: Record<string, any>) => ({ ...prev, projectType: value }))}
                          >
                            <SelectTrigger className="h-7">
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Residential Renovation">Residential Renovation</SelectItem>
                              <SelectItem value="Commercial Siding">Commercial Siding</SelectItem>
                              <SelectItem value="New Construction">New Construction</SelectItem>
                              <SelectItem value="Repair Work">Repair Work</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium flex-1">{lead.projectType || 'Not specified'}</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('projectType', lead.projectType || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="group">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
                    <div className="flex items-center gap-2">
                      {editingField === 'timeline' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select 
                            value={editValues.timeline || ''} 
                            onValueChange={(value) => setEditValues((prev: Record<string, any>) => ({ ...prev, timeline: value }))}
                          >
                            <SelectTrigger className="h-7">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-3 months">1-3 months</SelectItem>
                              <SelectItem value="3-6 months">3-6 months</SelectItem>
                              <SelectItem value="6-12 months">6-12 months</SelectItem>
                              <SelectItem value="1+ years">1+ years</SelectItem>
                              <SelectItem value="Flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium flex-1">{lead.timeline || 'Not specified'}</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('timeline', lead.timeline || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="group">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Budget Range</p>
                    <div className="flex items-center gap-2">
                      {editingField === 'value' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            value={editValues.value ? editValues.value / 100 : ''}
                            onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, value: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                            className="h-7 text-sm"
                            placeholder="Enter amount"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium flex-1">${(lead.value / 100).toLocaleString()}</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('value', lead.value)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lead Source */}
                  <div className="group">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lead Source</p>
                    <div className="flex items-center gap-2">
                      {editingField === 'source' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select 
                            value={editValues.source || ''} 
                            onValueChange={(value) => setEditValues((prev: Record<string, any>) => ({ ...prev, source: value }))}
                          >
                            <SelectTrigger className="h-7">
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Google Ads">Google Ads</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Trade Show">Trade Show</SelectItem>
                              <SelectItem value="Direct Mail">Direct Mail</SelectItem>
                              <SelectItem value="Cold Call">Cold Call</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium flex-1">{lead.source || 'Not specified'}</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => startEdit('source', lead.source || '')}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Notes</span>
                  {!editingField && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEdit('notes', lead.notes || '')}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Add Note
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {editingField === 'notes' ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editValues.notes || ''}
                        onChange={(e) => setEditValues((prev: Record<string, any>) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add notes about this lead..."
                        className="min-h-[120px]"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-3 h-3 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                          <Check className="w-3 h-3 mr-2" />
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {lead.notes ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                          <p className="text-sm">{lead.notes}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                              Last updated on {new Date(lead.updatedAt || lead.createdAt).toLocaleDateString()} at {new Date(lead.updatedAt || lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() => startEdit('notes', lead.notes || '')}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                          <p className="text-slate-500 text-sm mb-4">No notes available</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEdit('notes', '')}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-3 h-3" />
                            Add Note
                          </Button>
                        </div>
                      )}
                    </>
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