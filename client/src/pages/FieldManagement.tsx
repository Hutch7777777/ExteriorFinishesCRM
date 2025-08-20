import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare,
  FileText,
  Briefcase,
  Calendar,
  Phone,
  CheckSquare,
  FileImage,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Send,
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  Bell,
  Truck,
  Wrench,
  Camera,
  Cloud,
  Mail,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { trpcClient } from '@/lib/trpc';

export default function FieldManagement() {
  const params = useParams();
  const division = params?.division || 'mfnc';
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [logInput, setLogInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState('all');
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);

  const [photoCapture, setPhotoCapture] = useState<File | null>(null);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: ''
  });
  const [materialRequest, setMaterialRequest] = useState({
    supplier: '',
    materials: '',
    urgency: 'normal' as 'urgent' | 'normal' | 'low',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active jobs for current division
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: [`/api/trpc/jobs.list/${division}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch field team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: [`/api/trpc/users.list/${division}`],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch customers to get field supervisor assignments
  const { data: customers = [] } = useQuery({
    queryKey: [`/api/trpc/customers.list`, division],
    queryFn: () => trpcClient.customers.list({ divisionKey: division as 'mfnc' | 'sfnc' | 'rr' }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch field logs for selected job
  const { data: fieldLogs = [] } = useQuery({
    queryKey: [`/api/trpc/fieldLogs.list`, selectedJob],
    enabled: !!selectedJob,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mock data for demonstration - replace with real API calls
  const mockMessages = [
    {
      id: '1',
      sender: 'Office Manager',
      message: 'Please update on the Johnson project progress today',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'office-to-field'
    },
    {
      id: '2', 
      sender: 'Field Crew A',
      message: 'Siding installation 60% complete. Weather holding up well.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      type: 'field-to-office'
    }
  ];

  const mockTasks = [
    {
      id: '1',
      title: 'Install siding on north wall',
      status: 'in-progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedTo: 'Field Crew A'
    },
    {
      id: '2',
      title: 'Complete trim work',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedTo: 'Field Crew B'
    }
  ];

  const mockSchedule = [
    {
      id: '1',
      jobName: 'Johnson Residence',
      crew: 'Field Crew A',
      startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
      status: 'scheduled'
    }
  ];

  const mockWillCallRequests = [
    {
      id: '1',
      supplier: 'ABC Supply Co.',
      materials: 'Hardie Board Siding - 20 pieces',
      requestedBy: 'John Field',
      requestTime: new Date(Date.now() - 30 * 60 * 1000),
      status: 'pending',
      notes: 'Need for Johnson project tomorrow morning'
    }
  ];

  const mockDocuments = [
    {
      id: '1',
      name: 'Site Photos - Morning',
      type: 'image',
      uploadedBy: 'Field Crew A',
      uploadTime: new Date(Date.now() - 60 * 60 * 1000),
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Material Receipt',
      type: 'pdf',
      uploadedBy: 'Field Crew A',
      uploadTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      size: '156 KB'
    }
  ];

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    // TODO: Implement API call
    toast({
      title: "Message sent",
      description: "Your message has been sent to the office team."
    });
    setMessageInput('');
  };

  const addLog = () => {
    if (!logInput.trim() || !selectedJob) return;
    
    // TODO: Implement API call
    toast({
      title: "Log added",
      description: "Field log has been recorded successfully."
    });
    setLogInput('');
  };

  const submitWillCallRequest = () => {
    // TODO: Implement API call
    toast({
      title: "Will Call Request Submitted",
      description: "Your materials request has been sent to the supplier."
    });
  };

  // Quick Actions handlers
  const handleTakePhoto = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // For mobile browsers, trigger camera directly
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use rear camera on mobile
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          setPhotoCapture(file);
          setShowPhotoDialog(true);
        }
      };
      input.click();
    } else {
      setShowPhotoDialog(true);
    }
  };

  const handleReportIssue = () => {
    setShowIssueDialog(true);
  };

  const handleRequestMaterials = () => {
    setShowMaterialDialog(true);
  };



  const submitPhoto = async () => {
    if (!photoCapture || !selectedJob) {
      toast({
        title: "Error",
        description: "Please select a job and capture a photo first."
      });
      return;
    }

    try {
      // TODO: Implement photo upload to storage and create field log
      const formData = new FormData();
      formData.append('photo', photoCapture);
      formData.append('jobId', selectedJob);
      
      toast({
        title: "Photo Uploaded",
        description: "Site photo has been added to the job log."
      });
      
      setShowPhotoDialog(false);
      setPhotoCapture(null);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again."
      });
    }
  };

  const submitIssue = async () => {
    if (!issueForm.title || !issueForm.description || !selectedJob) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a job."
      });
      return;
    }

    try {
      // TODO: Create punch list item via API
      toast({
        title: "Issue Reported",
        description: "Issue has been added to the punch list and office team notified."
      });
      
      setShowIssueDialog(false);
      setIssueForm({
        title: '',
        description: '',
        priority: 'medium',
        location: ''
      });
    } catch (error) {
      toast({
        title: "Submit Failed",
        description: "Failed to report issue. Please try again."
      });
    }
  };

  const submitMaterialRequest = async () => {
    if (!materialRequest.supplier || !materialRequest.materials) {
      toast({
        title: "Error",
        description: "Please fill in supplier and materials information."
      });
      return;
    }

    try {
      // TODO: Create material request via API
      toast({
        title: "Request Submitted",
        description: "Material request has been sent to the office team."
      });
      
      setShowMaterialDialog(false);
      setMaterialRequest({
        supplier: '',
        materials: '',
        urgency: 'normal',
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Submit Failed",
        description: "Failed to submit material request. Please try again."
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter customers by selected supervisor
  const filteredCustomers = selectedSupervisor === 'all' 
    ? customers 
    : selectedSupervisor === 'unassigned'
    ? customers.filter((customer: any) => !customer.fieldSupervisorId)
    : customers.filter((customer: any) => customer.fieldSupervisorId === selectedSupervisor);

  // Get unique field supervisors from customers
  const activeSupervisors = teamMembers.filter((member: any) => 
    customers.some((customer: any) => customer.fieldSupervisorId === member.id)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Field Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Coordinate field operations, communication, and project tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Supervisors</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Field Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Jobs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{jobs.length || 8}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tasks Complete</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Field Crews</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{teamMembers.length || 4}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor View Section */}
      {selectedSupervisor !== 'all' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedSupervisor === 'unassigned' 
                ? 'Unassigned Customers' 
                : `${teamMembers.find((m: any) => m.id === selectedSupervisor)?.name || 'Unknown'}'s Customers`}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} in this view
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer: any) => (
                <Card key={customer.id} className="border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900 dark:text-white">{customer.name}</h4>
                      {customer.email && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      )}
                      {customer.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">
                          {customer.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                  No customers found for this supervisor
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="communication">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="will-calls">
            <Truck className="w-4 h-4 mr-2" />
            Will Calls
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mockMessages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{msg.sender}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{msg.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {format(msg.timestamp, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Today's Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mockTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{task.assignedTo}</p>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message History */}
            <div className="lg:col-span-2">
              <Card className="h-[500px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Field-Office Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {mockMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.type === 'field-to-office' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.type === 'field-to-office' 
                              ? 'bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white' 
                              : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            <p className="text-sm font-medium mb-1">{msg.sender}</p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(msg.timestamp, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Type your message to office..." 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleTakePhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleReportIssue}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleRequestMaterials}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Request Materials
                  </Button>

                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Weather</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Partly Cloudy</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">72°F • Good for work</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Project Documents</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {doc.type === 'image' ? (
                        <FileImage className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{doc.uploadedBy}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {format(doc.uploadTime, 'MMM d, h:mm a')} • {doc.size}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Job Assignments</h2>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobs.slice(0, 6).map((job: any, index: number) => (
              <Card key={job?.id || index} className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => setSelectedJob(job?.id || `job-${index}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {job?.customer?.name || `Project ${index + 1}`}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {job?.siteAddressJson?.street || '123 Main Street'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(job?.status || 'active')}>
                      {job?.status || 'active'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{job?.division?.name || 'Multi-Family New Construction'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>Field Crew {String.fromCharCode(65 + (index % 3))}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Started {format(new Date(Date.now() - index * 24 * 60 * 60 * 1000), 'MMM d')}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 40) + 30}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] h-2 rounded-full"
                        style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Field Schedule</h2>
            <Button size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSchedule.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {format(event.startTime, 'h:mm')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {format(event.startTime, 'a')}
                        </p>
                      </div>
                      <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{event.jobName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{event.crew}</p>
                        <Badge className={getStatusColor(event.status)} size="sm">
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                    <div key={day} className="flex items-center justify-between p-2 rounded">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{day}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {Math.floor(Math.random() * 3) + 2} jobs
                        </span>
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded">
                          <div 
                            className="h-2 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] rounded"
                            style={{ width: `${Math.floor(Math.random() * 60) + 40}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Will Calls Tab */}
        <TabsContent value="will-calls" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Material Requests</h2>
            <Button 
              onClick={submitWillCallRequest}
              size="sm" 
              className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
            >
              <Truck className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockWillCallRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{request.supplier}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{request.materials}</p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-500 dark:text-slate-500">
                        <p>Requested by: {request.requestedBy}</p>
                        <p>Time: {format(request.requestTime, 'MMM d, h:mm a')}</p>
                        {request.notes && <p>Notes: {request.notes}</p>}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Request Form</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abc-supply">ABC Supply Co.</SelectItem>
                        <SelectItem value="home-depot">Home Depot</SelectItem>
                        <SelectItem value="lowes">Lowe's</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="materials">Materials Needed</Label>
                    <Textarea 
                      placeholder="Describe the materials you need..."
                      className="resize-none"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent - Same Day</SelectItem>
                        <SelectItem value="high">High - Next Day</SelectItem>
                        <SelectItem value="normal">Normal - This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea 
                      placeholder="Any special instructions..."
                      className="resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={submitWillCallRequest}
                    className="w-full bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                  >
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Task Management</h2>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {mockTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">{task.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Assigned to: {task.assignedTo}</p>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-500">
                        <span>Due: {format(task.dueDate, 'MMM d')}</span>
                        <span>Priority: {task.priority}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Job Details - Field Logs */}
      {selectedJob && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Field Logs - Job #{selectedJob.slice(-6)}
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a field log entry..." 
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={addLog}
                  disabled={!logInput.trim()}
                  className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                >
                  Add Log
                </Button>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {fieldLogs.length > 0 ? (
                    fieldLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{log.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{log.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 dark:text-slate-500 py-8">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No field logs yet. Add your first log entry above.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Site Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Job</Label>
              <Select value={selectedJob || ''} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose job site" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.siteAddress?.street || `Job ${job.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {photoCapture ? (
              <div className="space-y-2">
                <Label>Photo Preview</Label>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <img 
                    src={URL.createObjectURL(photoCapture)} 
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Take Photo</Label>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPhotoCapture(file);
                    }}
                    className="hidden"
                    id="camera-input"
                  />
                  <label htmlFor="camera-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Tap to take photo</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowPhotoDialog(false);
                setPhotoCapture(null);
              }}>
                Cancel
              </Button>
              <Button onClick={submitPhoto} disabled={!photoCapture || !selectedJob}>
                Upload Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Job</Label>
              <Select value={selectedJob || ''} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose job site" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.siteAddress?.street || `Job ${job.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Issue Title</Label>
              <Input
                value={issueForm.title}
                onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                placeholder="Brief description of the issue"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={issueForm.priority} onValueChange={(value: any) => setIssueForm({...issueForm, priority: value})}>
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
            
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Input
                value={issueForm.location}
                onChange={(e) => setIssueForm({...issueForm, location: e.target.value})}
                placeholder="Specific location of the issue"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={issueForm.description}
                onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                placeholder="Detailed description of the issue and any immediate actions taken"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitIssue}>
                Report Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Request Dialog */}
      <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Materials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={materialRequest.supplier} onValueChange={(value) => setMaterialRequest({...materialRequest, supplier: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABC Supply Co.">ABC Supply Co.</SelectItem>
                  <SelectItem value="Home Depot Pro">Home Depot Pro</SelectItem>
                  <SelectItem value="Lowe's Pro">Lowe's Pro</SelectItem>
                  <SelectItem value="Local Lumber Yard">Local Lumber Yard</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Materials Needed</Label>
              <Textarea
                value={materialRequest.materials}
                onChange={(e) => setMaterialRequest({...materialRequest, materials: e.target.value})}
                placeholder="List materials, quantities, and specifications"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={materialRequest.urgency} onValueChange={(value: any) => setMaterialRequest({...materialRequest, urgency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent - Need Today</SelectItem>
                  <SelectItem value="normal">Normal - Need This Week</SelectItem>
                  <SelectItem value="low">Low - Can Wait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={materialRequest.notes}
                onChange={(e) => setMaterialRequest({...materialRequest, notes: e.target.value})}
                placeholder="Special instructions, delivery preferences, etc."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMaterialDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitMaterialRequest}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}