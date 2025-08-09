import { useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calculator } from 'lucide-react'

export default function Estimates() {
  const { division } = useParams({ strict: false })

  // Mock data for demonstration
  const estimates = [
    {
      id: 1,
      title: 'Siding Installation Quote',
      customer: 'John Smith',
      status: 'Sent',
      amount: '$25,000',
      validUntil: '2024-02-15'
    },
    {
      id: 2,
      title: 'Exterior Repair Estimate',
      customer: 'Jane Doe',
      status: 'Draft',
      amount: '$12,500',
      validUntil: '2024-02-28'
    }
  ]

  const columns = [
    { key: 'title', header: 'Estimate Title', sortable: true },
    { key: 'customer', header: 'Customer', sortable: true },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Sent' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    { key: 'amount', header: 'Amount', sortable: true },
    { key: 'validUntil', header: 'Valid Until', sortable: true },
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
          <Calculator className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Estimates</h1>
            <p className="text-muted-foreground">
              Division: {division?.toUpperCase()}
            </p>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Estimate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimate List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={estimates}
            columns={columns}
            searchPlaceholder="Search estimates..."
          />
        </CardContent>
      </Card>
    </div>
  )
}