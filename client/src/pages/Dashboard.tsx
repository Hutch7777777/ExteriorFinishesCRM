import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricsCard from "@/components/dashboard/MetricsCard";
import RecentJobsTable from "@/components/dashboard/RecentJobsTable";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import CustomerForm from "@/components/forms/CustomerForm";
import JobForm from "@/components/forms/JobForm";
import EstimateForm from "@/components/forms/EstimateForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Briefcase, Users, Calculator } from "lucide-react";
import type { JobWithRelations, ActivityLog } from "@shared/schema";

interface DashboardMetrics {
  totalRevenue: number;
  activeJobs: number;
  totalCustomers: number;
  pendingEstimates: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    retry: false,
  });

  const { data: recentJobs = [], isLoading: jobsLoading } = useQuery<JobWithRelations[]>({
    queryKey: ['/api/dashboard/recent-jobs'],
    retry: false,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/dashboard/recent-activity'],
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title="Dashboard" 
          subtitle="Welcome back, track your business performance"
          onCreateCustomer={() => setShowCustomerForm(true)}
          onCreateJob={() => setShowJobForm(true)}
          onCreateEstimate={() => setShowEstimateForm(true)}
        />
        
        <main className="p-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              label="Total Revenue"
              value={metrics?.totalRevenue || 0}
              change={{
                value: "+12.5%",
                type: "increase",
                label: "from last month"
              }}
              icon={DollarSign}
              iconColor="bg-green-100 text-green-600"
            />
            
            <MetricsCard
              label="Active Jobs"
              value={metrics?.activeJobs || 0}
              change={{
                value: "+3",
                type: "increase",
                label: "this week"
              }}
              icon={Briefcase}
              iconColor="bg-blue-100 text-blue-600"
            />
            
            <MetricsCard
              label="Total Customers"
              value={metrics?.totalCustomers || 0}
              change={{
                value: "+8",
                type: "increase",
                label: "new this month"
              }}
              icon={Users}
              iconColor="bg-purple-100 text-purple-600"
            />
            
            <MetricsCard
              label="Pending Estimates"
              value={metrics?.pendingEstimates || 0}
              change={{
                value: "5 overdue",
                type: "neutral",
                label: "need attention"
              }}
              icon={Calculator}
              iconColor="bg-amber-100 text-amber-600"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Jobs Table */}
            <RecentJobsTable jobs={recentJobs} isLoading={jobsLoading} />

            {/* Right Sidebar Content */}
            <div className="space-y-6">
              <QuickActions
                onCreateCustomer={() => setShowCustomerForm(true)}
                onCreateJob={() => setShowJobForm(true)}
                onCreateEstimate={() => setShowEstimateForm(true)}
              />

              <RecentActivity activities={recentActivity} isLoading={activityLoading} />

              {/* Performance Summary */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Jobs Completed</span>
                    <span className="font-semibold text-slate-900">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Estimates Sent</span>
                    <span className="font-semibold text-slate-900">15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">New Customers</span>
                    <span className="font-semibold text-slate-900">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Revenue</span>
                    <span className="font-semibold text-slate-900">
                      ${(metrics?.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Forms Dialogs */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEstimateForm} onOpenChange={setShowEstimateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
