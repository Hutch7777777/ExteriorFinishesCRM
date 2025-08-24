import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CustomerForm from "@/components/forms/CustomerForm";
import JobForm from "@/components/forms/JobForm";
import EstimateForm from "@/components/forms/EstimateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Calculator, Building, House } from "lucide-react";
import type { CustomerWithRelations, JobWithRelations, EstimateWithRelations, Division as DivisionType } from "@shared/schema";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'planning':
      return 'bg-blue-100 text-blue-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Division() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { divisionType } = useParams();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showEstimateForm, setShowEstimateForm] = useState(false);

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

  // Get the specific division
  const { data: divisions = [] } = useQuery<DivisionType[]>({
    queryKey: ['/api/divisions'],
    retry: false,
  });

  const currentDivision = divisions.find(d => d.type === divisionType);

  // Get data filtered by division
  const { data: customers = [], isLoading: customersLoading } = useQuery<CustomerWithRelations[]>({
    queryKey: ['/api/customers', currentDivision?.id],
    enabled: !!currentDivision,
    retry: false,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithRelations[]>({
    queryKey: ['/api/jobs', currentDivision?.id],
    enabled: !!currentDivision,
    retry: false,
  });

  const { data: estimates = [], isLoading: estimatesLoading } = useQuery<EstimateWithRelations[]>({
    queryKey: ['/api/estimates', currentDivision?.id],
    enabled: !!currentDivision,
    retry: false,
  });

  const handleFormSuccess = () => {
    setShowCustomerForm(false);
    setShowJobForm(false);
    setShowEstimateForm(false);
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

  if (!currentDivision) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Division Not Found" />
          <main className="p-8">
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Division not found</h3>
                <p className="text-slate-500">The requested division does not exist.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const divisionIcon = currentDivision.type === 'residential' ? House : Building;
  const DivisionIcon = divisionIcon;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title={`${currentDivision.name} Division`}
          subtitle={`Manage ${currentDivision.type} projects and customers`}
          onCreateCustomer={() => setShowCustomerForm(true)}
          onCreateJob={() => setShowJobForm(true)}
          onCreateEstimate={() => setShowEstimateForm(true)}
        />
        
        <main className="p-8">
          {/* Division Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DivisionIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{currentDivision.name}</h2>
                  <p className="text-sm text-slate-500 font-normal">
                    {currentDivision.description || `${formatStatus(currentDivision.type)} division`}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-semibold text-slate-900">{customers.length}</span>
                  </div>
                  <p className="text-sm text-slate-600">Customers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-semibold text-slate-900">{jobs.length}</span>
                  </div>
                  <p className="text-sm text-slate-600">Jobs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    <span className="text-2xl font-semibold text-slate-900">{estimates.length}</span>
                  </div>
                  <p className="text-sm text-slate-600">Estimates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="customers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              {customersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : customers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-slate-500 mb-4">No customers in this division yet.</p>
                    <Button onClick={() => setShowCustomerForm(true)}>
                      Add Customer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-1">{customer.name}</h3>
                        {customer.email && (
                          <p className="text-sm text-slate-600 mb-2">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-slate-600">{customer.phone}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              {jobsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-slate-500 mb-4">No jobs in this division yet.</p>
                    <Button onClick={() => setShowJobForm(true)}>
                      Create Job
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{job.projectType || 'Job'}</h3>
                          <Badge className={getStatusColor(job.status)}>
                            {formatStatus(job.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{job.projectType}</p>
                        {job.customer && (
                          <p className="text-sm text-slate-600">{job.customer.name}</p>
                        )}
                        {job.value && (
                          <p className="text-sm font-medium text-green-600 mt-2">
                            ${Number(job.value).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="estimates" className="space-y-6">
              {estimatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : estimates.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-slate-500 mb-4">No estimates in this division yet.</p>
                    <Button onClick={() => setShowEstimateForm(true)}>
                      Create Estimate
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estimates.map((estimate) => (
                    <Card key={estimate.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{estimate.title}</h3>
                          <Badge className={getStatusColor(estimate.status)}>
                            {formatStatus(estimate.status)}
                          </Badge>
                        </div>
                        {estimate.customer && (
                          <p className="text-sm text-slate-600 mb-1">{estimate.customer.name}</p>
                        )}
                        <p className="text-sm font-medium text-green-600">
                          ${Number((Number(estimate.totalCents) || 0) / 100).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Forms Dialogs */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Customer to {currentDivision.name}</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            onSuccess={handleFormSuccess}
            initialData={{ divisionId: currentDivision.id }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Job in {currentDivision.name}</DialogTitle>
          </DialogHeader>
          <JobForm 
            onSuccess={handleFormSuccess}
            initialData={{ divisionId: currentDivision.id }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEstimateForm} onOpenChange={setShowEstimateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Estimate in {currentDivision.name}</DialogTitle>
          </DialogHeader>
          <EstimateForm 
            onSuccess={handleFormSuccess}
            initialData={{ divisionId: currentDivision.id }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
