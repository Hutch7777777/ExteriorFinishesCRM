import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  Phone,
  Video,
  Paperclip,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  type: 'text' | 'file' | 'announcement'
  read: boolean
}

interface Channel {
  id: string
  name: string
  type: 'general' | 'project' | 'direct'
  participants: string[]
  unreadCount: number
  lastMessage?: Message
}

export default function Communication() {
  const [selectedChannel, setSelectedChannel] = useState('general')
  const [messageInput, setMessageInput] = useState('')

  // Mock data for demonstration
  const channels: Channel[] = [
    {
      id: 'general',
      name: 'General',
      type: 'general',
      participants: ['John', 'Sarah', 'Mike', 'Lisa'],
      unreadCount: 2,
      lastMessage: {
        id: '1',
        sender: 'Sarah',
        content: 'Great job on the Metro Housing project!',
        timestamp: '2025-01-09T10:30:00Z',
        type: 'text',
        read: false
      }
    },
    {
      id: 'metro-project',
      name: 'Metro Housing Project',
      type: 'project',
      participants: ['John', 'Mike', 'David'],
      unreadCount: 0,
      lastMessage: {
        id: '2',
        sender: 'Mike',
        content: 'Scheduling inspection for tomorrow at 2 PM',
        timestamp: '2025-01-09T09:15:00Z',
        type: 'text',
        read: true
      }
    },
    {
      id: 'sarah-direct',
      name: 'Sarah Williams',
      type: 'direct',
      participants: ['You', 'Sarah'],
      unreadCount: 1,
      lastMessage: {
        id: '3',
        sender: 'Sarah',
        content: 'Can we discuss the painting schedule?',
        timestamp: '2025-01-09T08:45:00Z',
        type: 'text',
        read: false
      }
    }
  ]

  const messages: Message[] = [
    {
      id: '1',
      sender: 'John Smith',
      content: 'Good morning team! Just wanted to update everyone on the Metro Housing project status.',
      timestamp: '2025-01-09T09:00:00Z',
      type: 'text',
      read: true
    },
    {
      id: '2',
      sender: 'Sarah Williams',
      content: 'Thanks for the update John. The exterior painting should be completed by Friday.',
      timestamp: '2025-01-09T09:15:00Z',
      type: 'text',
      read: true
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      content: 'I\'ve scheduled the final inspection for next Tuesday. All subcontractors have been notified.',
      timestamp: '2025-01-09T09:30:00Z',
      type: 'text',
      read: true
    },
    {
      id: '4',
      sender: 'David Chen',
      content: 'Project timeline looks good. Customer is very satisfied with the progress.',
      timestamp: '2025-01-09T10:00:00Z',
      type: 'text',
      read: true
    },
    {
      id: '5',
      sender: 'Sarah Williams',
      content: 'Great job on the Metro Housing project! The client sent positive feedback.',
      timestamp: '2025-01-09T10:30:00Z',
      type: 'text',
      read: false
    }
  ]

  const currentChannel = channels.find(c => c.id === selectedChannel)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', messageInput)
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Channels Sidebar */}
      <div className="w-80 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Team Communication
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Stay connected with your team and project updates
          </p>
        </div>

        {/* Channel Categories */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Channels
            </h3>
            <div className="space-y-1">
              {channels.filter(c => c.type !== 'direct').map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedChannel === channel.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium"># {channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-red-500 text-white">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {channels.filter(c => c.type === 'direct').map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedChannel === channel.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(channel.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-red-500 text-white">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentChannel?.type === 'direct' ? (
                <Avatar>
                  <AvatarFallback>
                    {getInitials(currentChannel.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">
                  {currentChannel?.type === 'direct' ? currentChannel.name : `# ${currentChannel?.name}`}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentChannel?.participants.length} participants
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-20rem)] p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                        {message.sender}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.read ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-end gap-3">
            <Button variant="ghost" size="sm" className="mb-2">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${currentChannel?.type === 'direct' ? currentChannel.name : `# ${currentChannel?.name}`}...`}
                className="min-h-[40px] max-h-32 resize-none border-slate-200 dark:border-slate-800"
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="mb-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}