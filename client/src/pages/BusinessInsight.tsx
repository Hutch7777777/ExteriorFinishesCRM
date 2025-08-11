import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Send, 
  FileText, 
  TrendingUp, 
  Target, 
  Building,
  Users,
  DollarSign,
  MessageSquare,
  Loader2,
  Sparkles
} from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'

interface InsightMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reportType?: string
}

interface SuggestedReport {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  prompt: string
}

const suggestedReports: SuggestedReport[] = [
  {
    id: 'competition-analysis',
    title: 'Competition Analysis',
    description: 'Analyze competitors in the Seattle siding market including pricing, services, and market positioning',
    icon: <Target className="w-5 h-5" />,
    prompt: 'Provide a comprehensive analysis of the competition in the Seattle siding market. Include major competitors, their pricing strategies, service offerings, market share, and how Exterior Finishes can differentiate itself.'
  },
  {
    id: 'market-trends',
    title: 'Market Trends Report',
    description: 'Current trends in the siding industry, material preferences, and seasonal patterns',
    icon: <TrendingUp className="w-5 h-5" />,
    prompt: 'Generate a report on current market trends in the siding industry for the Seattle area. Include material preferences, seasonal demand patterns, emerging technologies, and customer preferences.'
  },
  {
    id: 'customer-insights',
    title: 'Customer Insights',
    description: 'Analysis of customer demographics, preferences, and behavior patterns in our CRM data',
    icon: <Users className="w-5 h-5" />,
    prompt: 'Analyze our customer data to provide insights on demographics, project preferences, seasonal patterns, and recommendations for targeting high-value customers.'
  },
  {
    id: 'pricing-strategy',
    title: 'Pricing Strategy',
    description: 'Recommendations for competitive pricing based on market analysis and cost structures',
    icon: <DollarSign className="w-5 h-5" />,
    prompt: 'Provide pricing strategy recommendations for Exterior Finishes based on market analysis, competitor pricing, and our service offerings. Include recommendations for different project types and customer segments.'
  },
  {
    id: 'sales-performance',
    title: 'Sales Performance',
    description: 'Analysis of sales pipeline, conversion rates, and recommendations for improvement',
    icon: <Building className="w-5 h-5" />,
    prompt: 'Analyze our sales performance including lead conversion rates, pipeline health, average deal size, and provide recommendations for improving sales outcomes.'
  }
]

export default function BusinessInsight() {
  const params = useParams({ strict: false })
  const division = (params as any)?.division || 'mfnc'
  const queryClient = useQueryClient()
  
  const [messages, setMessages] = useState<InsightMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Business Insight Assistant powered by Claude. I can help you generate comprehensive reports about the Seattle siding market, analyze competition, and provide strategic insights for Exterior Finishes. What would you like to explore today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Get business data for context
  const { data: customers } = useQuery({
    queryKey: ['/api/trpc/customers.list', division],
    staleTime: 5 * 60 * 1000,
  })

  const { data: estimates } = useQuery({
    queryKey: ['/api/trpc/estimates.list', division],
    staleTime: 5 * 60 * 1000,
  })

  const generateInsightMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const requestData = {
        prompt,
        division,
        context: {
          customerCount: Array.isArray(customers) ? customers.length : 0,
          estimateCount: Array.isArray(estimates) ? estimates.length : 0,
          businessType: 'siding_contractor',
          location: 'Seattle'
        }
      }
      const response = await apiRequest('POST', '/api/business-insight/generate', requestData)
      return await response.json()
    },
    onSuccess: (response: any) => {
      const newMessage: InsightMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.insight || 'I apologize, but I was unable to generate the requested insight at this time.',
        timestamp: new Date(),
        reportType: response.reportType
      }
      setMessages(prev => [...prev, newMessage])
      setIsGenerating(false)
    },
    onError: (error) => {
      console.error('Failed to generate insight:', error)
      const errorMessage: InsightMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error generating your report. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsGenerating(false)
    }
  })

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return

    const userMessage: InsightMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsGenerating(true)

    generateInsightMutation.mutate(inputMessage)
  }

  const handleSuggestedReport = (report: SuggestedReport) => {
    const userMessage: InsightMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: report.title,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    generateInsightMutation.mutate(report.prompt)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Insight</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              AI-powered market analysis and strategic insights for Exterior Finishes
            </p>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Claude
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Suggested Reports Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Reports
                </CardTitle>
                <CardDescription>
                  Generate comprehensive insights with one click
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedReports.map((report) => (
                  <Button
                    key={report.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left hover:bg-blue-50 dark:hover:bg-slate-800"
                    onClick={() => handleSuggestedReport(report)}
                    disabled={isGenerating}
                  >
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <div className="text-[#4A6FA5] mt-0.5 flex-shrink-0">
                        {report.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 text-slate-900 dark:text-white">
                          {report.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                          {report.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#4A6FA5]" />
                  <CardTitle className="text-lg">AI Assistant</CardTitle>
                </div>
                <CardDescription>
                  Ask questions about market analysis, competition, or strategic insights
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6 pb-0">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white'
                              : 'bg-slate-50 dark:bg-slate-800 border'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                            {message.content}
                          </div>
                          <div className={`text-xs mt-2 opacity-70 ${
                            message.role === 'user' ? 'text-white' : 'text-slate-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                          {message.reportType && (
                            <Badge variant="secondary" className="mt-2">
                              {message.reportType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-slate-50 dark:bg-slate-800 border rounded-lg p-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating insight...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Input Area */}
                <div className="p-6 pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask about competition, market trends, customer insights, or request a custom report..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none min-h-[60px]"
                      disabled={isGenerating}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isGenerating}
                      className="bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] hover:from-[#3A5A95] hover:to-[#1C2E40] self-end"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}