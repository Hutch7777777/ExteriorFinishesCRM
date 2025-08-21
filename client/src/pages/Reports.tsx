import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Clock,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react'

export default function Reports() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedDivision, setSelectedDivision] = useState('all')

  // Fetch real analytics data for selected division
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['/api/trpc/analytics.overview', dateRange, selectedDivision],
    queryFn: () => 
      fetch(`/api/trpc/analytics.overview?dateRange=${dateRange}&divisionKey=${selectedDivision}`)
        .then(res => res.json())
        .then(data => data.result.json)
  })

  const analytics = analyticsResponse || {
    overview: {
      totalRevenue: 0,
      revenueChange: 0,
      completedJobs: 0,
      jobsChange: 0,
      avgJobValue: 0,
      avgJobValueChange: 0,
      conversionRate: 0,
      conversionRateChange: 0,
      totalLeads: 0,
      wonLeads: 0,
      onTimeCompletion: 0,
      repeatCustomerPercentage: 0
    },
    monthlyRevenue: [],
    topCustomers: [],
    leadMetrics: {
      byStatus: {
        new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0
      },
      totalValue: 0,
      wonValue: 0
    }
  }

  const formatCurrency = (amountCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amountCents / 100)
  }

  const formatPercentChange = (change: number) => {
    const isPositive = change >= 0
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <span className={`text-xs ${colorClass} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {Math.abs(change).toFixed(1)}%
      </span>
    )
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

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={(value) => {
        const divisionMap: Record<string, string> = {
          'overview': 'all',
          'sfnc': 'sfnc', 
          'mfnc': 'mfnc',
          'rr': 'rr'
        }
        setSelectedDivision(divisionMap[value] || 'all')
      }}>
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">Overview (All Divisions)</TabsTrigger>
          <TabsTrigger value="sfnc">Single Family NC</TabsTrigger>
          <TabsTrigger value="mfnc">Multi Family NC</TabsTrigger>
          <TabsTrigger value="rr">R&R</TabsTrigger>
        </TabsList>

        {/* Overview Tab - All Divisions */}
        <TabsContent value="overview" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">All Divisions Overview</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Combined analytics across SFNC, MFNC, and R&R divisions</p>
          </div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.revenueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.completedJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.jobsChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.avgJobValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.avgJobValueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.conversionRateChange)} from last period
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
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-slate-500">Loading revenue data...</div>
                </div>
              ) : analytics.monthlyRevenue.length > 0 ? (
                <div className="h-80 flex items-end justify-between space-x-2">
                  {analytics.monthlyRevenue.map((data: any, index: number) => {
                    const maxRevenue = Math.max(...analytics.monthlyRevenue.map((d: any) => d.revenue));
                    const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                        <div className="text-xs text-slate-600">{formatCurrency(data.revenue)}</div>
                        <div 
                          className="bg-blue-600 rounded-t w-full transition-all hover:bg-blue-700"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <div className="text-sm font-medium">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-slate-500">No revenue data available for this period</div>
                </div>
              )}
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
                    {analytics.overview.onTimeCompletion.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Repeat Customers</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {analytics.overview.repeatCustomerPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lead Conversion Rate</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {analytics.overview.conversionRate.toFixed(1)}%
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
                  {analytics.topCustomers.length > 0 ? (
                    analytics.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between">
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No customer revenue data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Single Family NC Tab */}
        <TabsContent value="sfnc" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Single Family NC Division</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Analytics for Single Family North Carolina projects</p>
          </div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.revenueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.completedJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.jobsChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.avgJobValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.avgJobValueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.conversionRateChange)} from last period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">Loading revenue data...</div>
                  </div>
                ) : analytics.monthlyRevenue.length > 0 ? (
                  <div className="h-80 flex items-end justify-between space-x-2">
                    {analytics.monthlyRevenue.map((data: any, index: number) => {
                      const maxRevenue = Math.max(...analytics.monthlyRevenue.map((d: any) => d.revenue));
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                          <div className="text-xs text-slate-600">{formatCurrency(data.revenue)}</div>
                          <div 
                            className="bg-blue-600 rounded-t w-full transition-all hover:bg-blue-700"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div className="text-sm font-medium">{data.month}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">No revenue data available for this period</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCustomers.length > 0 ? (
                    analytics.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between">
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No customer revenue data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Multi Family NC Tab */}
        <TabsContent value="mfnc" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Multi Family NC Division</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Analytics for Multi Family North Carolina projects</p>
          </div>
          {/* Same structure as SFNC */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.revenueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.completedJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.jobsChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.avgJobValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.avgJobValueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.conversionRateChange)} from last period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">Loading revenue data...</div>
                  </div>
                ) : analytics.monthlyRevenue.length > 0 ? (
                  <div className="h-80 flex items-end justify-between space-x-2">
                    {analytics.monthlyRevenue.map((data: any, index: number) => {
                      const maxRevenue = Math.max(...analytics.monthlyRevenue.map((d: any) => d.revenue));
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                          <div className="text-xs text-slate-600">{formatCurrency(data.revenue)}</div>
                          <div 
                            className="bg-blue-600 rounded-t w-full transition-all hover:bg-blue-700"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div className="text-sm font-medium">{data.month}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">No revenue data available for this period</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCustomers.length > 0 ? (
                    analytics.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between">
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No customer revenue data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* R&R Tab */}
        <TabsContent value="rr" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">R&R Division</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Analytics for Repair & Retrofit projects</p>
          </div>
          {/* Same structure as other divisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.revenueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.completedJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.jobsChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.overview.avgJobValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.avgJobValueChange)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentChange(analytics.overview.conversionRateChange)} from last period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">Loading revenue data...</div>
                  </div>
                ) : analytics.monthlyRevenue.length > 0 ? (
                  <div className="h-80 flex items-end justify-between space-x-2">
                    {analytics.monthlyRevenue.map((data: any, index: number) => {
                      const maxRevenue = Math.max(...analytics.monthlyRevenue.map((d: any) => d.revenue));
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                          <div className="text-xs text-slate-600">{formatCurrency(data.revenue)}</div>
                          <div 
                            className="bg-blue-600 rounded-t w-full transition-all hover:bg-blue-700"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <div className="text-sm font-medium">{data.month}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-slate-500">No revenue data available for this period</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCustomers.length > 0 ? (
                    analytics.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between">
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No customer revenue data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  )
}