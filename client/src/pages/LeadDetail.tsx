import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery'
import { trpcClient } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  MessageSquare,
  FileText,
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Clock,
  Building
} from 'lucide-react'

// Mock data for demonstration - in real app this would come from API
const mockLead = {
  id: "lead-1",
  companyName: "Acme Corporation",
  contactName: "John Smith",
  email: "john@acme.com",
  phone: "(555) 123-4567",
  address: "123 Business Ave, Suite 100, City, ST 12345",
  status: "qualified",
  value: 150000,
  probability: 75,
  source: "Website Inquiry",
  assignedTo: "Mike Johnson",
  createdAt: "2025-01-05",
  lastActivity: "2025-01-09",
  description: "Interested in siding renovation for 5-story building",
  division: "Multi-Family New Construction",
  
  // Additional details
  projectType: "Commercial Renovation",
  timeline: "Q2 2025",
  budget: "$150,000 - $200,000",
  decisionMakers: ["John Smith (CEO)", "Sarah Davis (Facilities Manager)"],
  competitors: ["ABC Siding Co.", "XYZ Construction"],
  nextSteps: "Schedule site visit and prepare detailed proposal"
}

const mockActivities = [
  {
    id: "1",
    type: "call",
    title: "Initial consultation call",
    description: "Discussed project requirements and timeline",
    date: "2025-01-09",
    time: "2:30 PM",
    user: "Mike Johnson"
  },
  {
    id: "2",
    type: "email",
    title: "Sent project proposal",
    description: "Forwarded detailed proposal with pricing breakdown",
    date: "2025-01-08",
    time: "4:15 PM",
    user: "Mike Johnson"
  },
  {
    id: "3",
    type: "meeting",
    title: "Site visit scheduled",
    description: "Arranged on-site evaluation for next Tuesday",
    date: "2025-01-07",
    time: "10:00 AM",
    user: "Sarah Wilson"
  }
]

const mockTasks = [
  {
    id: "1",
    title: "Prepare detailed proposal",
    description: "Include material costs and timeline",
    dueDate: "2025-01-12",
    status: "in_progress",
    assignee: "Mike Johnson"
  },
  {
    id: "2",
    title: "Schedule site visit",
    description: "Coordinate with facility manager",
    dueDate: "2025-01-15",
    status: "pending",
    assignee: "Sarah Wilson"
  },
  {
    id: "3",
    title: "Follow up on proposal",
    description: "Check if client has any questions",
    dueDate: "2025-01-18",
    status: "pending",
    assignee: "Mike Johnson"
  }
]

const mockDocuments = [
  {
    id: "1",
    name: "Initial Proposal - Acme Corp.pdf",
    type: "Proposal",
    uploadedBy: "Mike Johnson",
    uploadedAt: "2025-01-08",
    size: "2.4 MB"
  },
  {
    id: "2",
    name: "Site Photos - Building Exterior.zip",
    type: "Photos",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2025-01-07",
    size: "15.7 MB"
  },
  {
    id: "3",
    name: "Building Plans - Acme Corp.dwg",
    type: "Plans",
    uploadedBy: "John Smith",
    uploadedAt: "2025-01-05",
    size: "5.2 MB"
  }
]

export default function LeadDetail() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const leadId = (params as any).id
  const division = (params as any).division || 'mfnc'

  const [newNote, setNewNote] = useState('')
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', assignee: '' })
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  const [activities, setActivities] = useState(mockActivities)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [editActivity, setEditActivity] = useState({
    type: 'call',
    title: '',
    description: '',
    date: '',
    time: ''
  })
  
  const { toast } = useToast()

  // In real app, this would fetch the actual lead data
  // const { data: lead, isLoading } = useOptimizedQuery({
  //   queryKey: ['lead', leadId],
  //   queryFn: () => trpcClient.leads.getById({ id: leadId }),
  //   enabled: !!leadId
  // })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'won': return 'bg-green-500 text-white'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In real app, save note via API
      console.log('Adding note:', newNote)
      setNewNote('')
    }
  }

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      // In real app, save task via API
      console.log('Adding task:', newTask)
      setNewTask({ title: '', description: '', dueDate: '', assignee: '' })
    }
  }

  const handleAddActivity = () => {
    if (newActivity.title.trim()) {
      const activity = {
        id: (activities.length + 1).toString(),
        type: newActivity.type,
        title: newActivity.title,
        description: newActivity.description,
        date: newActivity.date,
        time: newActivity.time,
        user: "Mike Johnson" // In real app, use current user
      }
      
      // Add to the top of the activities list
      setActivities([activity, ...activities])
      
      // Reset form
      setNewActivity({
        type: 'call',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
      
      // Close modal
      setIsActivityModalOpen(false)
      
      // Show success toast
      toast({
        title: "Activity logged",
        description: "Your activity has been added successfully.",
      })
      
      // In real app, save to API
      console.log('Adding activity:', activity)
    }
  }

  const handleEditActivity = (activity) => {
    setEditingActivity(activity)
    setEditActivity({
      type: activity.type,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateActivity = () => {
    if (editActivity.title.trim()) {
      const updatedActivities = activities.map(activity => 
        activity.id === editingActivity.id
          ? {
              ...activity,
              type: editActivity.type,
              title: editActivity.title,
              description: editActivity.description,
              date: editActivity.date,
              time: editActivity.time
            }
          : activity
      )
      
      setActivities(updatedActivities)
      setIsEditModalOpen(false)
      setEditingActivity(null)
      
      toast({
        title: "Activity updated",
        description: "Your activity has been updated successfully.",
      })
      
      // In real app, update via API
      console.log('Updating activity:', editingActivity.id, editActivity)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate({ to: `/${division}/lead-management` })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {mockLead.companyName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{mockLead.contactName}</p>
          </div>
          <Badge className={getStatusColor(mockLead.status)}>
            {mockLead.status.charAt(0).toUpperCase() + mockLead.status.slice(1)}
          </Badge>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate({ to: `/${division}/estimates` })}
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
                  <p className="text-xl font-semibold">${mockLead.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Probability</p>
                  <p className="text-xl font-semibold">{mockLead.probability}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Last Activity</p>
                  <p className="text-xl font-semibold">{mockLead.lastActivity}</p>
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
                  <p className="text-xl font-semibold">{mockLead.assignedTo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Email:</span>
                    <a href={`mailto:${mockLead.email}`} className="text-blue-600 hover:underline">
                      {mockLead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Phone:</span>
                    <a href={`tel:${mockLead.phone}`} className="text-blue-600 hover:underline">
                      {mockLead.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Address:</span>
                    <span className="text-sm">{mockLead.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Division:</span>
                    <span className="text-sm">{mockLead.division}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Project Type</p>
                    <p className="font-medium">{mockLead.projectType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
                    <p className="font-medium">{mockLead.timeline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Budget Range</p>
                    <p className="font-medium">{mockLead.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lead Source</p>
                    <p className="font-medium">{mockLead.source}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300">{mockLead.description}</p>
                </CardContent>
              </Card>

              {/* Decision Makers */}
              <Card>
                <CardHeader>
                  <CardTitle>Decision Makers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockLead.decisionMakers.map((person, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {person.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{person}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Competition */}
              <Card>
                <CardHeader>
                  <CardTitle>Competitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockLead.competitors.map((competitor, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Activities</h3>
              <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4" />
                    Log Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Log New Activity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="activity-type">Activity Type</Label>
                      <Select value={newActivity.type} onValueChange={(value) => setNewActivity({...newActivity, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity-title">Title</Label>
                      <Input
                        id="activity-title"
                        placeholder="Brief description of the activity"
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity-description">Description</Label>
                      <Textarea
                        id="activity-description"
                        placeholder="Detailed notes about the activity"
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity-date">Date</Label>
                        <Input
                          id="activity-date"
                          type="date"
                          value={newActivity.date}
                          onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-time">Time</Label>
                        <Input
                          id="activity-time"
                          type="time"
                          value={newActivity.time}
                          onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddActivity}
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                        disabled={!newActivity.title.trim()}
                      >
                        Save Activity
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Activity Modal */}
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Activity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-activity-type">Activity Type</Label>
                      <Select value={editActivity.type} onValueChange={(value) => setEditActivity({...editActivity, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-activity-title">Title</Label>
                      <Input
                        id="edit-activity-title"
                        placeholder="Brief description of the activity"
                        value={editActivity.title}
                        onChange={(e) => setEditActivity({...editActivity, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-activity-description">Description</Label>
                      <Textarea
                        id="edit-activity-description"
                        placeholder="Detailed notes about the activity"
                        value={editActivity.description}
                        onChange={(e) => setEditActivity({...editActivity, description: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-activity-date">Date</Label>
                        <Input
                          id="edit-activity-date"
                          type="date"
                          value={editActivity.date}
                          onChange={(e) => setEditActivity({...editActivity, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-activity-time">Time</Label>
                        <Input
                          id="edit-activity-time"
                          type="time"
                          value={editActivity.time}
                          onChange={(e) => setEditActivity({...editActivity, time: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateActivity}
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                        disabled={!editActivity.title.trim()}
                      >
                        Update Activity
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {activity.type === 'call' && <Phone className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'meeting' && <Calendar className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'note' && <FileText className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'task' && <CheckSquare className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{activity.user}</span>
                            <span>{activity.date} at {activity.time}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditActivity(activity)}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>

            <div className="space-y-4">
              {mockTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Due: {task.dueDate}</span>
                          <span>Assigned to: {task.assignee}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Uploaded by {doc.uploadedBy}</p>
                      <p>{doc.uploadedAt} • {doc.size}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your note here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      Client is very interested in eco-friendly siding options. 
                      Mentioned they want to achieve LEED certification for the building.
                    </p>
                    <div className="text-xs text-slate-500">
                      Mike Johnson • January 9, 2025 at 3:15 PM
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      Site visit went well. Building has good access for equipment. 
                      No major structural concerns identified.
                    </p>
                    <div className="text-xs text-slate-500">
                      Sarah Wilson • January 7, 2025 at 11:30 AM
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <h3 className="text-lg font-semibold">Lead Timeline</h3>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Lead Qualified</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Lead has been qualified and moved to proposal stage
                    </p>
                    <span className="text-xs text-slate-500">January 9, 2025</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Initial Contact</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      First phone call to discuss project requirements
                    </p>
                    <span className="text-xs text-slate-500">January 6, 2025</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Lead Created</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      New lead added from website inquiry
                    </p>
                    <span className="text-xs text-slate-500">January 5, 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}