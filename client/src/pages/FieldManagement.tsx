import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Users, 
  Cloud, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Calendar,
  FileText,
  Wrench
} from 'lucide-react';

export default function FieldManagement() {
  const [match, params] = useRoute('/:division/field-management/:jobId?');
  const [activeTab, setActiveTab] = useState('overview');
  const [newLogData, setNewLogData] = useState({
    title: '',
    description: '',
    logType: 'progress',
    weatherConditions: '',
    hoursWorked: '',
    crewMembers: []
  });
  const [newPunchItem, setNewPunchItem] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const division = params?.division;
  const jobId = params?.jobId;

  // Fetch jobs for selection if no jobId in URL
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/trpc/jobs.list', division],
    queryFn: () => apiRequest('/api/trpc/jobs.list', { 
      method: 'GET',
      params: { divisionKey: division, status: 'in_progress' }
    }),
    enabled: !!division && !jobId
  });

  // Fetch job details
  const { data: job } = useQuery({
    queryKey: ['/api/trpc/jobs.get', jobId],
    queryFn: () => apiRequest('/api/trpc/jobs.get', {
      method: 'GET', 
      params: { id: jobId }
    }),
    enabled: !!jobId
  });

  // Fetch field logs
  const { data: fieldLogs = [] } = useQuery({
    queryKey: ['/api/trpc/fieldLogs.list', jobId],
    queryFn: () => apiRequest('/api/trpc/fieldLogs.list', {
      method: 'GET',
      params: { jobId }
    }),
    enabled: !!jobId
  });

  // Fetch punch list items
  const { data: punchListItems = [] } = useQuery({
    queryKey: ['/api/trpc/punchListItems.list', jobId],
    queryFn: () => apiRequest('/api/trpc/punchListItems.list', {
      method: 'GET',
      params: { jobId }
    }),
    enabled: !!jobId
  });

  // Create field log mutation
  const createFieldLogMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/trpc/fieldLogs.create', {
      method: 'POST',
      body: { input: data }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/fieldLogs.list', jobId] });
      setNewLogData({ title: '', description: '', logType: 'progress', weatherConditions: '', hoursWorked: '', crewMembers: [] });
      toast({ title: 'Log created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error creating log', description: error.message, variant: 'destructive' });
    }
  });

  // Create punch list item mutation
  const createPunchItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/trpc/punchListItems.create', {
      method: 'POST',
      body: { input: data }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/punchListItems.list', jobId] });
      setNewPunchItem({ title: '', description: '', location: '', priority: 'medium' });
      toast({ title: 'Punch list item created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error creating punch list item', description: error.message, variant: 'destructive' });
    }
  });

  // Update punch list item mutation
  const updatePunchItemMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('/api/trpc/punchListItems.update', {
      method: 'POST',
      body: { input: { id, ...data } }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/punchListItems.list', jobId] });
      toast({ title: 'Punch list item updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error updating punch list item', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateFieldLog = () => {
    if (!newLogData.title || !newLogData.description) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    createFieldLogMutation.mutate({
      jobId,
      ...newLogData,
      hoursWorked: newLogData.hoursWorked ? parseInt(newLogData.hoursWorked) : undefined,
      crewMembers: newLogData.crewMembers
    });
  };

  const handleCreatePunchItem = () => {
    if (!newPunchItem.title || !newPunchItem.description) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    createPunchItemMutation.mutate({
      jobId,
      ...newPunchItem
    });
  };

  const handlePunchItemStatusChange = (id: string, status: string) => {
    updatePunchItemMutation.mutate({ id, status });
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'progress': return <CheckCircle className="w-4 h-4" />;
      case 'issue': return <AlertTriangle className="w-4 h-4" />;
      case 'weather': return <Cloud className="w-4 h-4" />;
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'bg-green-100 text-green-800';
      case 'issue': return 'bg-red-100 text-red-800';
      case 'completion': return 'bg-blue-100 text-blue-800';
      case 'weather': return 'bg-yellow-100 text-yellow-800';
      case 'safety': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // Job selection screen if no jobId
  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white px-4 py-6">
          <h1 className="text-2xl font-bold">Field Management</h1>
          <p className="text-blue-100 mt-1">Select a job to manage field operations</p>
        </div>
        
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Wrench className="w-5 h-5" />
                Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                    No active jobs found
                  </p>
                ) : (
                  jobs.map((job: any) => (
                    <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.location.href = `/${division}/field-management/${job.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                              {job.customer?.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {job.siteAddressJson?.street || 'No site address'}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(job.status)} text-xs`}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile-optimized header */}
      <div className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20"
            onClick={() => window.history.back()}
          >
            ← Back
          </Button>
        </div>
        <h1 className="text-xl font-bold">{job?.customer?.name}</h1>
        <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4" />
          {job?.siteAddressJson?.street || 'Site address not set'}
        </p>
      </div>

      {/* Mobile-optimized tabs */}
      <div className="sticky top-0 bg-white dark:bg-slate-800 border-b z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 rounded-none h-14">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs">Daily Logs</TabsTrigger>
            <TabsTrigger value="punchlist" className="text-xs">Punch List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400">Status</Label>
                      <Badge className={`${getStatusColor(job?.status)} mt-1 block w-fit`}>
                        {job?.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400">Division</Label>
                      <p className="font-medium">{job?.division?.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-600 dark:text-slate-400">Recent Activity</Label>
                    <div className="mt-2 space-y-2">
                      {fieldLogs.slice(0, 3).map((log: any) => (
                        <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className={`p-1.5 rounded ${getLogTypeColor(log.logType)}`}>
                            {getLogTypeIcon(log.logType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{log.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {fieldLogs.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-[#A8C8EC] bg-opacity-20 rounded-lg">
                      <p className="text-2xl font-bold text-[#2C3E50]">{fieldLogs.length}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Logs</p>
                    </div>
                    <div className="text-center p-4 bg-[#A8C8EC] bg-opacity-20 rounded-lg">
                      <p className="text-2xl font-bold text-[#2C3E50]">
                        {punchListItems.filter((item: any) => item.status === 'open').length}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Open Issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Daily Logs Tab */}
          <TabsContent value="logs" className="mt-0">
            <div className="space-y-4">
              {/* Quick log entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Log Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Log Type</Label>
                      <Select value={newLogData.logType} onValueChange={(value) => 
                        setNewLogData({...newLogData, logType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="progress">Progress Update</SelectItem>
                          <SelectItem value="issue">Issue/Problem</SelectItem>
                          <SelectItem value="completion">Task Completion</SelectItem>
                          <SelectItem value="weather">Weather Delay</SelectItem>
                          <SelectItem value="safety">Safety Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hours Worked</Label>
                      <Input 
                        type="number" 
                        placeholder="8"
                        value={newLogData.hoursWorked}
                        onChange={(e) => setNewLogData({...newLogData, hoursWorked: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Title</Label>
                    <Input 
                      placeholder="Brief summary of work done"
                      value={newLogData.title}
                      onChange={(e) => setNewLogData({...newLogData, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Detailed description of work, materials used, next steps..."
                      rows={4}
                      value={newLogData.description}
                      onChange={(e) => setNewLogData({...newLogData, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Weather Conditions</Label>
                    <Input 
                      placeholder="Sunny, 72°F"
                      value={newLogData.weatherConditions}
                      onChange={(e) => setNewLogData({...newLogData, weatherConditions: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50]"
                      onClick={handleCreateFieldLog}
                      disabled={createFieldLogMutation.isPending}
                    >
                      {createFieldLogMutation.isPending ? 'Saving...' : 'Save Log Entry'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent logs */}
              <div className="space-y-3">
                {fieldLogs.map((log: any) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${getLogTypeColor(log.logType)} mt-1`}>
                          {getLogTypeIcon(log.logType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.title}
                            </h3>
                            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {log.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {log.weatherConditions && (
                              <Badge variant="outline" className="text-xs">
                                <Cloud className="w-3 h-3 mr-1" />
                                {log.weatherConditions}
                              </Badge>
                            )}
                            {log.hoursWorked && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {log.hoursWorked}h worked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {fieldLogs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">No logs yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Create your first log entry above
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Punch List Tab */}
          <TabsContent value="punchlist" className="mt-0">
            <div className="space-y-4">
              {/* Quick punch item entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Punch List Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select value={newPunchItem.priority} onValueChange={(value) =>
                        setNewPunchItem({...newPunchItem, priority: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="Room/Area"
                        value={newPunchItem.location}
                        onChange={(e) => setNewPunchItem({...newPunchItem, location: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Issue Title</Label>
                    <Input 
                      placeholder="Brief description of the issue"
                      value={newPunchItem.title}
                      onChange={(e) => setNewPunchItem({...newPunchItem, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Detailed description of the issue and required fix..."
                      rows={3}
                      value={newPunchItem.description}
                      onChange={(e) => setNewPunchItem({...newPunchItem, description: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50]"
                      onClick={handleCreatePunchItem}
                      disabled={createPunchItemMutation.isPending}
                    >
                      {createPunchItemMutation.isPending ? 'Adding...' : 'Add to Punch List'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Punch list items */}
              <div className="space-y-3">
                {punchListItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <Badge className={`${getPriorityColor(item.priority)} text-xs`}>
                              {item.priority}
                            </Badge>
                            <div>
                              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.title}
                              </h3>
                              {item.location && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(item.status)} text-xs`}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>

                        <div className="flex gap-2">
                          <Select value={item.status} onValueChange={(status) => 
                            handlePunchItemStatusChange(item.id, status)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon">
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {punchListItems.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">No punch list items</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Great job! No issues to track
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}