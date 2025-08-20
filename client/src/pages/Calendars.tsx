import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, CalendarDays, Hammer, Users, Clock, Plus, ChevronLeft, ChevronRight, MapPin, User, ArrowLeft, Home } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'bid' | 'subcontracting' | 'daily' | 'inspection' | 'delivery'
  calendarType: 'bids' | 'subcontractors' | 'daily' | 'inspections' | 'deliveries'
  status?: string
  description?: string
  time?: string
  location?: string
  assignedTo?: string
}

// Sample events for demonstration - these would come from your backend API
let mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Residential Siding Bid',
    date: new Date(2025, 7, 20),
    type: 'bid',
    calendarType: 'bids',
    status: 'scheduled',
    description: '123 Main St - Vinyl siding estimate',
    time: '10:00 AM',
    assignedTo: 'John Smith'
  },
  {
    id: '2',
    title: 'Commercial Roofing Bid',
    date: new Date(2025, 7, 21),
    type: 'bid',
    calendarType: 'bids',
    status: 'confirmed',
    description: 'Downtown office building roofing assessment',
    time: '2:00 PM',
    assignedTo: 'Mike Johnson'
  },
  {
    id: '3',
    title: 'Electrical Subcontractor Meeting',
    date: new Date(2025, 7, 22),
    type: 'subcontracting',
    calendarType: 'subcontractors',
    status: 'confirmed',
    description: 'Discuss wiring for commercial project',
    time: '2:00 PM',
    location: 'Office',
    assignedTo: 'Sarah Davis'
  },
  {
    id: '4',
    title: 'HVAC Coordination Call',
    date: new Date(2025, 7, 23),
    type: 'subcontracting',
    calendarType: 'subcontractors',
    status: 'scheduled',
    description: 'Review installation timeline with HVAC team',
    time: '9:00 AM',
    location: 'Remote',
    assignedTo: 'Tom Wilson'
  },
  {
    id: '5',
    title: 'Site Inspection',
    date: new Date(2025, 7, 25),
    type: 'inspection',
    calendarType: 'inspections',
    status: 'pending',
    description: 'Morning site walkthrough',
    time: '8:00 AM',
    location: '456 Oak Avenue',
    assignedTo: 'John Smith'
  },
  {
    id: '6',
    title: 'Material Delivery',
    date: new Date(2025, 7, 26),
    type: 'delivery',
    calendarType: 'deliveries',
    status: 'scheduled',
    description: 'Siding materials arrival for Oak St project',
    time: '7:00 AM',
    location: '789 Oak Street',
    assignedTo: 'Mike Johnson'
  },
  {
    id: '7',
    title: 'Customer Follow-up',
    date: new Date(2025, 7, 27),
    type: 'daily',
    calendarType: 'daily',
    status: 'pending',
    description: 'Check in with recent installation customers',
    time: '3:00 PM',
    assignedTo: 'Sarah Davis'
  },
  {
    id: '8',
    title: 'Industrial Siding Estimate',
    date: new Date(2025, 7, 28),
    type: 'bid',
    calendarType: 'bids',
    status: 'scheduled',
    description: 'Large warehouse siding evaluation',
    time: '11:00 AM',
    location: 'Industrial District',
    assignedTo: 'Tom Wilson'
  }
]

// Shared utility functions
const getEventTypeIcon = (eventType: CalendarEvent['type']) => {
  switch (eventType) {
    case 'bid':
      return <CalendarDays className="w-4 h-4" />
    case 'subcontracting':
      return <Users className="w-4 h-4" />
    case 'daily':
      return <Clock className="w-4 h-4" />
    case 'inspection':
      return <Hammer className="w-4 h-4" />
    case 'delivery':
      return <MapPin className="w-4 h-4" />
    default:
      return <Calendar className="w-4 h-4" />
  }
}

const CalendarGrid = ({ 
  events, 
  currentDate, 
  onDateClick,
  onEventClick
}: { 
  events: CalendarEvent[]
  currentDate: Date
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}) => {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'bid':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'subcontracting':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'daily':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
      {/* Header row */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map(day => {
        const dayEvents = getEventsForDay(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isToday = isSameDay(day, new Date())
        
        return (
          <div
            key={day.toString()}
            onClick={() => onDateClick(day)}
            className={`
              min-h-[120px] bg-white p-1 cursor-pointer hover:bg-gray-50 transition-colors
              ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
              ${isToday ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
            `}
          >
            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 2).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent day click
                    onEventClick(event)
                  }}
                  className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getEventTypeColor(event.type)}`}
                  title={`${event.title} - ${event.time || 'All day'}`}
                >
                  <div className="truncate font-medium">{event.title}</div>
                  {event.time && <div className="truncate">{event.time}</div>}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const EventsList = ({ 
  events, 
  type 
}: { 
  events: CalendarEvent[]
  type?: CalendarEvent['type'] 
}) => {
  const filteredEvents = type ? events.filter(e => e.type === type) : events
  


  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-3">
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled</p>
        </div>
      ) : (
        filteredEvents.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{format(event.date, 'MMM d, yyyy')}</span>
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      {event.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(event.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

const NewEventDialog = ({ 
  isOpen, 
  onClose,
  onAddEvent
}: { 
  isOpen: boolean
  onClose: () => void
  onAddEvent: (eventData: {
    title: string
    type: CalendarEvent['type']
    calendarType: CalendarEvent['calendarType']
    date: string
    time: string
    location: string
    description: string
    assignedTo: string
  }) => void
}) => {
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'bid' as CalendarEvent['type'],
    calendarType: 'bids' as CalendarEvent['calendarType'],
    date: '',
    time: '',
    location: '',
    description: '',
    assignedTo: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!newEvent.title || !newEvent.date || !newEvent.calendarType) {
      alert('Please fill in all required fields')
      return
    }
    
    // Add the event to the appropriate calendar
    onAddEvent(newEvent)
    
    // Close dialog and reset form
    onClose()
    setNewEvent({
      title: '',
      type: 'bid',
      calendarType: 'bids',
      date: '',
      time: '',
      location: '',
      description: '',
      assignedTo: ''
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Calendar Event</DialogTitle>
          <DialogDescription>
            Schedule a new bid appointment, subcontractor meeting, or daily task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="calendarType">Save to Calendar</Label>
            <Select 
              value={newEvent.calendarType} 
              onValueChange={(value: CalendarEvent['calendarType']) => {
                setNewEvent({ ...newEvent, calendarType: value })
                // Auto-update type based on calendar selection
                if (value === 'bids') setNewEvent(prev => ({ ...prev, calendarType: value, type: 'bid' }))
                else if (value === 'subcontractors') setNewEvent(prev => ({ ...prev, calendarType: value, type: 'subcontracting' }))
                else if (value === 'daily') setNewEvent(prev => ({ ...prev, calendarType: value, type: 'daily' }))
                else if (value === 'inspections') setNewEvent(prev => ({ ...prev, calendarType: value, type: 'inspection' }))
                else if (value === 'deliveries') setNewEvent(prev => ({ ...prev, calendarType: value, type: 'delivery' }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bids">Bid Appointments</SelectItem>
                <SelectItem value="subcontractors">Subcontractor Meetings</SelectItem>
                <SelectItem value="daily">Daily Operations</SelectItem>
                <SelectItem value="inspections">Site Inspections</SelectItem>
                <SelectItem value="deliveries">Material Deliveries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              placeholder="Enter location or address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select value={newEvent.assignedTo} onValueChange={(value) => setNewEvent({ ...newEvent, assignedTo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="John Smith">John Smith</SelectItem>
                <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                <SelectItem value="Sarah Davis">Sarah Davis</SelectItem>
                <SelectItem value="Tom Wilson">Tom Wilson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Add event details..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Event Details Dialog Component
const EventDetailsDialog = ({ 
  isOpen, 
  onClose,
  event
}: { 
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
}) => {
  if (!event) return null

  const getEventTypeDisplay = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'bid': return 'Bid Appointment'
      case 'subcontracting': return 'Subcontractor Meeting'
      case 'daily': return 'Daily Operations'
      case 'inspection': return 'Site Inspection'
      case 'delivery': return 'Material Delivery'
      default: return type
    }
  }

  const getCalendarTypeDisplay = (calendarType: CalendarEvent['calendarType']) => {
    switch (calendarType) {
      case 'bids': return 'Bid Appointments'
      case 'subcontractors': return 'Subcontractor Meetings'
      case 'daily': return 'Daily Operations'
      case 'inspections': return 'Site Inspections'
      case 'deliveries': return 'Material Deliveries'
      default: return calendarType
    }
  }

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getEventTypeIcon(event.type)}
            {event.title}
          </DialogTitle>
          <DialogDescription>
            Event details for {format(event.date, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Event Type and Calendar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Event Type</Label>
              <p className="text-sm">{getEventTypeDisplay(event.type)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Calendar</Label>
              <p className="text-sm">{getCalendarTypeDisplay(event.calendarType)}</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Date</Label>
              <p className="text-sm flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {format(event.date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            {event.time && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Time</Label>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </p>
              </div>
            )}
          </div>

          {/* Location and Assigned To */}
          {(event.location || event.assignedTo) && (
            <div className="grid grid-cols-2 gap-4">
              {event.location && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location</Label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </p>
                </div>
              )}
              {event.assignedTo && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned To</Label>
                  <p className="text-sm flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {event.assignedTo}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          {event.status && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div className="mt-1">
                <Badge variant="secondary" className={getStatusBadgeColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Description</Label>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Calendar types with separate data
const calendarTypes = [
  { id: 'overview', name: 'Calendar Overview', description: 'View all your scheduled events across bid appointments, subcontractor meetings, and daily tasks' },
  { id: 'bids', name: 'Bid Appointments', description: 'Schedule and track bid appointments with customers' },
  { id: 'subcontractors', name: 'Subcontractor Meetings', description: 'Coordinate meetings and schedules with subcontractors' },
  { id: 'daily', name: 'Daily Operations', description: 'Manage daily tasks and operational activities' },
  { id: 'inspections', name: 'Site Inspections', description: 'Schedule and track site inspections and follow-ups' },
  { id: 'deliveries', name: 'Material Deliveries', description: 'Track material deliveries and logistics' }
]

export default function Calendars() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeCalendar, setActiveCalendar] = useState('overview')
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(mockEvents)

  // Filter events based on active calendar
  const getEventsForCalendar = (calendarId: string) => {
    if (calendarId === 'overview') return allEvents
    return allEvents.filter(e => e.calendarType === calendarId)
  }

  const events = getEventsForCalendar(activeCalendar)
  const currentCalendar = calendarTypes.find(c => c.id === activeCalendar)

  // Function to add new event
  const handleAddEvent = (eventData: {
    title: string
    type: CalendarEvent['type']
    calendarType: CalendarEvent['calendarType']
    date: string
    time: string
    location: string
    description: string
    assignedTo: string
  }) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(), // Simple ID generation
      title: eventData.title,
      date: new Date(eventData.date),
      type: eventData.type,
      calendarType: eventData.calendarType,
      status: 'scheduled',
      description: eventData.description,
      time: eventData.time,
      location: eventData.location,
      assignedTo: eventData.assignedTo
    }
    
    setAllEvents(prev => [...prev, newEvent])
  }

  const handleBackToMain = () => {
    window.location.href = '/mfnc/lead-management'
  }

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetailsDialog(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBackToMain}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Main
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentCalendar?.name || 'Business Calendars'}</h1>
            <p className="text-gray-600">{currentCalendar?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {events.length} events this month
          </div>
          <Button 
            onClick={() => setShowNewEventDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Type Selector */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {calendarTypes.map((calendar) => (
            <button
              key={calendar.id}
              onClick={() => setActiveCalendar(calendar.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeCalendar === calendar.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {calendar.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CalendarDays className="w-3 h-3 mr-1" />
            {events.filter(e => e.type === 'bid').length} Bids
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <Users className="w-3 h-3 mr-1" />
            {events.filter(e => e.type === 'subcontracting').length} Subcontractor
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Clock className="w-3 h-3 mr-1" />
            {events.filter(e => e.type === 'daily').length} Daily Tasks
          </Badge>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-6">
          <CalendarGrid 
            events={events}
            currentDate={currentDate}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </CardContent>
      </Card>
      
      <NewEventDialog 
        isOpen={showNewEventDialog}
        onClose={() => setShowNewEventDialog(false)}
        onAddEvent={handleAddEvent}
      />
      
      <EventDetailsDialog 
        isOpen={showEventDetailsDialog}
        onClose={() => setShowEventDetailsDialog(false)}
        event={selectedEvent}
      />
    </div>
  )
}