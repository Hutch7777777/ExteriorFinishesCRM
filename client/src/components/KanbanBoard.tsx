import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import '@/styles/kanban.css'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Building
} from 'lucide-react'
import { AddLeadDialog } from './AddLeadDialog'
import { DivisionSwitcher } from './DivisionSwitcher'

// Define sales stages
const SALES_STAGES = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'contacted', title: 'Contacted', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'qualified', title: 'Qualified', color: 'bg-green-50 border-green-200' },
  { id: 'proposal', title: 'Proposal Sent', color: 'bg-purple-50 border-purple-200' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-orange-50 border-orange-200' },
  { id: 'won', title: 'Won', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'lost', title: 'Lost', color: 'bg-red-50 border-red-200' }
]

// Mock data for demonstration
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
    assignedTo: 'Mike Johnson',
    notes: 'Interested in siding renovation for 5-story building',
    avatar: 'JS',
    division: 'Multi-Family New Construction'
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
    assignedTo: 'Sarah Wilson',
    notes: 'Large residential complex, decision expected this week',
    avatar: 'SJ',
    division: 'Multi-Family New Construction'
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
    assignedTo: 'Mike Johnson',
    notes: 'Budget constraints, looking for cost-effective solutions',
    avatar: 'MC',
    division: 'Single-Family New Construction'
  },
  {
    id: '4',
    name: 'City Mall',
    contact: 'Lisa Brown',
    email: 'lisa@citymall.com',
    phone: '(555) 234-5678',
    status: 'new',
    value: 320000,
    source: 'Website',
    createdAt: '2025-01-10',
    assignedTo: 'Sarah Wilson',
    notes: 'Large commercial project, needs exterior renovation',
    avatar: 'LB',
    division: 'R&R'
  },
  {
    id: '5',
    name: 'Riverside Condos',
    contact: 'Tom Wilson',
    email: 'tom@riverside.com',
    phone: '(555) 345-6789',
    status: 'contacted',
    value: 180000,
    source: 'Referral',
    createdAt: '2025-01-09',
    assignedTo: 'Mike Johnson',
    notes: 'Interested in energy-efficient siding options',
    avatar: 'TW',
    division: 'Single-Family New Construction'
  },
  {
    id: '6',
    name: 'Green Valley Hospital',
    contact: 'Dr. Amanda Foster',
    email: 'amanda@greenvalley.com',
    phone: '(555) 456-7891',
    status: 'won',
    value: 450000,
    source: 'Direct Contact',
    createdAt: '2024-12-20',
    assignedTo: 'Sarah Wilson',
    notes: 'Hospital exterior renovation project - signed contract',
    avatar: 'AF',
    division: 'R&R'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'qualified': return 'bg-green-100 text-green-800 border-green-300'
    case 'proposal': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'negotiation': return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'won': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'lost': return 'bg-red-100 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

interface LeadCardProps {
  lead: typeof mockLeads[0]
  division: string
  isDragging?: boolean
}

function LeadCard({ lead, division, isDragging = false }: LeadCardProps) {
  const navigate = useNavigate()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const handleCardClick = () => {
    navigate({ to: `/${division}/lead-management/lead/${lead.id}` })
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
        isDragging || isSortableDragging ? 'shadow-lg rotate-2' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
              {lead.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs">{lead.avatar}</AvatarFallback>
              </Avatar>
              <span>{lead.contact}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={handleActionClick}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={handleActionClick}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span className="font-semibold text-green-600">
              ${lead.value.toLocaleString()}
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)}`}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
        </div>

        {/* Notes */}
        {lead.notes && (
          <p className="text-xs text-slate-600 dark:text-slate-400 break-words line-clamp-2">
            {lead.notes}
          </p>
        )}

        {/* Assigned To & Date */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="truncate mr-2">Assigned: {lead.assignedTo}</span>
          <span className="flex-shrink-0">{lead.createdAt}</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface KanbanColumnProps {
  stage: typeof SALES_STAGES[0]
  leads: typeof mockLeads
  division: string
  onLeadAdded?: (lead: any) => void
}

function KanbanColumn({ stage, leads, division, onLeadAdded }: KanbanColumnProps) {
  const stageLeads = leads.filter(lead => lead.status === stage.id)
  const totalValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0)

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed p-4 min-h-[600px] w-full transition-colors ${stage.color} ${
        isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : ''
      }`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            {stage.title}
          </h3>
          <AddLeadDialog onLeadAdded={onLeadAdded}>
            <Button variant="outline" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </AddLeadDialog>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {stageLeads.length} leads
          </span>
          <span className="font-medium text-green-600">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      <SortableContext items={stageLeads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {stageLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} division={division} />
          ))}
          {stageLeads.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No leads in this stage</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface KanbanBoardProps {
  leads?: typeof mockLeads
  onLeadAdded?: (lead: any) => void
}

export default function KanbanBoard({ leads: propLeads, onLeadAdded }: KanbanBoardProps = {}) {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  
  const [allLeads, setAllLeads] = useState(propLeads || [])
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Update leads when propLeads changes
  useEffect(() => {
    if (propLeads) {
      setAllLeads(propLeads)
    } else {
      // If no leads are passed as props, use mock data
      setAllLeads(mockLeads)
    }
  }, [propLeads])

  // Map division keys to display names for filtering
  const divisionKeyMap: { [key: string]: string } = {
    'sfnc': 'Single-Family New Construction',
    'mfnc': 'Multi-Family New Construction', 
    'rr': 'R&R'
  }

  // Get current division display name from URL or DivisionSwitcher
  const currentDivisionName = divisionKeyMap[division] || 'Multi-Family New Construction'
  
  // Filter leads by current division (or show all if "all" is selected)
  const leads = division === 'all' 
    ? allLeads 
    : allLeads.filter(lead => lead.division === currentDivisionName)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine the target stage
    let targetStageId: string | null = null

    // Check if dropped directly on a stage (the stage id itself)
    const directStage = SALES_STAGES.find(stage => stage.id === overId)
    if (directStage) {
      targetStageId = directStage.id
    } else {
      // Find which stage the dropped-over lead belongs to
      const targetLead = allLeads.find(lead => lead.id === overId)
      if (targetLead) {
        targetStageId = targetLead.status
      }
    }

    if (targetStageId && targetStageId !== allLeads.find(lead => lead.id === activeId)?.status) {
      // Update the lead's status in all leads
      setAllLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === activeId
            ? { ...lead, status: targetStageId as string }
            : lead
        )
      )
      
      // In a real app, you would also update the backend here
      console.log(`Lead ${activeId} moved to ${targetStageId}`)
    }
  }

  const activeLead = activeId ? allLeads.find(lead => lead.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Sales Pipeline
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Drag and drop leads between stages to update their status
            </p>
            {/* Division Switcher */}
            <div className="mt-3">
              <DivisionSwitcher />
            </div>
          </div>
          <AddLeadDialog onLeadAdded={onLeadAdded}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </AddLeadDialog>
        </div>

        {/* Kanban Board */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 w-full max-w-full">
          <div className="overflow-x-auto overflow-y-hidden max-w-full">
            <div className="flex gap-6 min-h-[600px] pb-4" style={{ width: '2240px' }}>
              {SALES_STAGES.map((stage) => (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  <KanbanColumn
                    stage={stage}
                    leads={leads}
                    division={division}
                    onLeadAdded={onLeadAdded}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {leads.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${leads.reduce((sum, lead) => sum + lead.value, 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Pipeline Value</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {leads.filter(lead => ['qualified', 'proposal', 'negotiation'].includes(lead.status)).length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Opportunities</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {Math.round((leads.filter(lead => lead.status === 'won').length / leads.length) * 100)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Win Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeLead ? (
          <LeadCard lead={activeLead} division={division} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}