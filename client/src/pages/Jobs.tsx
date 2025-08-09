import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import JobForm from "@/components/forms/JobForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Calendar, DollarSign, User } from "lucide-react";
import type { JobWithRelations } from "@shared/schema";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'planning':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Jobs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithRelations | null>(null);

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

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithRelations[]>({
    queryKey: ['/api/jobs'],
    retry: false,
  });

  const handleEdit = (job: JobWithRelations) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleFormSuccess = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleFormClose = () => {
    setShowJobForm(false);
    setEditingJob(null);
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
          title="Jobs" 
          subtitle="Track and manage all your projects"
          onCreateJob={() => setShowJobForm(true)}
        />
        
        <main className="p-8">
          {jobsLoading ? (
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
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-500 mb-6">Get started by creating your first job.</p>
                <Button onClick={() => setShowJobForm(true)}>
                  Create Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-slate-600 mb-2">{job.projectType}</p>
                        <Badge className={getStatusColor(job.status)}>
                          {formatStatus(job.status)}
                        </Badge>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(job)}
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
                      {job.customer && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="h-4 w-4" />
                          <span>{job.customer.name}</span>
                        </div>
                      )}
                      
                      {job.value && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <DollarSign className="h-4 w-4" />
                          <span>${Number(job.value).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {job.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(job.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {job.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {job.description}
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

      {/* Job Form Dialog */}
      <Dialog open={showJobForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit Job' : 'Create New Job'}
            </DialogTitle>
          </DialogHeader>
          <JobForm 
            onSuccess={handleFormSuccess}
            initialData={editingJob || undefined}
            jobId={editingJob?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
