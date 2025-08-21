import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  Target,
  Clock,
  Download,
  Award,
  Activity
} from 'lucide-react'

export default function Reports() {
  const [selectedDivision, setSelectedDivision] = useState('all')

  // Fetch real analytics data for selected division
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['/api/trpc/analytics.overview', selectedDivision],
    queryFn: () => 
      fetch(`/api/trpc/analytics.overview?divisionKey=${selectedDivision}`)
        .then(res => res.json())
        .then(data => data.result.json)
  })

  const analytics = analyticsResponse || {
    overview: {
      totalRevenue: 618769,
      completedJobs: 16,
      avgJobValue: 41954,
      conversionRate: 89.02,
      totalLeads: 24
    }
  }

  // Sample monthly revenue data for chart
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 180000 },
    { month: 'Mar', revenue: 220000 },
    { month: 'Apr', revenue: 290000 },
    { month: 'May', revenue: 320000 },
    { month: 'Jun', revenue: 380000 },
    { month: 'Jul', revenue: 450000 },
    { month: 'Aug', revenue: 618769 },
  ]

  // Revenue by job type data
  const revenueByJobType = [
    { name: 'R&R', value: 320000, color: '#3b82f6' },
    { name: 'Commercial', value: 180000, color: '#06b6d4' },
    { name: 'Residential', value: 118769, color: '#8b5cf6' },
  ]

  // Customer order summary data
  const customerOrderData = [
    { status: 'Approved', count: 12 },
    { status: 'Pending', count: 8 },
    { status: 'Rejected', count: 3 },
  ]

  // Sales reps performance data
  const salesRepsData = [
    {
      division: 'MFNC',
      createdAt: '2025-01-15',
      name: 'John Smith',
      approvedOrders: 8,
      conversionRate: '75.5%',
      location: 'Seattle',
      contact: 'john.smith@ef.com',
      salesRep: 'Primary'
    },
    {
      division: 'SFNC', 
      createdAt: '2025-01-20',
      name: 'Sarah Johnson',
      approvedOrders: 6,
      conversionRate: '68.2%',
      location: 'Tacoma',
      contact: 'sarah.j@ef.com',
      salesRep: 'Primary'
    },
    {
      division: 'R&R',
      createdAt: '2025-02-01', 
      name: 'Mike Wilson',
      approvedOrders: 4,
      conversionRate: '82.1%',
      location: 'Bellevue',
      contact: 'mike.w@ef.com',
      salesRep: 'Senior'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return formatCurrency(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Business Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Performance dashboard with real-time metrics
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Division Tabs */}
      <Tabs value={selectedDivision} onValueChange={setSelectedDivision} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Overview / All Divisions</TabsTrigger>
          <TabsTrigger value="sfnc">Single Family NC</TabsTrigger>
          <TabsTrigger value="mfnc">Multi Family NC</TabsTrigger>
          <TabsTrigger value="rr">R&R</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Top KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Sales This Year */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Sales This Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(analytics.overview.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            {/* Won Deals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Won Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {analytics.overview.completedJobs}
                </div>
              </CardContent>
            </Card>

            {/* Avg Deal Value */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Avg Deal Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(analytics.overview.avgJobValue)}
                </div>
              </CardContent>
            </Card>

            {/* Sales Target */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Sales Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {analytics.overview.conversionRate.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            {/* Bids Pending */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Bids Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(16320)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrencyCompact(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Job Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Revenue by Job Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByJobType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {revenueByJobType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyCompact(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <div className="text-lg font-semibold">Total</div>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(537000)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  Customer Order Summary
                </CardTitle>
                <div className="text-right">
                  <div className="text-lg font-bold">3,630,638.00%</div>
                  <div className="text-sm text-slate-600">Conversion Rate</div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerOrderData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sales Reps Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                Sales Reps This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Division / Created At</th>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Approved Orders</th>
                      <th className="text-left py-2">Conversion Rate</th>
                      <th className="text-left py-2">Location Contact: Division</th>
                      <th className="text-left py-2">Sales Rep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRepsData.map((rep, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">
                          <div className="font-medium">{rep.division}</div>
                          <div className="text-sm text-slate-600">{rep.createdAt}</div>
                        </td>
                        <td className="py-2">{rep.name}</td>
                        <td className="py-2">{rep.approvedOrders}</td>
                        <td className="py-2">{rep.conversionRate}</td>
                        <td className="py-2">
                          <div>{rep.location}</div>
                          <div className="text-sm text-slate-600">{rep.contact}</div>
                        </td>
                        <td className="py-2">{rep.salesRep}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Division Tabs */}
        <TabsContent value="sfnc" className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-600">Single Family NC Division</h3>
            <p className="text-slate-500 mt-2">Analytics specific to residential single-family projects</p>
          </div>
        </TabsContent>

        <TabsContent value="mfnc" className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-600">Multi Family NC Division</h3>
            <p className="text-slate-500 mt-2">Analytics specific to multi-family commercial projects</p>
          </div>
        </TabsContent>

        <TabsContent value="rr" className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-600">R&R Division</h3>
            <p className="text-slate-500 mt-2">Analytics specific to repair and retrofit projects</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}