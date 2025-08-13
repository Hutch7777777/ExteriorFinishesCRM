import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useParams } from 'wouter'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
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
  Star,
  Edit2
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
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    company: '',
    type: 'vendor' as Contact['type'],
    email: '',
    phone: '',
    address: '',
    specialty: '',
    rating: 0,
    notes: ''
  })
  const { toast } = useToast()
  const params = useParams()
  
  // Get contacts from API
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/trpc/contacts.list', params.division],
    queryFn: async () => {
      const response = await fetch(`/api/trpc/contacts.list?divisionKey=${params.division || 'all'}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      console.log('Contacts API response:', data);
      // Handle superjson serialized data
      if (data.result && data.result.json) {
        return Array.isArray(data.result.json) ? data.result.json : [];
      }
      return Array.isArray(data.result) ? data.result : [];
    }
  })

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await apiRequest('POST', '/api/trpc/contacts.create', {
        input: { ...contactData, divisionKey: params.division || 'mfnc' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/contacts.list'] })
      setIsCreateDialogOpen(false)
      resetForm()
      toast({
        title: "Success",
        description: "Contact created successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact.",
        variant: "destructive"
      })
    }
  })

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await apiRequest('POST', '/api/trpc/contacts.update', {
        input: contactData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/contacts.list'] })
      setEditingContact(null)
      resetForm()
      toast({
        title: "Success",
        description: "Contact updated successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact.",
        variant: "destructive"
      })
    }
  })

  const resetForm = () => {
    setNewContact({
      name: '',
      company: '',
      type: 'vendor',
      email: '',
      phone: '',
      address: '',
      specialty: '',
      rating: 0,
      notes: ''
    })
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setNewContact({
      name: contact.name,
      company: contact.company,
      type: contact.type,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      specialty: contact.specialty || '',
      rating: contact.rating,
      notes: contact.notes
    })
    setIsCreateDialogOpen(true)
  }

  // Ensure contacts is always an array
  const contactsArray = Array.isArray(contacts) ? contacts : [];

  // Filter contacts by type
  const filteredContacts = activeTab === 'all' 
    ? contactsArray 
    : contactsArray.filter((contact: Contact) => contact.type === activeTab)

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContact) {
      updateContactMutation.mutate({
        id: editingContact.id,
        ...newContact
      })
    } else {
      createContactMutation.mutate(newContact)
    }
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsCreateDialogOpen(false)
    setEditingContact(null)
    resetForm()
  }

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
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {row.original.name}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {row.original.company}
          </div>
          {row.original.specialty && (
            <div className="text-xs text-slate-500 dark:text-slate-500">
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
        <Badge className={getTypeColor(row.original.type)}>
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const contactCounts = {
    all: contactsArray.length,
    vendor: contactsArray.filter((c: Contact) => c.type === 'vendor').length,
    subcontractor: contactsArray.filter((c: Contact) => c.type === 'subcontractor').length,
    supplier: contactsArray.filter((c: Contact) => c.type === 'supplier').length,
    internal: contactsArray.filter((c: Contact) => c.type === 'internal').length,
    partner: contactsArray.filter((c: Contact) => c.type === 'partner').length,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Contacts Directory
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage vendors, subcontractors, suppliers, and team contacts
        </p>
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
            isLoading={isLoading}
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

      {/* Create/Edit Contact Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingContact 
                ? 'Update the contact information below.' 
                : 'Add a new contact to your business directory. Choose the appropriate type for better organization.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input 
                  id="name" 
                  placeholder="John Smith"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input 
                  id="company" 
                  placeholder="ABC Corp"
                  value={newContact.company}
                  onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contact Type *</Label>
                <Select 
                  value={newContact.type}
                  onValueChange={(value) => setNewContact({...newContact, type: value as Contact['type']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input 
                  id="specialty" 
                  placeholder="e.g., Roofing, Electrical"
                  value={newContact.specialty}
                  onChange={(e) => setNewContact({...newContact, specialty: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@company.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="(555) 123-4567"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="123 Business St, Chicago, IL"
                value={newContact.address}
                onChange={(e) => setNewContact({...newContact, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes about this contact..."
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createContactMutation.isPending || updateContactMutation.isPending}
              >
                {editingContact 
                  ? (updateContactMutation.isPending ? 'Updating...' : 'Update Contact')
                  : (createContactMutation.isPending ? 'Creating...' : 'Create Contact')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}