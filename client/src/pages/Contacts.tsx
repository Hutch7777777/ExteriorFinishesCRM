import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, 
  Plus, 
  Mail,
  Phone,
  MapPin,
  Users,
  Truck,
  Wrench,
  Star
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  company: string
  type: 'vendor' | 'subcontractor' | 'supplier' | 'internal' | 'partner'
  email: string
  phone: string
  address: string
  specialty?: string
  rating: number
  notes: string
  createdAt: string
}

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  // Mock data for demonstration
  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'Mike Johnson',
      company: 'ABC Roofing Supply',
      type: 'supplier',
      email: 'mike@abcroofing.com',
      phone: '(555) 234-5678',
      address: '123 Industrial Blvd, Chicago, IL',
      specialty: 'Roofing Materials',
      rating: 5,
      notes: 'Excellent supplier, fast delivery, competitive pricing',
      createdAt: '2025-01-08'
    },
    {
      id: '2',
      name: 'Sarah Williams',
      company: 'Elite Painters',
      type: 'subcontractor',
      email: 'sarah@elitepainters.com',
      phone: '(555) 345-6789',
      address: '456 Main St, Chicago, IL',
      specialty: 'Exterior Painting',
      rating: 4,
      notes: 'Reliable subcontractor for painting services',
      createdAt: '2025-01-07'
    },
    {
      id: '3',
      name: 'David Chen',
      company: 'Exterior Finishes',
      type: 'internal',
      email: 'david@exteriorfinishes.com',
      phone: '(555) 456-7890',
      address: '789 Company Ave, Chicago, IL',
      specialty: 'Project Manager',
      rating: 5,
      notes: 'Internal project manager for commercial division',
      createdAt: '2025-01-06'
    },
    {
      id: '4',
      name: 'Lisa Rodriguez',
      company: 'Metro Scaffolding',
      type: 'vendor',
      email: 'lisa@metroscaffolding.com',
      phone: '(555) 567-8901',
      address: '321 Equipment Way, Chicago, IL',
      specialty: 'Scaffolding & Equipment',
      rating: 4,
      notes: 'Equipment rental and scaffolding services',
      createdAt: '2025-01-05'
    }
  ]

  const contacts = mockContacts

  const getTypeColor = (type: Contact['type']) => {
    switch (type) {
      case 'vendor': return 'bg-blue-100 text-blue-800'
      case 'subcontractor': return 'bg-green-100 text-green-800'
      case 'supplier': return 'bg-purple-100 text-purple-800'
      case 'internal': return 'bg-orange-100 text-orange-800'
      case 'partner': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Contact['type']) => {
    switch (type) {
      case 'vendor': return <Truck className="w-4 h-4" />
      case 'subcontractor': return <Wrench className="w-4 h-4" />
      case 'supplier': return <Building2 className="w-4 h-4" />
      case 'internal': return <Users className="w-4 h-4" />
      case 'partner': return <Star className="w-4 h-4" />
      default: return <Building2 className="w-4 h-4" />
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Contact",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-50">
            {row.original.name}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {row.original.company}
          </div>
          {row.original.specialty && (
            <div className="text-xs text-slate-500 mt-1">
              {row.original.specialty}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge 
          variant="secondary" 
          className={`${getTypeColor(row.original.type)} flex items-center gap-1 w-fit`}
        >
          {getTypeIcon(row.original.type)}
          {row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact Info",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {row.original.email}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {row.original.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {renderStars(row.original.rating)}
          <span className="text-sm text-slate-600 ml-2">
            {row.original.rating}/5
          </span>
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="max-w-48 truncate">
            {row.original.address}
          </span>
        </div>
      ),
    },
  ]

  const filteredContacts = activeTab === 'all' 
    ? contacts 
    : contacts.filter(contact => contact.type === activeTab)

  const contactCounts = {
    all: contacts.length,
    vendor: contacts.filter(c => c.type === 'vendor').length,
    subcontractor: contacts.filter(c => c.type === 'subcontractor').length,
    supplier: contacts.filter(c => c.type === 'supplier').length,
    internal: contacts.filter(c => c.type === 'internal').length,
    partner: contacts.filter(c => c.type === 'partner').length,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Contacts Directory
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage vendors, subcontractors, suppliers, and team contacts
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Contact Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-fit">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({contactCounts.all})
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Vendors ({contactCounts.vendor})
          </TabsTrigger>
          <TabsTrigger value="subcontractor" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Subs ({contactCounts.subcontractor})
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Suppliers ({contactCounts.supplier})
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team ({contactCounts.internal})
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Partners ({contactCounts.partner})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <DataTable
            columns={columns}
            data={filteredContacts}
            searchPlaceholder="Search contacts..."
            isLoading={false}
            createAction={{
              label: "Add Contact",
              onClick: () => setIsCreateDialogOpen(true)
            }}
            emptyState={{
              icon: <Building2 className="w-12 h-12" />,
              title: "No contacts found",
              description: "Add your first contact to start building your network."
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Create Contact Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Add New Contact
            </DialogTitle>
            <DialogDescription>
              Add a new contact to your business directory. Choose the appropriate type for better organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input id="name" placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input id="company" placeholder="ABC Corp" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contact Type *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="internal">Internal Team</SelectItem>
                    <SelectItem value="partner">Business Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty/Role</Label>
                <Input id="specialty" placeholder="e.g., Roofing Materials, Project Manager" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="(555) 123-4567" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main St, Chicago, IL 60601" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional information about this contact..."
                className="min-h-20"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}