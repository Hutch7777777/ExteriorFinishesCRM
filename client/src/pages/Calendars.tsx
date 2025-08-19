import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CalendarDays, Hammer, Users, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'bid' | 'subcontracting' | 'daily'
  status?: string
  description?: string
  time?: string
  location?: string
  assignedTo?: string
}

// Mock data for now - this will be replaced with real API calls
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Residential Siding Bid',
    date: new Date(2025, 7, 20),
    type: 'bid',
    status: 'scheduled',
    description: '123 Main St - Vinyl siding estimate',
    time: '10:00 AM',
    assignedTo: 'John Smith'
  },
  {
    id: '2',
    title: 'Electrical Subcontractor Meeting',
    date: new Date(2025, 7, 22),
    type: 'subcontracting',
    status: 'confirmed',
    description: 'Discuss wiring for commercial project',
    time: '2:00 PM',
    location: 'Office'
  },
  {
    id: '3',
    title: 'Site Inspection',
    date: new Date(2025, 7, 25),
    type: 'daily',
    status: 'pending',
    description: 'Morning site walkthrough',
    time: '8:00 AM',
    location: '456 Oak Avenue'
  }
]

const CalendarGrid = ({ 
  events, 
  currentDate, 
  onDateClick 
}: { 
  events: CalendarEvent[]
  currentDate: Date
  onDateClick: (date: Date) => void 
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
                  className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)}`}
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
  
  const getEventTypeIcon = (eventType: CalendarEvent['type']) => {
    switch (eventType) {
      case 'bid':
        return <CalendarDays className="w-4 h-4" />
      case 'subcontracting':
        return <Users className="w-4 h-4" />
      case 'daily':
        return <Clock className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

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
                      {event.time && <span>{event.time}</span>}
                      {event.location && <span>{event.location}</span>}
                      {event.assignedTo && <span>Assigned: {event.assignedTo}</span>}
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

export default function Calendars() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('calendar')

  // This will be replaced with actual API calls
  const events = mockEvents

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendars</h1>
          <p className="text-gray-600">Manage your bids, subcontractor meetings, and daily schedules</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
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
            Bid Calendar
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <Users className="w-3 h-3 mr-1" />
            Subcontracting
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Clock className="w-3 h-3 mr-1" />
            Daily Schedule
          </Badge>
        </div>
      </div>

      {/* Main Calendar Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="bids">Bid Calendar</TabsTrigger>
          <TabsTrigger value="subcontracting">Subcontracting</TabsTrigger>
          <TabsTrigger value="daily">Daily Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Overview</CardTitle>
              <CardDescription>
                View all your scheduled events across bid appointments, subcontractor meetings, and daily tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarGrid 
                events={events}
                currentDate={currentDate}
                onDateClick={handleDateClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bids" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Bid Calendar
              </CardTitle>
              <CardDescription>
                Scheduled bid appointments and estimate meetings with potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventsList events={events} type="bid" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcontracting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Subcontracting Calendar
              </CardTitle>
              <CardDescription>
                Meetings and coordination with subcontractors, vendors, and partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventsList events={events} type="subcontracting" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Daily Schedule
              </CardTitle>
              <CardDescription>
                Daily tasks, site visits, inspections, and other operational activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventsList events={events} type="daily" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}