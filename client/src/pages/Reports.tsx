import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  FileBarChart,
  Target,
  Clock
} from 'lucide-react'

export default function Reports() {
  const [dateRange, setDateRange] = useState('30d')

  // Mock data for demonstration
  const revenueData = [
    { month: 'Jan', revenue: 125000, jobs: 12 },
    { month: 'Feb', revenue: 142000, jobs: 15 },
    { month: 'Mar', revenue: 138000, jobs: 14 },
    { month: 'Apr', revenue: 156000, jobs: 18 },
    { month: 'May', revenue: 178000, jobs: 21 },
    { month: 'Jun', revenue: 195000, jobs: 23 },
  ]

  const performanceMetrics = {
    totalRevenue: 934000,
    totalJobs: 103,
    avgJobValue: 9068,
    customerSatisfaction: 4.8,
    onTimeCompletion: 92,
    repeatCustomers: 35
  }

  const topCustomers = [
    { name: 'Metro Housing Partners', revenue: 125000, jobs: 8 },
    { name: 'Sunrise Apartments LLC', revenue: 98000, jobs: 6 },
    { name: 'Heritage Properties', revenue: 87000, jobs: 5 },
    { name: 'Wilson Construction', revenue: 75000, jobs: 4 },
    { name: 'Downtown Development', revenue: 67000, jobs: 3 },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Business Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track performance, analyze trends, and make data-driven decisions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(performanceMetrics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.5%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8.2%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(performanceMetrics.avgJobValue)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+3.8%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.customerSatisfaction}/5.0</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+0.2</span> from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-end justify-between space-x-2">
                {revenueData.map((data, index) => (
                  <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="text-xs text-slate-600">{formatCurrency(data.revenue)}</div>
                    <div 
                      className="bg-blue-600 rounded-t w-full transition-all hover:bg-blue-700"
                      style={{ height: `${(data.revenue / 200000) * 100}%` }}
                    />
                    <div className="text-sm font-medium">{data.month}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">On-time Completion</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {performanceMetrics.onTimeCompletion}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Repeat Customers</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {performanceMetrics.repeatCustomers}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Project Profitability</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    28%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{customer.name}</div>
                          <div className="text-xs text-slate-600">{customer.jobs} jobs</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(customer.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                Detailed revenue analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                Customer insights and analysis coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                Operations dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}