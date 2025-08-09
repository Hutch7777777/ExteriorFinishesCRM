import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CustomerForm from "@/components/forms/CustomerForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Phone, Mail } from "lucide-react";
import type { CustomerWithRelations } from "@shared/schema";

export default function Customers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithRelations | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: customers = [], isLoading: customersLoading } = useQuery<CustomerWithRelations[]>({
    queryKey: ['/api/customers'],
    retry: false,
  });

  const handleEdit = (customer: CustomerWithRelations) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleFormSuccess = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleFormClose = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title="Customers" 
          subtitle="Manage your customer database"
          onCreateCustomer={() => setShowCustomerForm(true)}
        />
        
        <main className="p-8">
          {customersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers found</h3>
                <p className="text-slate-500 mb-6">Get started by adding your first customer.</p>
                <Button onClick={() => setShowCustomerForm(true)}>
                  Add Customer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        {customer.division && (
                          <Badge variant="secondary" className="mt-1">
                            {customer.division.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>
                          <div>{customer.address}</div>
                          {(customer.city || customer.state || customer.zipCode) && (
                            <div>
                              {customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state} {customer.zipCode}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm 
            onSuccess={handleFormSuccess}
            initialData={editingCustomer || undefined}
            customerId={editingCustomer?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
