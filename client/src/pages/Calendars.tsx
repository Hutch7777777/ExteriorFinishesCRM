import React, { useState, useEffect } from 'react'
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval, isAfter, isBefore } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  endDate?: Date  // For multi-day events
  type: 'bid' | 'subcontracting' | 'daily' | 'inspection' | 'delivery'
  calendarType: 'bids' | 'subcontractors' | 'daily' | 'inspections' | 'deliveries'
  status?: string
  description?: string
  time?: string
  endTime?: string  // For events with duration
  location?: string
  assignedTo?: string
  isMultiDay?: boolean
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
  },
  {
    id: '9',
    title: 'Commercial Roofing Project',
    date: new Date(2025, 7, 22),
    endDate: new Date(2025, 7, 25),
    type: 'daily',
    calendarType: 'daily',
    status: 'in-progress',
    description: 'Multi-day roofing installation at downtown office complex',
    location: 'Downtown Office Complex',
    assignedTo: 'Mike Johnson',
    isMultiDay: true
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

// Helper function to format time display with AM/PM
const formatTimeDisplay = (timeString: string): string => {
  if (!timeString) return ''
  
  // Handle both "HH:MM" and "H:MM" formats
  const timeParts = timeString.split(':')
  if (timeParts.length !== 2) return timeString // Return original if invalid format
  
  const [hours, minutes] = timeParts
  const hour24 = parseInt(hours)
  
  // Validate hour and minute values
  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return timeString
  if (isNaN(parseInt(minutes)) || parseInt(minutes) < 0 || parseInt(minutes) > 59) return timeString
  
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const period = hour24 >= 12 ? 'PM' : 'AM'
  
  return `${hour12}:${minutes} ${period}`
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
    return events.filter(event => {
      // For single-day events, check if it's the same day
      if (!event.isMultiDay || !event.endDate) {
        return isSameDay(event.date, date)
      }
      
      // For multi-day events, check if the date falls within the range (inclusive)
      const startDate = new Date(event.date)
      const endDate = new Date(event.endDate)
      
      // Set times to start/end of day for accurate comparison
      const dateToCheck = new Date(date)
      dateToCheck.setHours(12, 0, 0, 0) // Midday for comparison
      
      startDate.setHours(0, 0, 0, 0) // Start of start day
      endDate.setHours(23, 59, 59, 999) // End of end day
      
      // Check if date falls within the range (inclusive of start and end dates)
      return dateToCheck >= startDate && dateToCheck <= endDate
    })
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
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden auto-rows-auto">
      {/* Header row */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700 h-10 flex items-center justify-center">
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
              min-h-[120px] bg-white p-1 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col
              ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
              ${isToday ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
              ${dayEvents.length > 3 ? 'min-h-[160px]' : ''}
              ${dayEvents.length > 5 ? 'min-h-[200px]' : ''}
            `}
          >
            <div className={`text-sm font-medium mb-1 flex-shrink-0 ${isToday ? 'text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>
            
            <div className="flex-1 space-y-0.5 overflow-hidden">
              {dayEvents.map(event => {
                // Check if this is a multi-day event and what day of the event this is
                const isMultiDay = event.isMultiDay && event.endDate
                const isStartDay = isSameDay(event.date, day)
                const isEndDay = isMultiDay && event.endDate && isSameDay(new Date(event.endDate), day)
                const isContinuation = isMultiDay && !isStartDay && !isEndDay
                
                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent day click
                      onEventClick(event)
                    }}
                    className={`text-xs p-1 border cursor-pointer hover:shadow-sm transition-shadow ${getEventTypeColor(event.type)} ${
                      isMultiDay ? 'relative' : 'rounded'
                    } ${
                      isStartDay && isMultiDay ? 'rounded-l' : ''
                    } ${
                      isEndDay && isMultiDay ? 'rounded-r' : ''
                    } ${
                      isContinuation ? 'rounded-none border-l-0 border-r-0' : ''
                    } ${
                      dayEvents.length > 4 ? 'mb-0' : ''
                    }`}
                    title={`${event.title} - ${event.time ? formatTimeDisplay(event.time) : 'All day'}${isMultiDay && event.endDate ? ` (${format(event.date, 'MMM d')} - ${format(new Date(event.endDate), 'MMM d')})` : ''}`}
                  >
                    <div className={`font-medium ${dayEvents.length > 6 ? 'truncate' : ''}`}>
                      {isContinuation ? `↔ ${event.title}` : event.title}
                    </div>
                    {event.time && isStartDay && dayEvents.length <= 4 && (
                      <div className="truncate">{formatTimeDisplay(event.time)}</div>
                    )}
                    {isMultiDay && isStartDay && dayEvents.length <= 4 && (
                      <div className="text-xs opacity-75">Multi-day →</div>
                    )}
                    {isMultiDay && isEndDay && dayEvents.length <= 4 && (
                      <div className="text-xs opacity-75">← Ends</div>
                    )}
                  </div>
                )
              })}
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
                          {formatTimeDisplay(event.time)}
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
  open,
  onClose,
  onAddEvent,
  onSave,
  selectedDate,
  initialData
}: { 
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  onAddEvent?: (eventData: {
    title: string
    type: CalendarEvent['type']
    calendarType: CalendarEvent['calendarType']
    date: string
    endDate?: string
    time: string
    endTime?: string
    location: string
    description: string
    assignedTo: string
    isMultiDay: boolean
  }) => void
  onSave?: (eventData: {
    title: string
    type: CalendarEvent['type']
    calendarType: CalendarEvent['calendarType']
    date: string
    endDate?: string
    time: string
    endTime?: string
    location: string
    description: string
    assignedTo: string
    isMultiDay: boolean
  }) => void
  selectedDate?: Date | null
  initialData?: CalendarEvent | null
}) => {
  const dialogOpen = isOpen || open || false
  const isEditMode = !!initialData
  
  const [newEvent, setNewEvent] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'bid' as CalendarEvent['type'],
    calendarType: initialData?.calendarType || 'bids' as CalendarEvent['calendarType'],
    date: initialData?.date ? format(initialData.date, 'yyyy-MM-dd') : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    endDate: initialData?.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : '',
    time: initialData?.time || '',
    endTime: initialData?.endTime || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    assignedTo: initialData?.assignedTo || '',
    isMultiDay: initialData?.isMultiDay || false
  })

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (dialogOpen && initialData) {
      setNewEvent({
        title: initialData.title || '',
        type: initialData.type || 'bid',
        calendarType: initialData.calendarType || 'bids',
        date: format(initialData.date, 'yyyy-MM-dd'),
        endDate: initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : '',
        time: initialData.time || '',
        endTime: initialData.endTime || '',
        location: initialData.location || '',
        description: initialData.description || '',
        assignedTo: initialData.assignedTo || '',
        isMultiDay: initialData.isMultiDay || false
      })
    } else if (dialogOpen && selectedDate) {
      setNewEvent(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }))
    }
  }, [dialogOpen, initialData, selectedDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!newEvent.title || !newEvent.date || !newEvent.calendarType) {
      alert('Please fill in all required fields')
      return
    }
    
    // Validate multi-day event dates
    if (newEvent.isMultiDay && (!newEvent.endDate || new Date(newEvent.endDate) < new Date(newEvent.date))) {
      alert('End date must be after start date for multi-day events')
      return
    }
    
    // Call appropriate handler based on mode
    if (isEditMode && onSave) {
      onSave(newEvent)
    } else if (onAddEvent) {
      onAddEvent(newEvent)
    }
    
    // Close dialog and reset form
    onClose()
    if (!isEditMode) {
      setNewEvent({
        title: '',
        type: 'bid',
        calendarType: 'bids',
        date: '',
        endDate: '',
        time: '',
        endTime: '',
        location: '',
        description: '',
        assignedTo: '',
        isMultiDay: false
      })
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Event' : 'New Calendar Event'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the event details below.'
              : 'Schedule a new bid appointment, subcontractor meeting, or daily task.'
            }
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
          
          {/* Multi-day toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isMultiDay"
              checked={newEvent.isMultiDay}
              onChange={(e) => setNewEvent({ ...newEvent, isMultiDay: e.target.checked, endDate: e.target.checked ? newEvent.date : '' })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isMultiDay" className="text-sm font-medium">Multi-day event</Label>
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{newEvent.isMultiDay ? 'Start Date' : 'Date'}</Label>
              <Input
                id="date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
              />
            </div>
            {newEvent.isMultiDay && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  min={newEvent.date}
                  required={newEvent.isMultiDay}
                />
              </div>
            )}
          </div>

          {/* Time selection with dropdown-style picker */}
          {!newEvent.isMultiDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select 
                  value={newEvent.time} 
                  onValueChange={(value) => setNewEvent({ ...newEvent, time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {[
                      '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
                      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
                      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
                      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
                    ].map((timeLabel) => {
                      // Convert display time to 24-hour format for value
                      const [time, period] = timeLabel.split(' ')
                      const [hours, minutes] = time.split(':')
                      let hour24 = parseInt(hours)
                      
                      if (period === 'PM' && hour24 !== 12) {
                        hour24 += 12
                      } else if (period === 'AM' && hour24 === 12) {
                        hour24 = 0
                      }
                      
                      const timeValue = `${hour24.toString().padStart(2, '0')}:${minutes}`
                      
                      return (
                        <SelectItem key={timeLabel} value={timeValue}>
                          {timeLabel}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>End Time (Optional)</Label>
                <Select 
                  value={newEvent.endTime} 
                  onValueChange={(value) => setNewEvent({ ...newEvent, endTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {[
                      '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM',
                      '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
                      '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM',
                      '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM',
                      '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
                    ].map((timeLabel) => {
                      // Convert display time to 24-hour format for value
                      const [time, period] = timeLabel.split(' ')
                      const [hours, minutes] = time.split(':')
                      let hour24 = parseInt(hours)
                      
                      if (period === 'PM' && hour24 !== 12) {
                        hour24 += 12
                      } else if (period === 'AM' && hour24 === 12) {
                        hour24 = 0
                      }
                      
                      const timeValue = `${hour24.toString().padStart(2, '0')}:${minutes}`
                      
                      return (
                        <SelectItem key={timeLabel} value={timeValue}>
                          {timeLabel}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
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
              {isEditMode ? 'Update Event' : 'Create Event'}
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
  onEdit,
  onDelete,
  event
}: { 
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
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
            Event details for {event.isMultiDay && event.endDate 
              ? `${format(event.date, 'MMMM d')} - ${format(new Date(event.endDate), 'MMMM d, yyyy')}`
              : format(event.date, 'MMMM d, yyyy')
            }
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
              <Label className="text-sm font-medium text-gray-600">
                {event.isMultiDay ? 'Duration' : 'Date'}
              </Label>
              <p className="text-sm flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {event.isMultiDay && event.endDate 
                  ? `${format(event.date, 'MMM d, yyyy')} - ${format(new Date(event.endDate), 'MMM d, yyyy')}`
                  : format(event.date, 'EEEE, MMMM d, yyyy')
                }
              </p>
            </div>
            {event.time && !event.isMultiDay && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Time</Label>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTimeDisplay(event.time)}
                  {event.endTime && ` - ${formatTimeDisplay(event.endTime)}`}
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

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onEdit}
            >
              Edit Event
            </Button>
            <Button 
              variant="destructive"
              onClick={onDelete}
            >
              Delete Event
            </Button>
          </div>
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
  const [showEditEventDialog, setShowEditEventDialog] = useState(false)
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
    endDate?: string
    time: string
    endTime?: string
    location: string
    description: string
    assignedTo: string
    isMultiDay: boolean
  }) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(), // Simple ID generation
      title: eventData.title,
      date: new Date(eventData.date),
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      type: eventData.type,
      calendarType: eventData.calendarType,
      status: 'scheduled',
      description: eventData.description,
      time: eventData.time,
      endTime: eventData.endTime,
      location: eventData.location,
      assignedTo: eventData.assignedTo,
      isMultiDay: eventData.isMultiDay
    }
    
    setAllEvents(prev => [...prev, newEvent])
  }

  // Function to update existing event
  const handleUpdateEvent = (eventData: {
    title: string
    type: CalendarEvent['type']
    calendarType: CalendarEvent['calendarType']
    date: string
    endDate?: string
    time: string
    endTime?: string
    location: string
    description: string
    assignedTo: string
    isMultiDay: boolean
  }) => {
    if (!selectedEvent) return
    
    const updatedEvent: CalendarEvent = {
      ...selectedEvent,
      title: eventData.title,
      date: new Date(eventData.date),
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      type: eventData.type,
      calendarType: eventData.calendarType,
      description: eventData.description,
      time: eventData.time,
      endTime: eventData.endTime,
      location: eventData.location,
      assignedTo: eventData.assignedTo,
      isMultiDay: eventData.isMultiDay
    }
    
    setAllEvents(prev => prev.map(event => 
      event.id === selectedEvent.id ? updatedEvent : event
    ))
  }

  const handleEditEvent = () => {
    setShowEventDetailsDialog(false)
    setShowEditEventDialog(true)
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    
    if (confirm(`Are you sure you want to delete "${selectedEvent.title}"? This action cannot be undone.`)) {
      setAllEvents(prev => prev.filter(event => event.id !== selectedEvent.id))
      setShowEventDetailsDialog(false)
      setSelectedEvent(null)
    }
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
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
      />
      
      <NewEventDialog 
        open={showEditEventDialog}
        onClose={() => setShowEditEventDialog(false)}
        onSave={handleUpdateEvent}
        selectedDate={selectedEvent?.date}
        initialData={selectedEvent}
      />
    </div>
  )
}