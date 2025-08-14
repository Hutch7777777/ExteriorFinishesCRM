import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery'
import { useAuth } from '@/hooks/useAuth'
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







export default function LeadDetail() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const leadId = (params as any).id
  const division = (params as any).division || 'mfnc'
  const { user } = useAuth()

  // Fetch the actual lead data
  const { 
    data: lead, 
    isLoading: leadLoading, 
    error: leadError 
  } = useOptimizedQuery({
    queryKey: ['/api/trpc/leads.get', { id: leadId }],
    enabled: !!leadId
  })

  // If no lead found or loading, show appropriate state
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
          <Button onClick={() => navigate(`/${division}/lead-management`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Management
          </Button>
        </div>
      </div>
    )
  }

  const mockActivities = [
    {
      id: "1",
      type: "call",
      title: "Initial consultation call",
      description: "Discussed project requirements and timeline",
      date: "2025-01-13",
      time: "2:30 PM",
      user: user?.name || "Unknown User"
    },
    {
      id: "2",
      type: "email",
      title: "Sent project proposal",
      description: "Forwarded detailed proposal with pricing breakdown",
      date: "2025-01-12",
      time: "4:15 PM",
      user: user?.name || "Unknown User"
    },
    {
      id: "3",
      type: "meeting",
      title: "Site visit scheduled",
      description: "Arranged on-site evaluation for next Tuesday",
      date: "2025-01-11",
      time: "10:00 AM",
      user: user?.name || "Unknown User"
    },
    {
      id: "4",
      type: "note",
      title: "Follow-up required",
      description: "Customer requested additional information about warranty terms",
      date: "2025-01-10",
      time: "3:45 PM",
      user: user?.name || "Unknown User"
    },
    {
      id: "5",
      type: "task",
      title: "Prepare detailed quote",
      description: "Create comprehensive pricing breakdown for 5-story renovation",
      date: "2025-01-09",
      time: "1:20 PM",
      user: user?.name || "Unknown User"
    }
  ]

  const mockTasks = [
    {
      id: "1",
      title: "Prepare detailed proposal",
      description: "Include material costs and timeline",
      dueDate: "2025-01-14",
      status: "in_progress",
      assignee: user?.name || "Unassigned"
    },
    {
      id: "2",
      title: "Schedule site visit",
      description: "Coordinate with facility manager",
      dueDate: "2025-01-16",
      status: "pending",
      assignee: user?.name || "Unassigned"
    },
    {
      id: "3",
      title: "Follow up on proposal",
      description: "Check if client has any questions",
      dueDate: "2025-01-20",
      status: "pending",
      assignee: user?.name || "Unassigned"
    }
  ]

  const mockDocuments = [
    {
      id: "1",
      name: "Initial Proposal - Acme Corp.pdf",
      type: "Proposal",
      uploadedBy: user?.name || "Unknown User",
      uploadedAt: "2025-01-12",
      size: "2.4 MB"
    },
    {
      id: "2",
      name: "Site Photos - Building Exterior.zip",
      type: "Photos",
      uploadedBy: user?.name || "Unknown User",
      uploadedAt: "2025-01-11",
      size: "15.7 MB"
    },
    {
      id: "3",
      name: "Building Plans - Acme Corp.dwg",
      type: "Plans",
      uploadedBy: user?.name || "Unknown User",
      uploadedAt: "2025-01-10",
      size: "5.2 MB"
    }
  ]

  const [newNote, setNewNote] = useState('')
  
  // Mock notes data with state management
  const [notes, setNotes] = useState([
    {
      id: 1,
      content: "Client is very interested in eco-friendly siding options. Mentioned they want to achieve LEED certification for the building.",
      author: "Mike Johnson",
      createdAt: "January 9, 2025 at 3:15 PM",
      color: "blue"
    },
    {
      id: 2,
      content: "Site visit went well. Building has good access for equipment. No major structural concerns identified.",
      author: "Sarah Wilson", 
      createdAt: "January 7, 2025 at 11:30 AM",
      color: "green"
    }
  ])
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', assignee: '' })
  const [tasks, setTasks] = useState(mockTasks)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
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
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [editActivity, setEditActivity] = useState({
    type: 'call',
    title: '',
    description: '',
    date: '',
    time: ''
  })
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending'
  })
  const [documents, setDocuments] = useState(mockDocuments)
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'Proposal',
    file: null as File | null
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
      const colors = ['blue', 'green', 'purple', 'orange', 'red']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      const newNoteObj = {
        id: Date.now(), // Simple ID generation
        content: newNote.trim(),
        author: user?.name || "Unknown User",
        createdAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        color: randomColor
      }
      
      // Add new note to the beginning of the list
      setNotes(prevNotes => [newNoteObj, ...prevNotes])
      setNewNote('')
      
      // Show success toast
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      })
    }
  }

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const task = {
        id: (tasks.length + 1).toString(),
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        assignee: user?.name || "Unassigned"
      }
      
      // Add to the top of the tasks list
      setTasks([task, ...tasks])
      
      // Reset form
      setNewTask({ title: '', description: '', dueDate: '', assignee: '' })
      
      // Close modal
      setIsTaskModalOpen(false)
      
      // Show success toast
      toast({
        title: "Task created",
        description: "Your task has been added successfully.",
      })
      
      // In real app, save task via API
      console.log('Adding task:', task)
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
        user: user?.name || "Unknown User"
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

  const handleAddDocument = async () => {
    if (newDocument.name.trim() && newDocument.file) {
      try {
        // Get upload URL from backend
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          credentials: 'include'
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL')
        }
        
        const { uploadURL } = await uploadResponse.json()
        
        // Upload file to object storage
        const fileUploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: newDocument.file,
          headers: {
            'Content-Type': newDocument.file.type || 'application/octet-stream'
          }
        })
        
        if (!fileUploadResponse.ok) {
          throw new Error('Failed to upload file')
        }
        
        // Set document metadata with file URL
        const fileExtension = newDocument.file.name.split('.').pop()
        const timestamp = Date.now()
        const fileName = `${newDocument.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${fileExtension}`
        const fileUrl = `/objects/uploads/${fileName}`
        
        const document = {
          id: (documents.length + 1).toString(),
          name: newDocument.name,
          type: newDocument.type,
          uploadedBy: user?.name || "Unknown User",
          uploadedAt: new Date().toISOString().split('T')[0],
          size: formatFileSize(newDocument.file.size),
          fileUrl: fileUrl,
          originalFileName: newDocument.file.name
        }
        
        // Add to the top of the documents list
        setDocuments([document, ...documents])
        
        // Reset form
        setNewDocument({ name: '', type: 'Proposal', file: null })
        
        // Close modal
        setIsDocumentModalOpen(false)
        
        // Show success toast
        toast({
          title: "Document uploaded",
          description: "Your document has been uploaded successfully.",
        })
        
        console.log('Document uploaded successfully:', document)
        
      } catch (error) {
        console.error('Error uploading document:', error)
        toast({
          title: "Upload failed",
          description: "There was an error uploading your document. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleViewDocument = (document: any) => {
    // Open the actual uploaded file
    if (document.fileUrl) {
      // Create a temporary link element to trigger download/open
      const link = document.createElement('a')
      link.href = document.fileUrl
      link.target = '_blank' // Open in new tab for viewing
      link.rel = 'noopener noreferrer'
      
      // For PDFs and images, open in new tab for viewing
      // For other files, trigger download
      const fileExtension = document.originalFileName?.split('.').pop()?.toLowerCase()
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
        // Open in new tab for viewing
        link.click()
        toast({
          title: "Opening document",
          description: `Opening ${document.name} in new tab`,
        })
      } else {
        // Trigger download for other file types
        link.download = document.originalFileName || document.name
        link.click()
        toast({
          title: "Downloading document",
          description: `Downloading ${document.name}`,
        })
      }
    } else {
      // Fallback for documents without fileUrl (old documents)
      toast({
        title: "File not available",
        description: "This document file is not available for viewing.",
        variant: "destructive"
      })
    }
  }



  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setEditTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status
    })
    setIsEditTaskModalOpen(true)
  }

  const handleUpdateTask = () => {
    if (editTask.title.trim() && editingTask) {
      const updatedTasks = tasks.map(task => 
        task.id === editingTask!.id
          ? {
              ...task,
              title: editTask.title,
              description: editTask.description,
              dueDate: editTask.dueDate,
              status: editTask.status
            }
          : task
      )
      
      setTasks(updatedTasks)
      setIsEditTaskModalOpen(false)
      setEditingTask(null)
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      })
      
      // In real app, update via API
      console.log('Updating task:', editingTask!.id, editTask)
    }
  }

  const handleEditActivity = (activity: any) => {
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
    if (editActivity.title.trim() && editingActivity) {
      const updatedActivities = activities.map(activity => 
        activity.id === editingActivity!.id
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
      console.log('Updating activity:', editingActivity!.id, editActivity)
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
              {lead.companyName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{lead.contactName}</p>
          </div>
          <Badge className={getStatusColor(lead.status)}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
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
                  <p className="text-xl font-semibold">${(lead.valueInCents / 100).toLocaleString()}</p>
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
                  <p className="text-xl font-semibold">{lead.probability || 0}%</p>
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
                  <p className="text-xl font-semibold">{new Date(lead.createdAt).toLocaleDateString()}</p>
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
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Phone:</span>
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Address:</span>
                    <span className="text-sm">{lead.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Division:</span>
                    <span className="text-sm">{division}</span>
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
                    <p className="font-medium">{lead.projectType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
                    <p className="font-medium">{lead.timeline || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Budget Range</p>
                    <p className="font-medium">${(lead.valueInCents / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lead Source</p>
                    <p className="font-medium">{lead.source || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300">{lead.notes || 'No description provided'}</p>
                </CardContent>
              </Card>

              {/* Decision Makers */}
              <Card>
                <CardHeader>
                  <CardTitle>Decision Makers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {lead.contactName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{lead.contactName}</span>
                    </div>
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
                    <Badge variant="outline" className="mr-2">
                      No competitors identified
                    </Badge>
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
              <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Title *</Label>
                      <Input
                        id="task-title"
                        placeholder="Enter task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        placeholder="Enter task description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-due-date">Due Date</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddTask}
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                        disabled={!newTask.title.trim()}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
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

            {/* Edit Task Modal */}
            <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-title">Title *</Label>
                    <Input
                      id="edit-task-title"
                      placeholder="Enter task title"
                      value={editTask.title}
                      onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-description">Description</Label>
                    <Textarea
                      id="edit-task-description"
                      placeholder="Enter task description"
                      value={editTask.description}
                      onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-due-date">Due Date</Label>
                    <Input
                      id="edit-task-due-date"
                      type="date"
                      value={editTask.dueDate}
                      onChange={(e) => setEditTask({...editTask, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-status">Status</Label>
                    <Select
                      value={editTask.status}
                      onValueChange={(value) => setEditTask({...editTask, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditTaskModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateTask}
                      className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                      disabled={!editTask.title.trim()}
                    >
                      Update Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]">
                    <Plus className="w-4 h-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-name">Document Name *</Label>
                      <Input
                        id="document-name"
                        placeholder="Enter document name"
                        value={newDocument.name}
                        onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Type</Label>
                      <Select
                        value={newDocument.type}
                        onValueChange={(value) => setNewDocument({...newDocument, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Proposal">Proposal</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Photos">Photos</SelectItem>
                          <SelectItem value="Plans">Plans</SelectItem>
                          <SelectItem value="Permits">Permits</SelectItem>
                          <SelectItem value="Invoice">Invoice</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-file">File *</Label>
                      <Input
                        id="document-file"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setNewDocument({...newDocument, file})
                          // Auto-fill name if empty
                          if (file && !newDocument.name) {
                            setNewDocument(prev => ({...prev, name: file.name, file}))
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.dwg"
                      />
                      <p className="text-xs text-slate-500">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG, ZIP, DWG
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddDocument}
                        className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40]"
                        disabled={!newDocument.name.trim() || !newDocument.file}
                      >
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => handleViewDocument(doc)}
                >
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
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div key={note.id} className={`border-l-4 border-${note.color}-500 pl-4`}>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                          {note.content}
                        </p>
                        <div className="text-xs text-slate-500">
                          {note.author} • {note.createdAt}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No notes yet. Add your first note above.</p>
                  )}
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