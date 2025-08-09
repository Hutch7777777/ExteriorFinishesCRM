import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import EstimateForm from "@/components/forms/EstimateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Calendar, DollarSign, User, FileText } from "lucide-react";
import type { EstimateWithRelations } from "@shared/schema";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Estimates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<EstimateWithRelations | null>(null);

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

  const { data: estimates = [], isLoading: estimatesLoading } = useQuery<EstimateWithRelations[]>({
    queryKey: ['/api/estimates'],
    retry: false,
  });

  const handleEdit = (estimate: EstimateWithRelations) => {
    setEditingEstimate(estimate);
    setShowEstimateForm(true);
  };

  const handleFormSuccess = () => {
    setShowEstimateForm(false);
    setEditingEstimate(null);
  };

  const handleFormClose = () => {
    setShowEstimateForm(false);
    setEditingEstimate(null);
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
          title="Estimates" 
          subtitle="Create and manage project estimates"
          onCreateEstimate={() => setShowEstimateForm(true)}
        />
        
        <main className="p-8">
          {estimatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : estimates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No estimates found</h3>
                <p className="text-slate-500 mb-6">Get started by creating your first estimate.</p>
                <Button onClick={() => setShowEstimateForm(true)}>
                  Create Estimate
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estimates.map((estimate) => (
                <Card key={estimate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{estimate.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            ${Number(estimate.amount).toLocaleString()}
                          </span>
                        </div>
                        <Badge className={getStatusColor(estimate.status)}>
                          {formatStatus(estimate.status)}
                        </Badge>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(estimate)}
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

                    <div className="space-y-3">
                      {estimate.customer && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="h-4 w-4" />
                          <span>{estimate.customer.name}</span>
                        </div>
                      )}
                      
                      {estimate.job && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FileText className="h-4 w-4" />
                          <span>{estimate.job.title}</span>
                        </div>
                      )}
                      
                      {estimate.validUntil && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>Valid until: {new Date(estimate.validUntil).toLocaleDateString()}</span>
                        </div>
                      )}

                      {estimate.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {estimate.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Estimate Form Dialog */}
      <Dialog open={showEstimateForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEstimate ? 'Edit Estimate' : 'Create New Estimate'}
            </DialogTitle>
          </DialogHeader>
          <EstimateForm 
            onSuccess={handleFormSuccess}
            initialData={editingEstimate || undefined}
            estimateId={editingEstimate?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
