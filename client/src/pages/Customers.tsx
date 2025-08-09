import { useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

export default function Customers() {
  const { division } = useParams({ strict: false })

  // Mock data for demonstration
  const customers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      city: 'Springfield',
      state: 'IL'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 987-6543',
      city: 'Chicago',
      state: 'IL'
    }
  ]

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'city', header: 'City', sortable: true },
    { key: 'state', header: 'State' },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <Button variant="outline" size="sm">
          Edit
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">
              Division: {division?.toUpperCase()}
            </p>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={customers}
            columns={columns}
            searchPlaceholder="Search customers..."
          />
        </CardContent>
      </Card>
    </div>
  )
}