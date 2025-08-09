import { useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Briefcase } from 'lucide-react'

export default function Jobs() {
  const { division } = useParams({ strict: false })

  // Mock data for demonstration
  const jobs = [
    {
      id: 1,
      title: 'Residential Siding Installation',
      customer: 'John Smith',
      status: 'In Progress',
      startDate: '2024-01-15',
      estimatedValue: '$25,000'
    },
    {
      id: 2,
      title: 'Commercial Exterior Renovation',
      customer: 'ABC Corp',
      status: 'Planning',
      startDate: '2024-02-01',
      estimatedValue: '$75,000'
    }
  ]

  const columns = [
    { key: 'title', header: 'Job Title', sortable: true },
    { key: 'customer', header: 'Customer', sortable: true },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'In Progress' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    { key: 'startDate', header: 'Start Date', sortable: true },
    { key: 'estimatedValue', header: 'Estimated Value' },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <Button variant="outline" size="sm">
          View
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Jobs</h1>
            <p className="text-muted-foreground">
              Division: {division?.toUpperCase()}
            </p>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={jobs}
            columns={columns}
            searchPlaceholder="Search jobs..."
          />
        </CardContent>
      </Card>
    </div>
  )
}